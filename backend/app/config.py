import os


class Config:
    APP_NAME = "nextgen-digital-factory"
    APP_ENV = os.getenv("APP_ENV", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
