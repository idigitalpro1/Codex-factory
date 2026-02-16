import os

from flask import Flask
from flask_cors import CORS

from .config import Config
from .db import init_db
from .routes.admin import admin_bp
from .routes.ai import ai_bp
from .routes.feed import feed_bp
from .routes.health import health_bp


def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure data directory exists for file-based SQLite
    db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if db_uri.startswith("sqlite:///") and ":memory:" not in db_uri:
        db_path = db_uri.replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

    init_db(app)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:8090",
                    "http://127.0.0.1:8090",
                    "http://localhost:4173",
                    "http://127.0.0.1:4173",
                ]
            }
        },
    )

    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(feed_bp, url_prefix="/api/v1")
    app.register_blueprint(ai_bp, url_prefix="/api/v1")
    app.register_blueprint(admin_bp, url_prefix="/api/v1")

    return app
