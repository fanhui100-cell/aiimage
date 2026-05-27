# /add-db-model

Add a new SQLAlchemy model and Alembic migration to the SOE AI Commercial Agent backend.

## Steps

1. **Create the model file** at `backend/models/{name}.py`:

   ```python
   from sqlalchemy.orm import Mapped, mapped_column, relationship
   from sqlalchemy import String, Integer, Enum, ForeignKey
   from models.base import Base, TimestampMixin
   import enum

   class MyStatus(str, enum.Enum):
       ACTIVE = "ACTIVE"
       INACTIVE = "INACTIVE"

   class MyModel(TimestampMixin, Base):
       __tablename__ = "my_table"

       id: Mapped[int] = mapped_column(primary_key=True)
       name: Mapped[str] = mapped_column(String(255), nullable=False)
       status: Mapped[MyStatus] = mapped_column(
           Enum(MyStatus), default=MyStatus.ACTIVE, nullable=False
       )
       # created_at, updated_at inherited from TimestampMixin
   ```

2. **Import the model** in `backend/models/__init__.py` so Alembic detects it:
   ```python
   from models.my_model import MyModel  # noqa: F401
   ```

3. **Generate the migration**:
   ```bash
   cd backend
   poetry run alembic revision --autogenerate -m "add_my_model_table"
   ```

4. **Review the generated migration** in `backend/alembic/versions/`:
   - Check column types are correct
   - Check nullable/not-null is correct
   - Check enum values match your Python enum
   - For SQLite: verify enum is stored as VARCHAR (not native PG enum)

5. **Run the migration**:
   ```bash
   poetry run alembic upgrade head
   ```

6. **Create Pydantic schemas** in `backend/schemas/{name}.py`:
   ```python
   from pydantic import BaseModel, ConfigDict

   class MyModelRead(BaseModel):
       model_config = ConfigDict(from_attributes=True)
       id: int
       name: str
       status: str
   ```

7. **Update seed data** in `backend/scripts/seed_demo_data.py` if new required rows are needed

8. **Update TypeScript types** in `frontend/types/index.ts`

## Checklist

- [ ] Model inherits `TimestampMixin, Base`
- [ ] Model imported in `models/__init__.py`
- [ ] Migration generated and reviewed
- [ ] Migration runs without error on SQLite
- [ ] Pydantic schema created with `from_attributes=True`
- [ ] Seed data updated if needed
- [ ] TypeScript types updated
