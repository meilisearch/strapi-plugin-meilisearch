# AGENTS.md

## Plan mode

- Use subagents for exploration

**Plan output**
- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- Include conceptual code samples to make intent clearer and prevent drift during implementation.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Agent mode

Environment:
- Use `yarn`, not `npm`
- Use `nvm use` to use the correct Node version

Coding practices:
- Use comments when the logic cannot be inferred from the code.
- Always write function documentation.

### Development workflow

- Format code with `yarn style:fix`
