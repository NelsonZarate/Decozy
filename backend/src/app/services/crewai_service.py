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

from app.core.settings import settings
from app.database.session import SessionLocal
from app.models.item import ItemModel


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
    optimized_prompt: str | None = None
    reason: str | None = None

    @model_validator(mode="after")
    def validate_status_payload(self) -> "PromptArchitectureResult":
        if self.status == "rejected":
            if not self.reason:
                raise ValueError("Rejected prompt results must include a reason.")
            return self

        if not self.optimized_prompt:
            raise ValueError("Valid prompt results must include optimized_prompt.")
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
        db: Session = SessionLocal()
        try:
            print(f"[DatabaseTool] A inserir item project_id={self.project_id}, name={name}")
            item = ItemModel(
                project_id=self.project_id,
                name=name,
                category=category,
                price=price,
                image_url=self.image_url,
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
            print(f"[DatabaseTool] Item guardado com sucesso: {result.model_dump()}")
            return result.model_dump_json()
        except Exception as e:
            db.rollback()
            print(f"[DatabaseTool] Falha ao inserir item: {e}")
            raise
        finally:
            db.close()


def _log_task_result(label: str):
    def _logger(result: TaskOutput) -> None:
        print(f"{label} terminou: {result}")

    return _logger


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
            "Validate whether the user's request is about interior decoration and "
            "transform valid requests into precise Flux-ready image prompts."
        ),
        backstory=(
            "You are a meticulous creative director for AI interior imagery. "
            "You understand spatial design, furniture language, lighting, materials, "
            "and the constraints of image generation systems. You reject prompts that "
            "are not about interior decoration, and when a prompt is valid you rewrite "
            "it into a clear, production-ready instruction for Flux."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
    )

    validate_and_optimize_prompt = Task(
        description=(
            "Review this user prompt: {user_prompt}\n\n"
            "Decide whether it is about interior decoration, home styling, furniture, "
            "materials, lighting, room layout, or decor. If it is not about interior "
            "decoration, say it is invalid and explain briefly. If it is valid, produce "
            "an optimized Flux image prompt with concrete details about style, room type, "
            "materials, furniture, lighting, color palette, composition, and quality."
        ),
        expected_output=(
            "Strict JSON only. If valid, return "
            '{"status":"valid","optimized_prompt":"..."}. If invalid, return '
            '{"status":"rejected","reason":"..."}.'
        ),
        agent=prompt_architect,
        output_json=PromptArchitectureResult,
        callback=_log_task_result("Agente 1"),
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
            "Invent one realistic shoppable furniture or decor asset for the generated "
            "room image, save it with the database tool, and return strict JSON only."
        ),
        backstory=(
            "You are a product curator for an interior design marketplace. "
            "You turn generated room concepts into believable e-commerce assets with "
            "clear names, practical categories, plausible prices, and purchase links. "
            "You are disciplined about structured data: when asked for JSON, you return "
            "only valid JSON with no prose, comments, markdown, or code fences."
        ),
        llm=llm,
        tools=[database_tool],
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )

    save_asset = Task(
        description=(
            "The image was generated by Flux from this optimized prompt: {optimized_prompt}\n\n"
            "Generated image URL: {generated_image_url}\n\n"
            "Invent exactly one furniture or decor item that fits the generated room. "
            "You must call the save_recommended_furniture_item tool with name, category, "
            "price, and buy_url. After the tool succeeds, return exactly the JSON returned "
            "by the tool."
        ),
        expected_output=(
            "Strict JSON only. For successful saves, return an object matching: "
            '{"status":"saved","item_id":1,"name":"...","category":"...",'
            '"price":"...","image_url":"...","buy_url":"..."}.'
        ),
        agent=asset_specialist,
        output_json=SavedItemResult,
        callback=_log_task_result("Agente 2"),
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
