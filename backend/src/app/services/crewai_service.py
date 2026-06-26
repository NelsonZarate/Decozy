"""CrewAI service for prompt optimization and asset creation."""

import json
import os
from typing import Any, Literal, Type

from crewai import Agent, Crew, Process, Task
from crewai.events.types.llm_events import LLMCallType
from crewai.llms.base_llm import BaseLLM, llm_call_context
from crewai.tasks.task_output import TaskOutput
from crewai.tools import BaseTool
from pydantic import BaseModel, Field, PrivateAttr, model_validator
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.core.settings import settings
from app.database.session import SessionLocal
from app.models.item import ItemModel

logger = get_logger(__name__)


class LangChainGroqLLM(BaseLLM):
    llm_type: str = "langchain_groq"
    timeout: float | None = None
    max_tokens: int | None = None
    max_retries: int = 2
    _chat_model: Any = PrivateAttr(default=None)

    def _get_chat_model(self) -> Any:
        if self._chat_model is None:
            from langchain_groq import ChatGroq

            if self.api_key:
                os.environ["GROQ_API_KEY"] = self.api_key

            self._chat_model = ChatGroq(
                model=self.model,
                temperature=self.temperature or 0,
                max_tokens=self.max_tokens,
                timeout=self.timeout,
                max_retries=self.max_retries,
            )
        return self._chat_model

    def call(
        self,
        messages: str | list[dict[str, Any]],
        tools: list[dict[str, BaseTool]] | None = None,
        callbacks: list[Any] | None = None,
        available_functions: dict[str, Any] | None = None,
        from_task: Task | None = None,
        from_agent: Agent | None = None,
        response_model: type[BaseModel] | None = None,
    ) -> str | BaseModel:
        del tools, callbacks, available_functions

        try:
            with llm_call_context():
                normalized_messages = self._normalize_messages(messages)
                self._emit_call_started_event(
                    normalized_messages,
                    from_task=from_task,
                    from_agent=from_agent,
                )

                invoke_kwargs: dict[str, Any] = {}
                if self.stop_sequences and self.supports_stop_words():
                    invoke_kwargs["stop"] = self.stop_sequences

                response = self._get_chat_model().invoke(
                    normalized_messages,
                    **invoke_kwargs,
                )
                content = self._stringify_content(getattr(response, "content", response))

                usage = getattr(response, "usage_metadata", None)
                if not usage:
                    usage = getattr(response, "response_metadata", {}).get("token_usage")
                if usage:
                    self._track_token_usage_internal(usage)

                content = self._apply_stop_words(content)
                self._emit_call_completed_event(
                    content,
                    LLMCallType.LLM_CALL,
                    from_task=from_task,
                    from_agent=from_agent,
                    messages=normalized_messages,
                    usage=usage,
                )

                return self._validate_structured_output(content, response_model)
        except Exception as e:
            self._emit_call_failed_event(str(e), from_task=from_task, from_agent=from_agent)
            raise

    @staticmethod
    def _normalize_messages(messages: str | list[dict[str, Any]]) -> list[dict[str, str]]:
        if isinstance(messages, str):
            return [{"role": "user", "content": messages}]

        normalized: list[dict[str, str]] = []
        for message in messages:
            role = message.get("role", "user")
            if role == "developer":
                role = "system"
            normalized.append(
                {
                    "role": role,
                    "content": LangChainGroqLLM._stringify_content(message.get("content", "")),
                }
            )
        return normalized

    @staticmethod
    def _stringify_content(content: Any) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for block in content:
                if isinstance(block, dict) and "text" in block:
                    parts.append(str(block["text"]))
                else:
                    parts.append(json.dumps(block, ensure_ascii=False))
            return "\n".join(parts)
        return json.dumps(content, ensure_ascii=False)


class SaveItemToolInput(BaseModel):
    name: str = Field(..., description="Commercial furniture or decor item name.")
    category: str = Field(..., description="Furniture category, e.g. Sofa, Lighting, Rug.")
    price: str | None = Field(None, description="Display price with currency.")
    buy_url: str | None = Field(None, description="Plausible purchase URL.")


