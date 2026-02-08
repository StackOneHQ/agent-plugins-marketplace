# Integration Method Decision Guide

Use this guide to choose the right StackOne integration method.

## Decision Tree

```
Are you writing code for a custom agent?
├── YES → What language?
│   ├── TypeScript/JavaScript → Use @stackone/ai (TypeScript SDK)
│   │   ├── OpenAI Chat Completions → tools.toOpenAI()
│   │   ├── OpenAI Responses API → tools.toOpenAIResponses()
│   │   ├── Anthropic Claude → tools.toAnthropic()
│   │   ├── Vercel AI SDK → await tools.toAISDK()
│   │   └── Claude Agent SDK → await tools.toClaudeAgentSdk()
│   └── Python → Use stackone-ai (Python SDK)
│       ├── OpenAI → OpenAI integration
│       ├── LangChain → LangChain integration
│       ├── CrewAI → CrewAI integration
│       ├── PydanticAI → PydanticAI integration
│       └── Google ADK → Google ADK integration
├── NO → Are you configuring an existing AI tool?
│   ├── YES → Use MCP Server (https://api.stackone.com/mcp)
│   │   ├── Claude Code → docs.stackone.com/mcp/framework-guides/claude-code
│   │   ├── Claude Desktop → docs.stackone.com/mcp/app-guides/claude-desktop
│   │   ├── ChatGPT → docs.stackone.com/mcp/app-guides/chatgpt
│   │   ├── Cursor → docs.stackone.com/mcp/framework-guides/cursor
│   │   ├── Windsurf → docs.stackone.com/mcp/framework-guides/windsurf
│   │   └── Others → check docs.stackone.com/llms.txt for guides
│   └── NO → Agent-to-agent communication?
│       └── YES → Use A2A Protocol
│           └── Fetch docs.stackone.com/llms.txt for A2A pages
```

## Framework Conversion Methods (TypeScript SDK)

| Framework | Method | Async? |
|-----------|--------|--------|
| OpenAI Chat Completions | `tools.toOpenAI()` | No |
| OpenAI Responses API | `tools.toOpenAIResponses()` | No |
| Anthropic Claude | `tools.toAnthropic()` | No |
| Vercel AI SDK | `await tools.toAISDK()` | Yes |
| Claude Agent SDK | `await tools.toClaudeAgentSdk()` | Yes |

## Key Documentation URLs

- TypeScript SDK README: `https://raw.githubusercontent.com/stackoneHQ/stackone-ai-node/refs/heads/main/README.md`
- Python SDK README: `https://raw.githubusercontent.com/stackoneHQ/stackone-ai-python/refs/heads/main/README.md`
- MCP Quickstart: `https://docs.stackone.com/mcp/quickstart`
- All docs: `https://docs.stackone.com/llms.txt`
