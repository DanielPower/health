# Health

Personal health-data monorepo. Each product is independently deployable and shares the Postgres database through explicit tables owned by that product.

## Layout

- `apps/web` — SvelteKit UI and its server-side API routes.
- `services/scale-collector` — Python BLE collector for the Etekcity ESF-551.
- `infra/postgres/init` — initial database schema. Add versioned migrations here (or introduce a dedicated migration tool) as services evolve.

## Development

Copy `.env.example` to `.env`, set a password, then run `docker compose up --build` on a Linux host with BlueZ and a Bluetooth adapter. The UI is at `http://localhost:3000`.

JavaScript uses pnpm, oxfmt, and oxlint. Python uses uv and Ruff:

```sh
pnpm install
pnpm format:check
pnpm lint
uv sync --all-packages
uv run ruff check .
uv run ruff format --check .
```

The collector needs Linux host Bluetooth access; Docker Desktop on macOS and Windows cannot reliably provide that adapter to a Linux container.
