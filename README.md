# SplitwiseR

> Split expenses, manage community fees, and let AI parse bills — built with Next.js, Supabase, and the Anthropic API.

---

## Setup in 5 minutes

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Once created, go to **SQL Editor** → **New query**
3. Paste the entire contents of `supabase/migrations/001_schema.sql` and click **Run**
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon` / `public` key

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com).

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — done!

---

## Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) and it auto-deploys on every push.

Add the same 3 environment variables in **Vercel → Settings → Environment Variables**.

---

## Features

| Feature | Description |
|---|---|
| 🔐 Auth | Email/password sign-up via Supabase Auth |
| 👥 Groups | Trip, home, community, or custom groups |
| 💸 Expenses | Add expenses, split equally or custom amounts |
| 🤖 AI parser | Describe an expense in plain English — Claude structures it |
| 🏘️ Community fees | HOA, neighborhood watch, garden committee fees (admin-only) |
| ⚖️ Settle up | Debt simplification with minimal transactions |
| 📊 Dashboard | Net balances, recent activity, group overview |

---

## Project structure

```
splitwiser/
├── app/
│   ├── (app)/              # Authenticated app routes
│   │   ├── dashboard/
│   │   ├── groups/
│   │   │   ├── [id]/       # Group detail page
│   │   │   └── new/
│   │   ├── activity/
│   │   └── settle/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   └── api/
│       └── ai/parse/       # AI expense parsing endpoint
├── components/
│   ├── layout/             # Sidebar
│   ├── expenses/           # ExpenseRow, AddExpenseButton, AIParser
│   ├── groups/             # GroupCard, InviteMember
│   └── community/          # CommunityFeesPanel
├── lib/
│   ├── supabase/           # Client, server, middleware helpers
│   ├── queries.ts          # Database query functions
│   ├── balances.ts         # Balance calculation + debt simplification
│   └── utils.ts            # Formatting, colors, metadata
├── types/                  # TypeScript types
└── supabase/
    └── migrations/         # SQL schema
```

---

## Extending SplitwiseR

**Add expense categories** → edit `CATEGORY_META` in `lib/utils.ts`

**Customise split logic** → edit `AddExpenseButton.tsx` (currently equal splits; add percentage/custom modes)

**Add email notifications** → use Supabase Edge Functions + Resend

**Add recurring fee auto-billing** → use Supabase cron jobs (pg_cron) to generate expense rows from `community_fees`
