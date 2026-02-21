# 🏪 Shop Inventory & Order Management System

A comprehensive web-based inventory management and POS solution for retail shops, built with **Node.js/Express/Prisma** (backend) and **React/Vite** (frontend).

> **Docs:** See [PRD](shop_inventory_prd.md) and [TRD](shop_inventory_trd.md) for full product and technical requirements.

---

## 🏗️ Architecture

```
Hoodal/
├── src/                  # Backend (Express + TypeScript)
│   ├── config/           # Env, database, constants
│   ├── controllers/      # Route handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, validation, error handling
│   ├── routes/           # API route definitions
│   ├── validators/       # Zod schemas
│   ├── types/            # TypeScript types
│   ├── utils/            # JWT, password, pagination helpers
│   ├── app.ts            # Express app setup
│   └── server.ts         # Entry point
├── prisma/               # Database schema & migrations
├── frontend/             # Frontend (React + Vite + TailwindCSS)
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route-level pages
│       ├── stores/       # Zustand state management
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utilities and API client
│       └── types/        # TypeScript types
└── docker-compose.yml    # PostgreSQL database
```

**Tech Stack:** Node.js 20 · Express 4 · TypeScript · Prisma · PostgreSQL 15 · React 19 · Vite · TailwindCSS 4 · Zustand · TanStack Query

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **Docker** & Docker Compose ([download](https://www.docker.com/products/docker-desktop/))
- **npm** (comes with Node.js)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Hoodal

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Backend
cp .env.example .env

# Frontend
cp frontend/.env.example frontend/.env
```

The defaults work out of the box with the Docker database. No changes needed for local dev.

### 3. Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port **5433** (mapped from container port 5432).

### 4. Set Up the Database Schema

```bash
# Generate Prisma client
npm run prisma:generate

# Apply migrations
npx prisma migrate deploy

# Seed initial data (admin user, roles, categories)
npm run prisma:seed
```

### 5. Start Development Servers

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 3000)
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

### 6. Open the App

Visit **http://localhost:5173** and log in:

| Field    | Value          |
|----------|----------------|
| Email    | `admin@shop.com` |
| Password | `Admin@123`    |

---

## 📜 Available Scripts

### Backend (root directory)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run test suite |
| `npm run lint` | Lint source code |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Create & apply migrations |
| `npm run prisma:seed` | Seed database |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |

### Frontend (`frontend/` directory)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint source code |

---

## 🔌 API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `POST /auth/login` | Login |
| Auth | `POST /auth/register` | Register |
| Auth | `GET /auth/me` | Current user |
| Products | `GET /products` | List products |
| Products | `POST /products` | Create product |
| Inventory | `GET /inventory` | List inventory |
| Inventory | `PUT /inventory/:id/adjust` | Adjust stock |
| Dashboard | `GET /dashboard/overview` | Metrics |

See full API docs in the [TRD](shop_inventory_trd.md).

---

## 🌿 Git Workflow

We use a **branching model** with `main` (production) and `dev` (integration):

1. Create a feature branch from `dev`: `git checkout -b feature/your-feature dev`
2. Make your changes, commit with [conventional commits](https://www.conventionalcommits.org/)
3. Push and open a PR to `dev`
4. After review & merge, `dev` is periodically merged to `main` for releases

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| DB connection refused | Make sure Docker is running: `docker-compose up -d` |
| Port 3000 in use | Change `PORT` in `.env` or kill the process: `lsof -ti:3000 \| xargs kill` |
| Prisma client errors | Run `npm run prisma:generate` after any schema changes |
| Frontend can't reach API | Verify `VITE_API_URL` in `frontend/.env` matches the backend port |

---

## 📄 License

ISC
