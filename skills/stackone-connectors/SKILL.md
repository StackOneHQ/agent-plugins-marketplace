---
name: stackone-connectors
description: Discover StackOne's 200+ connectors and 9,000+ actions across HRIS, ATS, CRM, LMS, ticketing, messaging, documents, IAM, and accounting. Use when user asks "which providers does StackOne support", "what can I do with BambooHR", "recommend an integration for HR", "what actions are available", "how do I call a provider-specific action", or "does StackOne support Workday". Helps choose the right connector and actions for any use case. Do NOT use for building agents (use stackone-agents) or connecting accounts (use stackone-connect).
license: MIT
compatibility: Requires network access to fetch live documentation from docs.stackone.com
metadata:
  author: stackone
  version: "2.0"
---

# StackOne Connectors — Integration Discovery

## Important

Connector availability changes frequently as StackOne adds new providers. Before answering:
1. Fetch `https://docs.stackone.com/connectors/introduction` for the current connector list
2. For specific provider capabilities, fetch the relevant category API reference

Never assume a connector exists or doesn't exist without checking live docs.

## Instructions

### Step 1: Identify the user's integration need

Common patterns:
- **"What providers do you support for X?"** → Check the category (HRIS, ATS, CRM, etc.) in the connectors page
- **"Can I do Y with provider Z?"** → Check the provider's supported actions in the API reference
- **"Recommend an integration for my use case"** → Match the use case to a category, then list available providers

### Step 2: Look up connector availability

Fetch `https://docs.stackone.com/connectors/introduction` for the full, current list.

Consult `references/category-overview.md` for a snapshot of categories and example providers. But always verify against live docs since new connectors are added regularly.

### Step 3: Check available actions for a provider

Each connector exposes a set of actions (API operations). To find what's available:

1. Identify the category (e.g., HRIS)
2. Fetch the category API reference (e.g., `https://docs.stackone.com/hris/api-reference/employees/list-employees`)
3. Check which operations the specific provider supports

Not all providers support all actions in a category. The API reference docs indicate provider-level support.

### Step 4: Use the Actions RPC for provider-specific operations

For operations not covered by the unified API, use the Actions RPC:

```bash
curl -X POST https://api.stackone.com/unified/actions/execute \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)" \
  -H "x-account-id: ACCOUNT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "get",
    "path": "/provider-specific-endpoint"
  }'
```

Fetch `https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action` for the full RPC reference.

### Step 5: Test before building

- **AI Playground**: https://app.stackone.com/playground — test API calls interactively
- **MCP Inspector**: `npx @modelcontextprotocol/inspector https://api.stackone.com/mcp` — test via MCP
- **Postman**: importable collection available from the docs

## Release stages

| Stage | Meaning | Recommendation |
|-------|---------|----------------|
| **GA** | Production-ready, fully supported | Safe for production |
| **Beta** | Stable for testing, minor changes possible | OK for non-critical flows |
| **Preview** | Early-stage, expect breaking changes | Development/testing only |

## Examples

### Example 1: User wants to know what HR integrations are available

User says: "Which HRIS tools does StackOne support?"

Actions:
1. Fetch `https://docs.stackone.com/connectors/introduction`
2. Filter for the HRIS category
3. List available providers with their release stages
4. For each, summarize key operations (list employees, create employees, etc.)

Result: Current list of HRIS connectors with capabilities.

### Example 2: User wants to perform a provider-specific operation

User says: "I need to trigger a custom workflow in BambooHR that's not in the unified API"

Actions:
1. Check the unified HRIS API first — it may already be covered
2. If not, explain the Actions RPC endpoint
3. Show how to construct the RPC call with the BambooHR-specific path
4. Fetch the Actions RPC reference for payload details

Result: Working RPC call for the provider-specific operation.

### Example 3: User needs a connector that doesn't exist

User says: "Does StackOne support our custom HR tool?"

Actions:
1. Check the connectors page — it may exist under a different name
2. If not found, explain two options:
   a. Request it: `https://docs.stackone.com/connectors/add-new`
   b. Build it: use the Connector Engine (see `stackone-cli` skill)
3. If they have budget/urgency, recommend the AI Builder for faster custom connector development

Result: Clear path forward — either request or build.

## Troubleshooting

### Can't find a specific provider
**Cause**: Provider may be listed under a different name, or may not be supported yet.
- Search the connectors page by the provider's official name
- Check if it's under a parent company name (e.g., "Microsoft Entra ID" not "Azure AD")
- If not found, suggest requesting it or building a custom connector

### Action returns "not supported" for a provider
**Cause**: Not all providers support all unified API operations.
- Check the API reference for provider-level support details
- Use the Actions RPC for provider-specific operations that bypass the unified layer
- Some operations require specific OAuth scopes on the provider side

### Connector logos not loading
**Cause**: Incorrect slug format.
- Logo URL format: `https://stackone-logos.com/api/{connector-slug}/filled/png`
- Slugs are lowercase, hyphenated (e.g., `bamboo-hr`, `google-drive`)
- Fetch the connectors page to verify the exact slug
