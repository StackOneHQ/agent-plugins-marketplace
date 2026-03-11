# StackOne Skills

Agent skills for [StackOne](https://stackone.com) — integration infrastructure for AI agents. 10,000+ production-ready actions, 200+ connectors, and an AI integration builder to extend to any API.

## Install

### Claude Code (plugin marketplace)

```bash
# Add the marketplace
/plugin marketplace add stackonehq/agent-plugins-marketplace

# Install the StackOne plugin (all 6 skills)
/plugin install stackone@stackone-marketplace
```

### Any agent (via Skills CLI)

```bash
# Install all skills (works with Claude Code, Cursor, Codex, Windsurf, etc.)
npx skills add stackonehq/agent-plugins-marketplace

# Install a specific skill
npx skills add stackonehq/agent-plugins-marketplace@stackone-agents
```

## Available Skills

| Skill | What it does | When to use |
|-------|-------------|-------------|
| [`stackone-platform`](skills/stackone-platform/) | Platform operations — API keys, accounts, logs, debugging | "Set up StackOne", "list my accounts", "debug API errors" |
| [`stackone-connect`](skills/stackone-connect/) | Account linking via Connect Sessions and the Hub component | "Connect a provider", "embed the integration picker" |
| [`stackone-agents`](skills/stackone-agents/) | Build AI agents with TypeScript/Python SDK, MCP, or A2A | "Add StackOne tools to my agent", "set up MCP" |
| [`stackone-cli`](skills/stackone-cli/) | Custom connector development and deployment | "Build a custom connector", "deploy my connector" |
| [`stackone-connectors`](skills/stackone-connectors/) | Discover connectors, actions, and integration capabilities | "Which providers does StackOne support?" |
| [`stackone-unified-connectors`](skills/stackone-unified-connectors/) | Build unified connectors that transform provider data into standardized schemas | "start unified build for [provider]", "map fields to schema" |

Each skill includes step-by-step workflows, concrete examples, and troubleshooting for common errors.

## Design Philosophy

These skills **teach workflows** while pointing to **live documentation** for details that change frequently:

- Step-by-step instructions for common tasks (not just API reference)
- Real user scenario examples with trigger → actions → result
- Error handling and troubleshooting for common failure modes
- `references/` directories for detailed lookup tables loaded on demand
- Agents fetch the latest docs, SDK READMEs, and API specs at runtime
- The canonical source of truth remains [docs.stackone.com](https://docs.stackone.com)

## Documentation Index

StackOne publishes a machine-readable documentation index at [`docs.stackone.com/llms.txt`](https://docs.stackone.com/llms.txt) — agents can fetch this to discover all available documentation pages.

## Resources

- [StackOne Documentation](https://docs.stackone.com)
- [StackOne Dashboard](https://app.stackone.com)
- [AI Playground](https://app.stackone.com/playground)
- [TypeScript SDK (`@stackone/ai`)](https://www.npmjs.com/package/@stackone/ai)
- [Python SDK (`stackone-ai`)](https://github.com/stackoneHQ/stackone-ai-python)
- [CLI (`@stackone/cli`)](https://www.npmjs.com/package/@stackone/cli)
- [Hub React Component (`@stackone/hub`)](https://www.npmjs.com/package/@stackone/hub)

## License

MIT
