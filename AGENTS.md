# AGENTS.md

This repository contains the AutoFix workshop management application. Use the project-specific guidance below before making changes.

## Project layout

- Root: orchestration and shared startup scripts.
- `autofix-backend-fastapi/`: FastAPI API server.
- `autofix-frontend/`: React + Vite frontend.

See the root docs for product context:
- [README.md](README.md)
- [autofix-backend-fastapi/README.md](autofix-backend-fastapi/README.md)
- [autofix-frontend/README.md](autofix-frontend/README.md)

## Agent workflow

- Start by identifying whether the change belongs to the backend API, frontend UI, or both.
- Read the exact route, service, schema, or page component before editing; do not patch a symptom in one layer without checking the matching layer.
- Prefer existing patterns over introducing new abstractions, especially in service and repository boundaries.
- Validate with the smallest relevant command: targeted backend tests for API logic, or the repo launcher when checking end-to-end behavior.

## How to run the app

Use the project launcher from the repository root:

```powershell
.\start-dev.ps1
```

Optional setup-only mode:

```powershell
.\start-dev.ps1 -Setup
```

This script will prepare the backend virtual environment, install Python dependencies, create the default `.env`, install frontend dependencies, seed the default admin user, and start both services together.

Default admin credentials:
- Email: `admin@autofix.com`
- Password: `Admin123!`

## Backend conventions

The backend is in `autofix-backend-fastapi` and follows a layered architecture:

- `app/routers/`: API endpoints (FastAPI `APIRouter`)
- `app/services/`: business logic and validations
- `app/crud/`: database access logic and repository-style operations
- `app/models/`: SQLAlchemy ORM models
- `app/schemas/`: Pydantic request/response schemas
- `app/security.py`: JWT and password handling
- `app/config.py` and `app/database.py`: runtime configuration and DB setup
- `tests/`: pytest-based API tests

When editing backend code:
- Keep route logic thin; put business rules in services.
- Use the existing modules and naming patterns rather than introducing a new architecture.
- Respect role-based access rules and the auth flow (`/api/auth`, JWT, `deps.py`).
- Preserve domain rules such as invoice restrictions, stock adjustments, status transitions, and authentication behavior.
- Prefer targeted tests that validate real API behavior over mock-heavy tests.

## Frontend conventions

The frontend is in `autofix-frontend` and uses Vite + React.

- `src/pages/`: page-level screens
- `src/components/`: reusable UI components
- `src/context/`: auth/session and toast state
- `src/services/`: HTTP clients grouped by resource
- `src/layouts/`: layout wrappers

When editing frontend code:
- Keep API calls in the existing service modules and match the backend resource names.
- Reuse common components such as `Header`, `Sidebar`, `Modal`, `Spinner`, and `EmptyState` when appropriate.
- Follow the current app flow for protected routes and role-aware UI behavior.
- Preserve the existing responsive layout and state handling patterns.

## Testing and validation

Before claiming a fix is complete, validate with the smallest relevant command:

- Backend tests:

```powershell
cd autofix-backend-fastapi
.venv\Scripts\python.exe -m pytest tests -q
```

- Full app startup for end-to-end verification:

```powershell
.\start-dev.ps1
```

## Implementation priorities

When working in this repo, prefer the following order:
1. Read the exact API / component context before editing.
2. Match existing patterns in routers, services, models, or frontend service modules.
3. Make the smallest possible change that solves the issue.
4. Validate the affected behavior with a targeted test or app run.
5. Keep the solution consistent with the project’s status/role/domain rules.

## Avoid

- Renaming modules or changing the app structure without a clear reason.
- Bypassing the service layer in backend logic.
- Creating duplicate patterns that do not match the existing API or React conventions.
- Changing auth or billing rules without verifying the downstream impact.

This project is a Spanish-language workshop management system. Keep code, comments, and user-facing text aligned with the existing app behavior and terminology.
