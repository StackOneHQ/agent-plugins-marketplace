# StackOne Hub Component Reference

**IMPORTANT**: This reference may be outdated. Always fetch the latest from:
- NPM: `https://www.npmjs.com/package/@stackone/hub`
- Docs: `https://docs.stackone.com/guides/embedding-stackone-hub`

## New Hub (beta) — `@stackone/hub`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `token` | string | required | Connect session token from your backend |
| `mode` | `'integration-picker' \| 'csv-importer'` | `'integration-picker'` | Hub operation mode |
| `accountId` | string | — | Pre-select an account for editing/re-auth |
| `baseUrl` | string | `'https://api.stackone.com'` | API endpoint override |
| `height` | string | `'500px'` | Component height |
| `theme` | `'light' \| 'dark' \| PartialMalachiteTheme` | `'light'` | Visual styling |
| `onSuccess` | `(account) => void` | — | Fires when account is linked |
| `onCancel` | `() => void` | — | Fires when user cancels |
| `onClose` | `() => void` | — | Fires when Hub is closed |

### Peer Dependencies

```json
{
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-hook-form": "7.60.0",
  "@hookform/resolvers": "^5.2.2",
  "zod": "^4.1.12"
}
```

### Custom Theming

```tsx
<StackOneHub
  token={token}
  theme={{
    colors: {
      primary: { background: '#6366f1', foreground: '#ffffff' },
      card: { background: '#fafafa' },
    },
  }}
/>
```

## Legacy Hub (v1) — `@stackone/react-hub`

The older iframe-based approach. Use only if maintaining existing v1 implementations.

```bash
npm install @stackone/react-hub
```

Fetch `https://docs.stackone.com/guides/embedding-stackone-hub` for v1 usage patterns.
