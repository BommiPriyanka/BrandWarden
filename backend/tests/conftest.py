"""conftest.py — pytest configuration."""
import os
import pytest

os.environ["DATABASE_URL"] = "sqlite:///./test_brandwarden.db"
os.environ.pop("ANTHROPIC_API_KEY", None)
os.environ.pop("GEMINI_API_KEY", None)

from backend.database import engine, SessionLocal
from backend.models import Base
from backend.seed import seed


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield
    # Clean up test db file if desired
    # Base.metadata.drop_all(bind=engine)
