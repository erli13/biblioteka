# Biblioteka Dhaskal Todri

A modern digital library catalog built with Next.js — browse, search, and manage a full book collection with a clean public-facing interface and a protected admin dashboard.

---

## Features

### Public Catalog
- Full-text search across title and author (debounced, no page reloads)
- 12 category pills for quick genre filtering
- Responsive book grid (4 columns → 2 → 1 across breakpoints)
- Book detail modal with full metadata and cover image
- Deterministic color-coded placeholders for books without covers
- Sticky header showing live book count
- Paginated results (24 books per page)

### Admin Dashboard
- Password-protected via HTTP Basic Auth
- Manage books: search, multi-select, bulk delete
- Enrich books: inline editor for adding covers and descriptions
- Cover upload (file or URL) with instant preview
- Persistent pagination and filters

### Data Pipeline
- CSV import script for bulk seeding from spreadsheet exports
- Google Books enrichment script — auto-fetches covers and descriptions with rate limiting

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | Turso (LibSQL) via Prisma ORM |
| Styling | Tailwind CSS 4 |
| Auth | HTTP Basic Auth (middleware) |
| Scripting | tsx, csv-parse, Cheerio |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Turso](https://turso.tech) database (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/erli13/biblioteka.git
cd biblioteka
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
ADMIN_USER="admin"
ADMIN_PASSWORD="your-secure-password"
```

### 3. Set Up the Database

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Seed from CSV (optional)

Place your CSV file at `data/Copy of Table1.csv` with columns: `id, title, author, quantity, location, genre`, then run:

```bash
npx tsx prisma/seed.ts
```

### 5. Enrich Book Metadata (optional)

Fetches covers and descriptions from the Google Books API for any books missing them:

```bash
npx tsx prisma/enrich.ts
```

### 6. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | LibSQL connection URL from Turso |
| `TURSO_AUTH_TOKEN` | Auth token from Turso dashboard |
| `ADMIN_USER` | Username for the admin area |
| `ADMIN_PASSWORD` | Password for the admin area |

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── books/              # Public search API
│   │   └── admin/books/        # Admin CRUD + cover upload
│   ├── admin/
│   │   ├── page.tsx            # Manage books
│   │   └── enrich/page.tsx     # Enrich metadata
│   └── page.tsx                # Public catalog
├── lib/
│   └── prisma.ts               # Prisma client singleton
├── prisma/
│   ├── schema.prisma           # Book model
│   ├── seed.ts                 # CSV import
│   └── enrich.ts               # Google Books enrichment
├── middleware.ts               # Basic auth guard
└── data/                       # Source CSV files
```

---

## Database Schema

```prisma
model Book {
  id          Int     @id @default(autoincrement())
  title       String
  author      String?
  quantity    Int
  location    String
  genre       String?
  description String?
  coverUrl    String?
}
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm start` | Start production server |
| `npx tsx prisma/seed.ts` | Import books from CSV |
| `npx tsx prisma/enrich.ts` | Enrich books via Google Books API |

---

## License

MIT
