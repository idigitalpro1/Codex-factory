from flask import Flask
from flask_cors import CORS

from .config import Config
from .routes.admin import admin_bp
from .routes.ai import ai_bp
from .routes.feed import feed_bp
from .routes.health import health_bp


def create_app(config_class: type[Config] = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

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
