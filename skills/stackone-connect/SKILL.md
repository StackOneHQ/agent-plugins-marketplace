---
name: stackone-connect
description: Link end-user accounts to third-party SaaS providers using StackOne Connect Sessions and the StackOne Hub React component. Use when implementing account linking, the embedded Hub, auth links, or connect session flows.
metadata:
  author: stackone
  version: "1.0"
---

# StackOne Connect — Account Linking

You are an expert on StackOne's account linking system. This skill covers Connect Sessions, the StackOne Hub component, and auth links — the mechanisms for connecting end-user accounts to third-party SaaS providers through StackOne.

## When to use

Use this skill when the user needs to:
- Implement account linking in their application
- Embed the StackOne Hub component (React or vanilla JS)
- Create Connect Sessions programmatically
- Generate auth links for onboarding
- Handle account lifecycle webhooks
- Customize Hub theming or behavior

## Documentation discovery

Fetch the latest docs before answering:

1. **Connect tools overview**: `https://docs.stackone.com/guides/connect-tools-overview`
2. **Embedding the Hub**: `https://docs.stackone.com/guides/embedding-stackone-hub`
3. **Auth links**: `https://docs.stackone.com/guides/auth-link`
4. **Connect Sessions API**: `https://docs.stackone.com/platform/api-reference/connect-sessions/create-connect-session`
5. **Webhooks**: `https://docs.stackone.com/guides/webhooks`

For the Hub React component, also check:
- NPM package: `https://www.npmjs.com/package/@stackone/hub`
- GitHub README: `https://github.com/stackoneHQ/hub`

For the full docs index: `https://docs.stackone.com/llms.txt`

## Core concepts

### Connection methods

StackOne supports three ways to link accounts:

| Method | Use case |
|--------|----------|
| **Embedded Hub** | In-app integration picker — users authenticate without leaving your app |
| **Auth Link** | Standalone URL (valid 5 days) for onboarding emails or external flows |
| **Dashboard** | Internal testing only — not for production |

### Connect Session flow

1. **Backend** creates a Connect Session via API → receives a session token
2. **Frontend** initializes the Hub with that token
3. **User** selects a provider and authenticates
4. **StackOne** fires a webhook when the account is created

### Creating a Connect Session

```bash
curl -X POST https://api.stackone.com/connect_sessions \
  -H "Authorization: Basic base64(api_key:)" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_owner_id": "customer-123",
    "origin_owner_name": "Acme Inc"
  }'
```

You can filter available providers:

```json
{
  "origin_owner_id": "customer-123",
  "origin_owner_name": "Acme Inc",
  "provider": "bamboohr",
  "categories": ["hris"]
}
```

### Hub React component (New Hub — beta)

```bash
npm install @stackone/hub
```

```tsx
import { StackOneHub } from "@stackone/hub";

function ConnectorPage() {
  const [token, setToken] = useState<string>();

  useEffect(() => {
    fetchConnectSessionToken().then(setToken);
  }, []);

  if (!token) return <div>Loading...</div>;

  return (
    <StackOneHub
      token={token}
      onSuccess={(account) => console.log("Connected:", account.id)}
      onCancel={() => console.log("Cancelled")}
      onClose={() => console.log("Closed")}
    />
  );
}
```

#### Hub props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `token` | string | required | Connect session token |
| `mode` | `'integration-picker' \| 'csv-importer'` | `'integration-picker'` | Hub mode |
| `accountId` | string | — | Pre-select account for editing |
| `baseUrl` | string | `'https://api.stackone.com'` | API endpoint |
| `height` | string | `'500px'` | Component height |
| `theme` | `'light' \| 'dark' \| PartialMalachiteTheme` | `'light'` | Visual theme |

Peer dependencies: `react`, `react-dom`, `react-hook-form`, `@hookform/resolvers`, `zod`

### Legacy Hub (v1)

The legacy iframe-based Hub uses a different package:

```bash
npm install @stackone/react-hub
```

Fetch the embedding guide for v1 usage: `https://docs.stackone.com/guides/embedding-stackone-hub`

### Auth links

Auth links are standalone URLs for use in emails or external onboarding. They expire after 5 days and require webhook subscriptions since there are no frontend callbacks.

### Webhooks

Subscribe to account lifecycle events:

| Event | Description |
|-------|-------------|
| `account.created` | New account linked |
| `account.updated` | Credentials refreshed |
| `account.deleted` | Account disconnected |

Webhook docs: `https://docs.stackone.com/guides/webhooks`

## When you need more detail

Always fetch the live documentation for the latest API signatures, component props, and examples. Start with `https://docs.stackone.com/llms.txt` to find the right page.
