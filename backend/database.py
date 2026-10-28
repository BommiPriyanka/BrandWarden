"""SQLAlchemy database setup."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

if os.environ.get("VERCEL"):
    DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:////tmp/brandwarden.db")
else:
    DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./brandwarden.db")

# SQLite needs check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
