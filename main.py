from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from pathlib import Path
from starlette.staticfiles import StaticFiles
import threading

app = FastAPI(title="PayLens", version="0.1.0")

origins = settings.cors_origins
allow_credentials = False if "*" in origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

dist_dir = Path(__file__).resolve().parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")


@app.on_event("startup")
def _startup():
    if settings.imap_enabled:
        from app.services.imap_ingest import run_forever
        t = threading.Thread(target=run_forever, daemon=True)
        t.start()
