---
name: stackone-connectors
description: Discover StackOne connectors, available actions, and integration capabilities across 200+ SaaS platforms. Covers HRIS, ATS, CRM, LMS, ticketing, messaging, documents, IAM, and accounting categories. Use to recommend specific actions or understand what operations are available for a given provider.
metadata:
  author: stackone
  version: "1.0"
---

# StackOne Connectors — Integration Capabilities

You are an expert on StackOne's connector ecosystem. StackOne provides 200+ pre-built connectors across 9 categories with 9,000+ individual actions. This skill helps you discover what's available and recommend the right connectors and actions for a use case.

## When to use

Use this skill when the user needs to:
- Find out which SaaS platforms StackOne supports
- Understand what operations (actions) are available for a specific provider
- Compare connector capabilities across providers
- Recommend integrations for a use case
- Look up API endpoints for a specific category or provider
- Understand connector release stages (GA, Beta, Preview)

## Documentation discovery

Always fetch live documentation to provide accurate connector information:

### Connector listings
- **Connectors overview**: `https://docs.stackone.com/connectors/introduction`
- **Request a new connector**: `https://docs.stackone.com/connectors/add-new`

### Category-specific API docs
Fetch these pages for detailed endpoints, request/response schemas, and supported operations:

| Category | Introduction | API Reference |
|----------|-------------|---------------|
| HRIS | `https://docs.stackone.com/hris/introduction` | `https://docs.stackone.com/hris/api-reference/employees/list-employees` |
| ATS | `https://docs.stackone.com/ats/introduction` | `https://docs.stackone.com/ats/api-reference/candidates/list-candidates` |
| CRM | `https://docs.stackone.com/crm/introduction` | `https://docs.stackone.com/crm/api-reference/contacts/list-contacts` |
| LMS | `https://docs.stackone.com/lms/introduction` | `https://docs.stackone.com/lms/api-reference/content/list-content` |
| IAM | `https://docs.stackone.com/iam/introduction` | `https://docs.stackone.com/iam/api-reference/users/list-users` |
| Documents | `https://docs.stackone.com/documents/introduction` | `https://docs.stackone.com/documents/api-reference/documents/list-documents` |
| Accounting | `https://docs.stackone.com/accounting/introduction` | `https://docs.stackone.com/accounting/api-reference/accounts/list-accounts` |
| Ticketing | `https://docs.stackone.com/ticketing/introduction` | `https://docs.stackone.com/ticketing/api-reference/tickets/list-tickets` |
| Messaging | `https://docs.stackone.com/messaging/introduction` | `https://docs.stackone.com/messaging/api-reference/messages/send-message` |

### Full docs index
- `https://docs.stackone.com/llms.txt` — machine-readable list of all documentation pages

## Connector categories and example providers

| Category | Example Providers |
|----------|-------------------|
| **HRIS** | BambooHR, Workday, Rippling, Personio, HiBob, Gusto, ADP, Deel |
| **ATS** | Ashby, Lever, Greenhouse, SmartRecruiters, Workable, iCIMS |
| **CRM** | HubSpot, Salesforce, Zoho CRM, Attio, Pipedrive |
| **LMS** | Docebo, Cornerstone, Go1, Adobe Learning Manager, Absorb |
| **Ticketing** | Jira, ServiceNow, Linear, Zendesk, Freshdesk |
| **Messaging** | Slack, Discord, Microsoft Teams |
| **Documents** | Google Drive, Dropbox, SharePoint, Confluence, Notion |
| **IAM** | Okta, GitHub, Microsoft Entra ID, OneLogin |
| **Accounting** | QuickBooks Online, Xero, NetSuite |

This is not exhaustive — StackOne adds new connectors regularly. Always fetch the connectors page for the current list.

## Release stages

| Stage | Meaning |
|-------|---------|
| **GA** | Production-ready, fully supported |
| **Beta** | Stable for testing, may have minor changes |
| **Preview** | Early-stage, expect changes |

## Actions RPC

For operations beyond the unified API, the Actions RPC lets you call provider-specific actions directly:

```
POST https://api.stackone.com/unified/actions/execute
```

API reference: `https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action`

## Connector logos

Connector logos are available at:
```
https://stackone-logos.com/api/{connector-slug}/filled/png
```

## Testing integrations

- **AI Playground**: `https://app.stackone.com/playground` — test API calls in the browser
- **MCP Inspector**: `npx @modelcontextprotocol/inspector https://api.stackone.com/mcp`
- **Postman collection**: available for import from the docs

## Custom connectors

If a provider isn't supported, users can build custom connectors with the Connector Engine:
- `https://docs.stackone.com/guides/connector-engine/introduction`
- `https://docs.stackone.com/guides/connector-engine/ai-builder` (AI-assisted generation)

## When you need more detail

Fetch the live documentation for the latest connector listings, supported actions, and API schemas. Start with `https://docs.stackone.com/llms.txt` to discover the right page.
