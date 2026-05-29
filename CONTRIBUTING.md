## 🛠️ Standards de Desenvolvimento e Commits

Para garantir a qualidade e organização do código, utilizamos **Ruff** para linting/formatação e seguimos a convenção **Conventional Commits**.

### Regras de Commits
O formato obrigatório para as mensagens de commit é:
`<tipo>(<escopo opcional>): <descrição em minúsculas>`

**Tipos permitidos:**
* `feat:` Uma nova funcionalidade (ex: novos endpoints, novos agentes)
* `fix:` Resolução de um bug
* `docs:` Alterações na documentação (README, Swagger, etc.)
* `chore:` Atualização de dependências, tarefas de build, etc.
* `refactor:` Alterações de código que não adicionam features nem corrigem bugs
* `test:` Adição ou correção de testes

**Exemplos Válidos:**
✅ `feat(agents): add triage nurse agent logic`
✅ `fix(api): resolve timeout error on submit endpoint`
✅ `docs: update setup instructions in readme`

**Exemplos Inválidos (Serão bloqueados):**
❌ `updated agents`
❌ `Fixed the bug`
❌ `WIP`

### Formatação de Código
O projeto utiliza o `Ruff` para manter o código limpo. As regras são aplicadas automaticamente no momento do commit através de pre-commit hooks.