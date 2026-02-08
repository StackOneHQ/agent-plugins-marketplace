---
name: stackone-agents
description: Build AI agents that interact with StackOne-linked accounts. Covers the TypeScript SDK (@stackone/ai), Python SDK (stackone-ai), MCP server integration, A2A protocol, framework integrations (OpenAI, Vercel AI SDK, Claude, LangChain, CrewAI, PydanticAI), and multi-tenant patterns.
metadata:
  author: stackone
  version: "1.0"
---

# StackOne Agents — AI Integration

You are an expert on building AI agents that use StackOne to interact with third-party SaaS tools. StackOne provides SDKs, an MCP server, and A2A support so agents can perform actions across 200+ connected platforms.

## When to use

Use this skill when the user needs to:
- Build an AI agent that reads/writes data from connected SaaS tools
- Integrate StackOne tools into an agent framework (OpenAI, Vercel AI, Claude, LangChain, etc.)
- Use the StackOne MCP server with Claude Code, Claude Desktop, ChatGPT, Cursor, or other MCP clients
- Implement multi-tenant tool access (different accounts per user)
- Use the Actions RPC for provider-specific operations
- Understand A2A (Agent-to-Agent) protocol with StackOne

## Documentation discovery

Always fetch live documentation before providing detailed code examples. Key resources:

### TypeScript SDK
- **Introduction**: `https://docs.stackone.com/agents/typescript/introduction`
- **NPM**: `https://www.npmjs.com/package/@stackone/ai`
- **GitHub README** (has the latest examples): `https://raw.githubusercontent.com/stackoneHQ/stackone-ai-node/refs/heads/main/README.md`
- **Framework guides**: `https://docs.stackone.com/agents/typescript/frameworks/openai-integration` (and similar paths for vercel-ai-sdk, anthropic, etc.)

### Python SDK
- **GitHub README**: `https://raw.githubusercontent.com/stackoneHQ/stackone-ai-python/refs/heads/main/README.md`
- **PyPI**: `https://pypi.org/project/stackone-ai/`

### MCP Server
- **Quickstart**: `https://docs.stackone.com/mcp/quickstart`
- **Framework guides**: `https://docs.stackone.com/mcp/framework-guides/claude-code` (and paths for cursor, windsurf, etc.)
- **App guides**: `https://docs.stackone.com/mcp/app-guides/claude-desktop` (and paths for chatgpt, goose, n8n, etc.)

### A2A Protocol
- **A2A overview**: fetch from `https://docs.stackone.com/llms.txt` and look for A2A-related pages

### Full docs index
- `https://docs.stackone.com/llms.txt` — machine-readable list of all documentation pages

## Integration methods

StackOne offers four ways for agents to interact with linked accounts:

### 1. TypeScript SDK (`@stackone/ai`)

```bash
npm install @stackone/ai zod
```

```typescript
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();
const tools = await toolset.fetchTools({
  accountIds: ["account-123"],
});

// Convert to your framework's format
const openaiTools = tools.toOpenAI();
const anthropicTools = tools.toAnthropic();
const vercelTools = await tools.toAISDK();
```

**Tool naming convention**: `{provider}_{operation}_{entity}` (e.g., `bamboohr_list_employees`)

**Tool filtering**:
```typescript
await toolset.fetchTools({
  providers: ["hibob", "bamboohr"],
  actions: ["*_list_employees"],
  accountIds: ["account-123"],
});
```

**Utility tools** (dynamic discovery):
```typescript
const utilityTools = await tools.utilityTools();
// tool_search — find tools by natural language query
// tool_execute — execute discovered tools dynamically
```

For the latest API surface and framework-specific examples, always fetch the GitHub README or the relevant docs page.

### 2. Python SDK (`stackone-ai`)

```bash
pip install stackone-ai
```

For usage examples and framework integrations (LangChain, CrewAI, PydanticAI, Google ADK), fetch the GitHub README:
`https://raw.githubusercontent.com/stackoneHQ/stackone-ai-python/refs/heads/main/README.md`

### 3. MCP Server

StackOne exposes an MCP server at `https://api.stackone.com/mcp` for use with MCP-compatible clients.

**Authentication**: Basic auth with your StackOne API key, plus `x-account-id` header.

**Testing with MCP Inspector**:
```bash
npx @modelcontextprotocol/inspector https://api.stackone.com/mcp
```

For client-specific configuration (Claude Desktop, Claude Code, Cursor, ChatGPT, etc.), fetch the relevant guide from:
- `https://docs.stackone.com/mcp/framework-guides/{client-name}`
- `https://docs.stackone.com/mcp/app-guides/{app-name}`

### 4. A2A Protocol

StackOne supports Google's Agent-to-Agent (A2A) protocol for agent-to-agent communication. Fetch the docs for current details:
`https://docs.stackone.com/llms.txt` → look for A2A pages

## Multi-tenant patterns

For applications serving multiple end-users, each with their own connected accounts:

```typescript
const toolset = new StackOneToolSet();

// Fetch tools for a specific customer's account
const tools = await toolset.fetchTools({
  accountIds: ["customer-123-bamboohr-account"],
});

// Or dynamically set the account
tools.setAccountId("customer-456-bamboohr-account");
```

The `accountId` maps to a linked account created via the Connect Session flow (see the `stackone-connect` skill).

## Supported frameworks

The TypeScript SDK supports these output formats:

| Framework | Method |
|-----------|--------|
| OpenAI Chat Completions | `tools.toOpenAI()` |
| OpenAI Responses API | `tools.toOpenAIResponses()` |
| Anthropic Claude | `tools.toAnthropic()` |
| Vercel AI SDK | `await tools.toAISDK()` |
| Claude Agent SDK | `await tools.toClaudeAgentSdk()` |

The Python SDK supports OpenAI, LangChain, CrewAI, PydanticAI, and Google ADK.

## When you need more detail

Fetch the latest documentation rather than relying on this skill alone. Start with:
- TypeScript: `https://raw.githubusercontent.com/stackoneHQ/stackone-ai-node/refs/heads/main/README.md`
- Python: `https://raw.githubusercontent.com/stackoneHQ/stackone-ai-python/refs/heads/main/README.md`
- Full docs: `https://docs.stackone.com/llms.txt`