class SavedItemResult(BaseModel):
    status: Literal["saved"] = "saved"
    item_id: int
    name: str
    category: str
    price: str | None = None
    image_url: str
    buy_url: str | None = None


class PromptArchitectureResult(BaseModel):
    status: Literal["valid", "rejected"]
    intent: Literal["add", "remove", "none"] = Field(
        default="none", 
        description="Whether the user wants to add items, remove items, or make no changes."
    )
    items_to_add: list[str] = Field(
        default_factory=list, 
        description="List of specific new items the user wants to add. Empty if intent is not 'add'."
    )
    optimized_prompt: str | None = None
    reason: str | None = None

    @model_validator(mode="after")
    def validate_status_payload(self) -> "PromptArchitectureResult":
        if self.status == "rejected":
            if not self.reason:
                raise ValueError("Rejected prompt results must include a reason.")
            return self

        if self.intent in ["add", "remove"] and not self.optimized_prompt:
            raise ValueError("Valid modification prompts must include optimized_prompt.")
        return self


class DatabaseTool(BaseTool):
    name: str = "save_recommended_furniture_item"
    description: str = (
        "Save one invented furniture/decor item to the application's database. "
        "Use this after choosing the best shoppable asset for the generated room image. "
        "The project, user, and generated image URL are already configured in the tool."
    )
    args_schema: Type[BaseModel] = SaveItemToolInput
    project_id: int
    image_url: str

    def _run(
        self,
        name: str,
        category: str,
        price: str | None = None,
        buy_url: str | None = None,
    ) -> str:
        from app.services.ai_service import AIService
        from app.services.upload import UploadService

        db: Session = SessionLocal()
        try:
            logger.info("DatabaseTool: Generating image for item: %s", name)
            item_image_url = self.image_url  # fallback
            try:
                item_image_bytes = AIService.generate_item_image(f"{name} ({category})")
                item_filename = UploadService.save_bytes_to_file(item_image_bytes, prefix="item_")
                item_image_url = f"/static/uploads/{item_filename}"
                logger.info("DatabaseTool: Item image generated: %s", item_image_url)
            except Exception as img_err:
                logger.warning("DatabaseTool: Image generation failed, using room image: %s", img_err)

            logger.info("DatabaseTool: Inserting item project_id=%d, name=%s", self.project_id, name)
            item = ItemModel(
                project_id=self.project_id,
                name=name,
                category=category,
                price=price,
                image_url=item_image_url,
                buy_url=buy_url,
            )
            db.add(item)
            db.flush()

            result = SavedItemResult(
                item_id=item.id,
                name=item.name,
                category=item.category,
                price=item.price,
                image_url=item.image_url,
                buy_url=item.buy_url,
            )
            db.commit()
            logger.info("DatabaseTool: Item saved successfully: %s", result.model_dump())
            return result.model_dump_json()
        except Exception as e:
            db.rollback()
            logger.error("DatabaseTool: Failed to insert item: %s", e)
            raise
        finally:
            db.close()


def _log_task_result(label: str):
    """Create a callback that logs task completion.

    Args:
        label: Label prefix for the log message.
    """
    def _callback(result: TaskOutput) -> None:
        logger.info("%s finished: %s", label, result)

    return _callback


def _build_groq_llm() -> LangChainGroqLLM:
    if not settings.groq_api_key:
        raise RuntimeError("groq_api_key não está configurada no ambiente.")

    return LangChainGroqLLM(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        temperature=0,
        timeout=60,
        max_retries=2,
    )


