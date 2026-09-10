# BarberFlow — SaaS de gestão de barbearias

Sistema multi-tenant para barbearias: agendamento online, dashboard financeiro,
gestão de clientes/barbeiros/serviços, comissões, notificações e relatórios.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack)
- **TypeScript** (strict)
- **Tailwind CSS v4** + componentes próprios (estilo shadcn/ui) + dark mode
- **Prisma 6** + **PostgreSQL** (Supabase)
- **Auth.js v5** (NextAuth) — login por email/senha, senhas com bcrypt
- **Recharts** (gráficos), **Sonner** (toasts), **Zod** + **React Hook Form**
- **Vitest** (testes unitários das regras de negócio)

## Pré-requisitos

- Node.js 20+ (recomendado 22 LTS)
- Um banco PostgreSQL (ex.: Supabase)

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie as variáveis de ambiente e preencha:

   ```bash
   cp .env.example .env
   ```

   Variáveis essenciais para começar:

   - `DATABASE_URL` e `DIRECT_URL` — conexão do Postgres/Supabase
   - `AUTH_SECRET` — gere com `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL` — ex.: `http://localhost:3000`
   - `CRON_SECRET` — protege o endpoint de lembretes

3. Crie as tabelas e popule dados de teste:

   ```bash
   npm run db:migrate   # aplica as migrations
   npm run db:seed      # popula uma barbearia de demonstração
   ```

4. Rode o projeto:

   ```bash
   npm run dev
   ```

   Acesse http://localhost:3000

### Login de demonstração (após o seed)

- **Proprietário:** `dono@barbeariamodelo.com` / `senha1234`
- **Barbeiro:** `joao@barbeariamodelo.com` / `senha1234`
- **Página pública de agendamento:** `/barbearia/barbearia-modelo/agendar`

## Scripts

| Script              | Descrição                                   |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento                 |
| `npm run build`     | Build de produção                           |
| `npm run start`     | Servidor de produção                        |
| `npm run lint`      | ESLint                                      |
| `npm test`          | Testes (Vitest)                             |
| `npm run db:migrate`| Cria/atualiza o schema (prisma migrate dev) |
| `npm run db:deploy` | Aplica migrations em produção               |
| `npm run db:seed`   | Popula dados de demonstração                |
| `npm run db:studio` | Abre o Prisma Studio                        |

## Arquitetura

```
app/
  (auth)/            # login, registro, recuperação de senha
  (app)/             # área autenticada (sidebar + bottom nav)
    dashboard/ agendamentos/ clientes/ barbeiros/
    servicos/ financeiro/ relatorios/ configuracoes/
  barbearia/[slug]/agendar/   # página pública de agendamento (sem login)
  api/                        # route handlers (auth, cron, ics, export)
components/          # UI e componentes por domínio
lib/
  auth/ permissions/          # sessão, roles, guards
  services/                   # regras de negócio (acesso ao banco)
  actions/                    # server actions (validação + permissão + audit)
  availability/               # algoritmo de disponibilidade (puro + DB)
  validations/                # schemas Zod
  notifications/              # templates, wa.me, provider
prisma/             # schema + seed
tests/              # testes unitários (Vitest)
```

Princípios: multi-tenancy rigoroso (o `tenant_id` vem sempre da sessão, nunca do
cliente), regras de negócio na camada de serviços, validação com Zod em toda
entrada, soft delete para dados importantes e auditoria das mutações.

## Deploy

### Frontend/API — Vercel

- Conecte o repositório na Vercel.
- Configure as variáveis de ambiente (as mesmas do `.env`).
- O build roda `next build`. Rode `npm run db:deploy` no fluxo de deploy do banco.

### Banco — Supabase

- Use a connection string com pooler (porta 6543) em `DATABASE_URL` e a conexão
  direta (porta 5432) em `DIRECT_URL`.

### Lembretes — Vercel Cron

- O arquivo `vercel.json` agenda `/api/cron/reminders` de hora em hora.
- Defina `CRON_SECRET` no ambiente da Vercel; o endpoint valida o header
  `Authorization: Bearer <CRON_SECRET>`.

### Integrações preparadas (não obrigatórias no MVP)

- **WhatsApp:** `WHATSAPP_API_URL` / `WHATSAPP_API_KEY` (Cloud API ou Evolution)
- **Email:** `RESEND_API_KEY`
- **Billing:** `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`

  Sem essas variáveis, notificações são registradas mas não enviadas, e a troca
  de plano funciona sem cobrança real (arquitetura pronta para plugar o gateway).

## Testes

```bash
npm test
```

Cobrem as regras críticas: algoritmo de disponibilidade (conflitos, duração,
bloqueios, antecedência), cálculo de comissão, permissões por role, geração de
mensagens/links/CSV/ICS e resolução de períodos.
