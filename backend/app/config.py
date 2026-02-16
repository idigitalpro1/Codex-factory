import os
from pathlib import Path


_default_db = "sqlite:///" + str(Path(__file__).resolve().parent.parent / "data" / "app.db")


class Config:
    APP_NAME = "nextgen-digital-factory"
    APP_ENV = os.getenv("APP_ENV", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", _default_db)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
