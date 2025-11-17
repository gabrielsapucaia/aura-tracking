# Aura Tracking

Aura Tracking is the internal operations dashboard for monitoring equipment health and operator activity. It is built with the Next.js App Router, Supabase, and the Tailwind v4 runtime.

### Brand Palette

| Token | Hex |
| --- | --- |
| Primary (mid navy) | `#2D3D70` |
| Deep Navy | `#18213D` |
| Accent Coral | `#F4614D` |
| Highlight Teal | `#00A195` |
| Mist Grey | `#AAB1BB` |
| Graphite | `#4D5054` |

## Requirements

- Node 20+
- pnpm 9+
- Supabase project (SQL + Auth)
- Azure AD tenant (for Microsoft OAuth)

## Environment Variables

Copy `.env.example` to `.env.local` and fill the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for browser). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used by server actions. Keep private. |
| `SUPABASE_AUTH_MICROSOFT_CLIENT_ID` | Azure AD application (client) ID used by Supabase Auth. |
| `SUPABASE_AUTH_MICROSOFT_CLIENT_SECRET` | Azure AD client secret. |
| `SUPABASE_AUTH_REDIRECT_URI` | Usually `https://<project-ref>.supabase.co/auth/v1/callback`. |
| `NEXT_PUBLIC_SITE_URL` | Base URL of this Next.js app (used for redirects). |

> Run the SQL migrations inside `supabase/sql/` (operators + user_roles) in your Supabase project to align the schema.

## Microsoft OAuth Setup

1. **Azure AD application**
	- Register a new app in [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps).
	- Supported account types: “Accounts in this organizational directory only”.
	- Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (Web).
	- Copy the **Application (client) ID** and create a **client secret**.

2. **Supabase Auth provider**
	- In Supabase Dashboard → Authentication → Providers → Microsoft.
	- Paste the Azure client ID and secret.
	- (Optional) set the **Site URL** to your production domain or `http://localhost:3000` for dev.

3. **Next.js configuration**
	- Ensure `.env.local` contains the Azure credentials.
	- Future middleware will redirect anonymous users to `/login`, which uses the Supabase Auth UI to trigger the Microsoft sign-in flow.

## Development

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

## Testing & Quality

- `pnpm test` – run Vitest unit tests.
- `pnpm lint` – run ESLint.
- `pnpm build` – Next.js production build (includes type-checking).

## Roadmap Snapshot

- [ ] Microsoft OAuth login screen (`/login`).
- [ ] Middleware to guard private routes.
- [ ] `user_roles` / permissions tables in Supabase.
- [ ] UI for assigning roles & permissions.
- [ ] Audit log viewer in the sidebar.

See `supabase/sql/` for schema changes and keep `.env.example` up to date as new secrets are introduced.
