---
name: stackone-platform
description: StackOne platform operations — manage API keys, linked accounts, logs, webhooks, and dashboard resources. Use when working with the StackOne unified API platform for HR, ATS, CRM, LMS, and SaaS integrations.
metadata:
  author: stackone
  version: "1.0"
---

# StackOne Platform

You are an expert on the StackOne unified API platform. StackOne provides a single API to integrate with 200+ HR, ATS, CRM, LMS, ticketing, messaging, documents, IAM, and accounting SaaS tools.

## When to use

Use this skill when the user needs to:
- Understand what StackOne is and how the platform works
- Work with the StackOne API (authentication, accounts, logs, webhooks)
- Manage linked accounts or API keys
- Debug API calls or integration issues
- Set up webhooks or event subscriptions

## Documentation discovery

Before answering questions, fetch the latest documentation. StackOne maintains a machine-readable index of all docs:

1. **Fetch the docs index**: `https://docs.stackone.com/llms.txt` — lists every documentation page with descriptions
2. **Then fetch specific pages** relevant to the user's question

Key documentation sections:
- Platform overview: `https://docs.stackone.com/overview/introduction`
- API authentication: `https://docs.stackone.com/overview/authentication`
- Webhooks: `https://docs.stackone.com/guides/webhooks`
- Connect sessions: `https://docs.stackone.com/platform/api-reference/connect-sessions/create-connect-session`
- Accounts API: `https://docs.stackone.com/platform/api-reference/accounts/list-accounts`

## Core concepts

### Authentication

All StackOne API calls use Basic auth with your API key:

```
Authorization: Basic base64(api_key:)
```

API keys are created in the [StackOne Dashboard](https://app.stackone.com). Keys follow the format `v1.{region}.xxxxx`.

### Accounts

A **linked account** represents a connection between your customer and a third-party provider (e.g., BambooHR, Greenhouse). Each account has:
- An `id` assigned by StackOne
- A `provider` (the SaaS tool)
- An `origin_owner_id` (your internal customer identifier)
- A `status` (active, error, etc.)

### Making API calls

All data API calls require an `x-account-id` header identifying which linked account to query:

```bash
curl https://api.stackone.com/unified/hris/employees \
  -H "Authorization: Basic base64(api_key:)" \
  -H "x-account-id: account-id-here"
```

### Webhooks

StackOne fires webhooks on account lifecycle events:
- `account.created` — new account linked
- `account.updated` — credentials refreshed
- `account.deleted` — account disconnected

### Actions RPC

For operations not covered by the unified API, use the Actions RPC endpoint to call provider-specific actions:

```
POST https://api.stackone.com/unified/actions/execute
```

Fetch the API reference for details: `https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action`

## Key URLs

| Resource | URL |
|----------|-----|
| Dashboard | https://app.stackone.com |
| API base | https://api.stackone.com |
| Documentation | https://docs.stackone.com |
| Docs index (machine-readable) | https://docs.stackone.com/llms.txt |
| AI Playground | https://app.stackone.com/playground |
| Connector logos | https://stackone-logos.com |

## API categories

StackOne unifies these API categories. Fetch category-specific docs as needed:

| Category | Docs URL |
|----------|----------|
| HRIS | https://docs.stackone.com/hris/introduction |
| ATS | https://docs.stackone.com/ats/introduction |
| CRM | https://docs.stackone.com/crm/introduction |
| LMS | https://docs.stackone.com/lms/introduction |
| IAM | https://docs.stackone.com/iam/introduction |
| Documents | https://docs.stackone.com/documents/introduction |
| Accounting | https://docs.stackone.com/accounting/introduction |
| Ticketing | https://docs.stackone.com/ticketing/introduction |
| Messaging | https://docs.stackone.com/messaging/introduction |

## When you need more detail

Always browse the live documentation rather than guessing. Fetch `https://docs.stackone.com/llms.txt` to discover the right page, then fetch that page for up-to-date content.
