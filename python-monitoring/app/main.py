from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, frame_analysis

app = FastAPI(
    title="EduMonitor AI Computer Vision Service",
    description="Microservice providing real-time face detection, head orientation, and YOLO distraction detection",
    version="1.0.0"
)

# CORS setup for React client and Node backend
origins = [
    "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(health.router)
app.include_router(frame_analysis.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)