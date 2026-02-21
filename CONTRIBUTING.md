# Contributing to Shop Inventory

Thanks for contributing! Here's how to keep things clean and consistent.

---

## 🌿 Branch Naming

Create branches from `dev` using this convention:

| Prefix | Use |
|--------|-----|
| `feature/` | New features — `feature/milk-delivery` |
| `fix/` | Bug fixes — `fix/cart-total-rounding` |
| `chore/` | Maintenance — `chore/update-deps` |
| `docs/` | Documentation — `docs/api-endpoints` |

---

## 💬 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

Examples:
feat(pos): add barcode scanner hook
fix(inventory): correct stock adjustment calculation
chore(deps): update prisma to v5.22
docs(readme): add troubleshooting section
```

**Types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`

---

## 🔀 Pull Request Process

1. **Create** a branch from `dev` (never from `main`)
2. **Keep PRs small** — one feature or fix per PR
3. **Fill out** the PR template (description, testing, screenshots)
4. **Self-review** your diff before requesting review
5. **Resolve** all review comments before merging
6. **Squash merge** into `dev`

---

## 🧑‍💻 Code Style

- **Formatting:** We use Prettier — run `npx prettier --write .` before committing
- **Linting:** Run `npm run lint` and fix any errors
- **TypeScript:** No `any` types unless absolutely necessary — add a comment explaining why
- **Naming:** `camelCase` for variables/functions, `PascalCase` for components/classes, `SCREAMING_SNAKE` for constants

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Write tests for:
- Service layer business logic
- API endpoint behavior
- Edge cases and error handling

---

## 📁 Where to Put Things

| What | Backend | Frontend |
|------|---------|----------|
| Route handler | `src/controllers/` | — |
| Business logic | `src/services/` | — |
| Validation schema | `src/validators/` | — |
| API route | `src/routes/` | — |
| React page | — | `frontend/src/pages/` |
| React component | — | `frontend/src/components/` |
| State store | — | `frontend/src/stores/` |
| Custom hook | — | `frontend/src/hooks/` |
| TypeScript types | `src/types/` | `frontend/src/types/` |

---

## 🆘 Need Help?

- Check [README.md](README.md) for setup instructions
- Look at [shop_inventory_prd.md](shop_inventory_prd.md) for product requirements
- Ask in the team chat!
