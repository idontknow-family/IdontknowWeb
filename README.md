# FiveM Family Member Roster & Management System

Full-stack public roster + admin CRUD dashboard for FiveM family/gang communities.
Stack: **Node.js + Express + EJS + Tailwind (CDN) + PostgreSQL + Prisma**.

## Folder Structure

```
fivem-roster/
├── config/
│   └── db.js                 # Prisma client singleton
├── middleware/
│   ├── auth.js                # requireAuth / redirectIfAuthed
│   └── upload.js               # Multer avatar upload config
├── prisma/
│   ├── schema.prisma           # Member + AdminUser models
│   └── seed.js                 # Seeds 5 members + 1 admin
├── public/
│   ├── css/style.css           # Glassmorphism / neon-gold theme
│   ├── js/roster.js            # Search, filter, modal (client-side)
│   └── uploads/                # Uploaded avatar images
├── routes/
│   ├── public.js                # Roster page + JSON API
│   ├── adminAuth.js            # Login / logout
│   └── admin.js                 # Admin dashboard + Member CRUD
├── views/
│   ├── partials/
│   │   ├── head.ejs
│   │   └── admin-nav.ejs
│   ├── admin/
│   │   ├── login.ejs
│   │   ├── dashboard.ejs
│   │   └── member-form.ejs
│   ├── index.ejs                # Public roster page
│   └── 404.ejs
├── server.js                    # App entry point
├── package.json
├── .env.example
└── .gitignore
```

## 1. Local Setup in VS Code

```bash
git clone <your-repo-url>
cd fivem-roster
npm install
cp .env.example .env
```

Edit `.env`:
- Set `DATABASE_URL` to a local Postgres instance (or a Railway one, see below).
- Set `SESSION_SECRET` to any long random string.
- Optionally customize `FAMILY_NAME` / `FAMILY_SLOGAN`.

Run migrations + seed data:

```bash
npx prisma migrate dev --name init
npm run seed
```

Start the dev server:

```bash
npm run dev
```

- Public roster: http://localhost:3000
- Admin login: http://localhost:3000/admin/login
  - Username: value of `DEFAULT_ADMIN_USERNAME` (default `admin`)
  - Password: value of `DEFAULT_ADMIN_PASSWORD` (default `ChangeMe123!`)

**Change the default admin password immediately after first login** (or reseed with a new password before going live).

## 2. Set Up Railway PostgreSQL

1. Go to [railway.app](https://railway.app) → **New Project** → **Provision PostgreSQL**.
2. Once created, open the Postgres service → **Variables** tab → copy `DATABASE_URL` (or leave it — you'll reference it, not copy it, in step 4).
3. Create a second service in the same project: **New** → **GitHub Repo** (see step 3 below) or **Empty Service** for now.

## 3. Push Repository to GitHub

```bash
git init
git add .
git commit -m "Initial commit: FiveM family roster system"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 4. Deploy to Railway

1. In your Railway project, click **New** → **GitHub Repo** → select your repo.
2. Open the new app service → **Variables** tab → add:
   - `DATABASE_URL` → click "Add Reference" and select your Postgres service's `DATABASE_URL` (Railway syntax: `${{Postgres.DATABASE_URL}}`)
   - `SESSION_SECRET` → a long random string
   - `NODE_ENV` → `production`
   - `FAMILY_NAME`, `FAMILY_SLOGAN` → your branding
   - `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_PASSWORD` → for the one-time seed
   - Railway sets `PORT` automatically; `server.js` already reads `process.env.PORT`.
3. Under **Settings** → **Deploy**, confirm:
   - Start Command: `npm start`
   - Build Command: leave default (npm handles `postinstall` → `prisma generate` automatically).
4. Deploy. Once live, open the Railway service **Shell** (or use `railway run`) and execute once:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
5. Visit your Railway-generated domain (or attach a custom domain under **Settings** → **Domains**).

## 4a. Re-deploying after changes

Just `git push` — Railway auto-builds and redeploys on every push to `main`.
Run `npx prisma migrate deploy` again via the Railway shell whenever the schema changes.

## Notes

- Avatars can be set via a direct image URL **or** uploaded as a file (stored in `public/uploads`). On Railway, uploaded files do **not** persist across redeploys unless you attach a [Railway Volume](https://docs.railway.app/reference/volumes) mounted at `public/uploads` — for production use, prefer image URLs (e.g. Discord CDN, imgur) or add a volume.
- Sessions are stored in PostgreSQL via `connect-pg-simple`, so admin logins survive restarts and work correctly with multiple instances.
- Passwords are hashed with `bcryptjs` — never stored in plaintext.
