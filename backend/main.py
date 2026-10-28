"""BrandWarden — FastAPI application entry point."""
import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import engine, SessionLocal
from backend.models import Base
from backend.seed import seed
from backend.routers import guidelines, submissions, analysis, findings, review, settings as settings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        logger.info("Seed data loaded.")
    except Exception as e:
        logger.error("Error during DB seeding: %s", e)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


if os.environ.get("VERCEL"):
    init_db()


app = FastAPI(
    title="BrandWarden",
    description="Evidence-first brand governance platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(guidelines.router)
app.include_router(submissions.router)
app.include_router(analysis.router)
app.include_router(findings.router)
app.include_router(review.router)
app.include_router(settings_router.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "BrandWarden"}


# Serve frontend build (Vite output)
_candidates = [
    Path(__file__).parent.parent / "frontend" / "dist",
    Path(__file__).parent / "frontend" / "dist",
]
FRONTEND_DIST = next((p.resolve() for p in _candidates if p.exists()), _candidates[0].resolve())


def _mount_frontend():
    if FRONTEND_DIST.exists():
        assets_dir = FRONTEND_DIST / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            if full_path.startswith("api/") or full_path.startswith("health") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="API route not found")
            index = FRONTEND_DIST / "index.html"
            if index.exists():
                return FileResponse(str(index))
            return {"error": "Frontend build index.html not found"}

        logger.info("Frontend mounted from %s", FRONTEND_DIST)
    else:
        logger.warning("Frontend dist not found at %s; API-only mode.", FRONTEND_DIST)


_mount_frontend()
