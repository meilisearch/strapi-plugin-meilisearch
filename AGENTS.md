# AGENTS.md

## Plan mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- Include conceptual code samples to make intent clearer and prevent drift during implementation.
- Make the plan optimized for leveraging subagents (in sequence or in parallel).
- At the end of each plan, give me a list of unresolved questions to answer, if any.
- Enforce subagents usage in the plan.

## Agent mode

Use your tools to spawn subagents:
- The main agent is only an orchestrator; leverage subagents to minimize context pollution.
- Scoped tasks like editing a file, testing, linting, running a command, or exploration should be handled by subagents.

### Local development

- Use `yarn`, not `npm`
- Use `nvm use` to use the correct Node version
- Meilisearch JS client is `0.48.2`; use `client.getTasks({ indexUids: [...] })` for tasks, not `waitTask` from >= 0.50.

Services:
- Run Meilisearch locally with `docker run --rm -p 7700:7700 -e MEILI_MASTER_KEY=masterKey getmeili/meilisearch-enterprise:latest`

### Coding conventions

- Use comments when the logic cannot be inferred from the code.
- Always write function documentation.

### Development workflow

- Format code with `yarn style:fix`
