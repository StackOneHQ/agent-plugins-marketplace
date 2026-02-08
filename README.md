# StackOne Skills

Agent skills for building integrations with [StackOne](https://stackone.com) — the unified API platform for HR, ATS, CRM, LMS, and 200+ SaaS connectors.

## Install

```bash
# Install all skills
npx skills add stackonehq/agent-plugins-marketplace

# Install a specific skill
npx skills add stackonehq/agent-plugins-marketplace@stackone-agents
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [`stackone-platform`](skills/stackone-platform/) | StackOne platform operations — API keys, accounts, logs, webhooks |
| [`stackone-connect`](skills/stackone-connect/) | Link end-user accounts using Connect Sessions and the StackOne Hub |
| [`stackone-agents`](skills/stackone-agents/) | Build AI agents that call StackOne-linked accounts via SDK, MCP, or A2A |
| [`stackone-cli`](skills/stackone-cli/) | Use the StackOne CLI for connector development and platform operations |
| [`stackone-connectors`](skills/stackone-connectors/) | Discover available connectors, actions, and integration capabilities |

## Design Philosophy

These skills **point to live documentation** rather than duplicating content. This means:

- Skills stay accurate without frequent updates
- Agents fetch the latest docs, SDK references, and API specs at runtime
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
