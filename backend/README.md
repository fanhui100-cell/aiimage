# AI Image Backend

FastAPI backend for the AI e-commerce product image SaaS.

## Requirements

- Python 3.13+
- Poetry
- Docker (for local Postgres + Redis)

## Setup

### 1. Install dependencies

```bash
poetry install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

### 3. Start the database (requires Docker)

> **IMPORTANT**: Docker must be installed to run the local database.
> The `docker-compose.yml` at the project root starts Postgres and Redis.

```bash
# From the project root (c:\Users\fanhu\Desktop\test)
docker-compose up -d
```

### 4. Run database migrations

Once Docker containers are running:

```bash
cd backend
poetry run alembic upgrade head
```

### 5. Start the development server

```bash
cd backend
poetry run uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000.
Interactive docs: http://localhost:8000/docs

## Database Migrations

Alembic is used for schema migrations.

```bash
# Create a new migration (requires live DB for --autogenerate)
poetry run alembic revision --autogenerate -m "description"

# Apply all pending migrations
poetry run alembic upgrade head

# Roll back one migration
poetry run alembic downgrade -1

# View migration history
poetry run alembic history
```

### Running without Docker

If Docker is not available, you cannot run migrations against a live database.
The migration files are already committed and will be applied when Docker is available.
You can still inspect the SQL that would be generated:

```bash
poetry run alembic upgrade head --sql
```

## Project Structure

```
backend/
├── alembic/            # Database migration scripts
│   └── versions/       # Individual migration files
├── app/
│   ├── models/         # SQLAlchemy ORM models
│   ├── routers/        # FastAPI route handlers
│   ├── schemas/        # Pydantic request/response schemas
│   ├── services/       # Business logic
│   ├── middleware/     # FastAPI middleware
│   ├── config.py       # Settings (loaded from .env)
│   ├── database.py     # SQLAlchemy engine + session
│   └── main.py         # FastAPI application factory
├── alembic.ini         # Alembic configuration
├── pyproject.toml      # Poetry dependencies
└── .env.example        # Environment variable template
```
