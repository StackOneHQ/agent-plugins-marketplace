# StackOne API Categories

StackOne unifies these API categories. Fetch the relevant introduction page for details on available endpoints, request/response schemas, and supported operations.

| Category | Introduction | Example Endpoint |
|----------|-------------|-----------------|
| HRIS | https://docs.stackone.com/hris/introduction | `GET /unified/hris/employees` |
| ATS | https://docs.stackone.com/ats/introduction | `GET /unified/ats/candidates` |
| CRM | https://docs.stackone.com/crm/introduction | `GET /unified/crm/contacts` |
| LMS | https://docs.stackone.com/lms/introduction | `GET /unified/lms/content` |
| IAM | https://docs.stackone.com/iam/introduction | `GET /unified/iam/users` |
| Documents | https://docs.stackone.com/documents/introduction | `GET /unified/documents/documents` |
| Accounting | https://docs.stackone.com/accounting/introduction | `GET /unified/accounting/accounts` |
| Ticketing | https://docs.stackone.com/ticketing/introduction | `GET /unified/ticketing/tickets` |
| Messaging | https://docs.stackone.com/messaging/introduction | `POST /unified/messaging/messages` |

All data endpoints require:
- `Authorization: Basic base64(api_key:)` header
- `x-account-id: {account_id}` header

For the full API reference across all categories, fetch `https://docs.stackone.com/llms.txt` and look for the relevant `api-reference` pages.