def build_prompt_architect_crew() -> Crew:
    llm = _build_groq_llm()
    prompt_architect = Agent(
        role="Interior Prompt Architect",
        goal=(
            "Analyze the user's request to modify an existing room layout. "
            "Isolate modifications without altering the pre-existing style, architecture, or base assets."
        ),
        backstory=(
            "You are a strict creative director for AI interior imagery. Your golden rule is PRESERVATION. "
            "When a user asks to modify an existing room, you MUST retain 100% of the original room style, "
            "colors, materials, and layout, only additive or subtractive changes are allowed. "
            "You never hallucinate changes that the user didn't explicitly request. "
            "If the user wants a 'red rug', the existing blue sofa and white walls "
            "MUST remain untouched in your description."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
    )

    validate_and_optimize_prompt = Task(
        description=(
            "Review this user prompt: {user_prompt}\n\n"
            "CRITICAL CONSTRAINTS FOR OPTIMIZATION:\n"
            "1. Is it about interior decoration? If not, status is 'rejected' with a reason.\n"
            "2. If valid, isolate the intent ('add', 'remove', or 'none').\n"
            "3. If the intent is 'add' or 'remove', you MUST generate an "
            "`optimized_prompt` designed for an image-to-image or inpainting model.\n"
            "4. DO NOT rewrite the entire room composition. Use anchoring language. "
            "Maintain the base environment identical. "
            "Only describe the precise insertion or removal of the item: {user_prompt}.\n"
            "5. If adding items, explicitly list them in 'items_to_add'."
        ),
        expected_output=(
            "Strict JSON matching the PromptArchitectureResult schema. "
            "The optimized_prompt must focus purely on modifying the targeted elements "
            "while preserving the original room framework."
        ),
        agent=prompt_architect,
        output_json=PromptArchitectureResult,
        callback=_log_task_result("Agente 1 - Architect"),
    )

    return Crew(
        agents=[prompt_architect],
        tasks=[validate_and_optimize_prompt],
        process=Process.sequential,
        verbose=True,
    )

def build_asset_crew(
    project_id: int,
    generated_image_url: str,
) -> Crew:
    llm = _build_groq_llm()
    database_tool = DatabaseTool(
        project_id=project_id,
        image_url=generated_image_url,
    )

    asset_specialist = Agent(
        role="Interior E-commerce Asset Specialist",
        goal=(
            "Identify and extract the single specific furniture or decor asset requested by the user, "
            "save it using the database tool, and return strict JSON."
        ),
        backstory=(
            "You are a highly disciplined product curator. You never inventory the entire room. "
            "You ONLY look at the specific asset that was freshly added or targeted by the user. "
            "If the user added a lamp, you only create an asset for that lamp. "
            "You ignore the pre-existing sofa, walls, and floors. "
            "You output pure, structured data with absolutely no conversational prose."
        ),
        llm=llm,
        tools=[database_tool],
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )

    save_asset = Task(
        description=(
            "The image was generated from this optimized prompt: {optimized_prompt}\n\n"
            "Generated image URL: {generated_image_url}\n\n"
            "DANGER ZONE INSTRUCTION: Look ONLY at the item explicit in: {items_to_create}.\n"
            "Do NOT create database entries for pre-existing furniture seen in the background.\n"
            "Invent a commercial product name, category, a plausible price (e.g. '€299.99'), "
            "and a plausible buy URL. You MUST call the 'save_recommended_furniture_item' tool. "
            "After the tool succeeds, return exactly the JSON response."
        ),
        expected_output=(
            "Strict JSON only matching the SavedItemResult schema, mapping exclusively the requested asset."
        ),
        agent=asset_specialist,
        output_json=SavedItemResult,
        callback=_log_task_result("Agente 2 - Asset Specialist"),
    )

    return Crew(
        agents=[asset_specialist],
        tasks=[save_asset],
        process=Process.sequential,
        verbose=True,
    )
    

def _extract_strict_json(crew_result: Any) -> str:
    raw = getattr(crew_result, "raw", None)
    json_dict = getattr(crew_result, "json_dict", None)
    if raw is None:
        if json_dict:
            raw = json.dumps(json_dict, ensure_ascii=False)
        else:
            raw = str(crew_result)
    if not isinstance(raw, str):
        raise ValueError("CrewAI não devolveu uma resposta JSON em string.")

    raw = raw.strip()
    if not raw.startswith("{") or not raw.endswith("}"):
        raise ValueError("O agente não devolveu JSON estrito.")

    return raw


def parse_prompt_architect_result(crew_result: Any) -> PromptArchitectureResult:
    return PromptArchitectureResult.model_validate_json(_extract_strict_json(crew_result))


def parse_asset_crew_result(crew_result: Any) -> SavedItemResult:
    return SavedItemResult.model_validate_json(_extract_strict_json(crew_result))
