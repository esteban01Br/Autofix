"""Esquemas base comunes."""

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    """Esquema que puede construirse directamente desde un ORM."""

    model_config = ConfigDict(from_attributes=True)