import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/dcoc")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    UPLOAD_FOLDER = os.path.join(basedir, "uploads")
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
    CORS_ORIGINS = "*"


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    MONGO_URI = "mongodb://localhost:27017/dcoc_test"


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
