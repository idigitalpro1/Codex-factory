from flask import Flask
from flask_cors import CORS

from .config import Config
from .routes.ai import ai_bp
from .routes.feed import feed_bp
from .routes.health import health_bp


def create_app(config_class: type[Config] = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)

    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(feed_bp, url_prefix="/api/v1")
    app.register_blueprint(ai_bp, url_prefix="/api/v1")

    return app
