# Contributing to Strapi Expert Skill

Thank you for your interest in contributing to the Strapi Expert skill for Claude Code!

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or suggest features
- Include clear descriptions and examples where possible
- Check existing issues before creating a new one

### Submitting Changes

1. **Fork the repository**
   ```bash
   git clone https://github.com/ayhid/claude-skill-strapi-expert.git
   cd claude-skill-strapi-expert
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style and formatting
   - Test your changes with Claude Code if possible

4. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## File Structure

| File | Purpose | When to Edit |
|------|---------|--------------|
| `SKILL.md` | Core skill definition | Adding fundamental concepts, API references |
| `patterns.md` | Advanced patterns and techniques | Adding reusable patterns, best practices |
| `examples.md` | Complete code examples | Adding real-world implementations |

## Content Guidelines

### Adding New Patterns

When adding to `patterns.md`:

1. Use clear section headers with `##`
2. Include code examples with proper TypeScript/TSX syntax highlighting
3. Explain when and why to use the pattern
4. Reference official Strapi documentation where applicable

### Adding New Examples

When adding to `examples.md`:

1. Provide complete, runnable code
2. Include file paths as comments (e.g., `// server/src/services/task.ts`)
3. Add a summary table of key patterns demonstrated
4. Ensure code follows Strapi v5 conventions

### Code Style

- Use TypeScript for all code examples
- Use proper indentation (2 spaces)
- Include type annotations
- Add comments for complex logic
- Follow Strapi naming conventions:
  - Content types: singular (`task` not `tasks`)
  - UIDs: `plugin::plugin-name.content-type`

## What We're Looking For

### High Priority

- New Strapi v5 patterns not yet covered
- Admin panel component examples
- Content Manager customization patterns
- Database query optimizations
- Security best practices

### Nice to Have

- Migration guides from Strapi v4
- Testing patterns for plugins
- CI/CD examples for plugin development
- Performance optimization tips

## Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
