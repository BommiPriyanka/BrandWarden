import sys
from pathlib import Path

# Ensure root directory is on sys.path so backend imports succeed
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app

# Vercel ASGI handler
handler = app
