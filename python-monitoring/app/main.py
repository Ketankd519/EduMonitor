from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routes import health, analyze

load_dotenv()

app = FastAPI(
    title="EduMonitor AI Monitoring Service",
    description=(
        "Independent computer-vision microservice for the EduMonitor virtual "
        "classroom. Analyzes individual browser-captured frames (not video "
        "streams) for face presence, gaze/head-orientation, and phone "
        "detection. Frames are processed in-memory and discarded — only "
        "derived event data is returned to the Node.js backend."
    ),
    version="0.1.0",
)

# Node server is the only expected caller; restrict CORS accordingly.
allowed_origin = os.getenv("NODE_SERVER_URL", "http://localhost:5000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)


@app.get("/")
def root():
    return {"service": "edumonitor-ai-monitoring", "status": "ok"}
