# EduMonitor AI Monitoring Service

Independent FastAPI microservice for the EduMonitor virtual classroom.
Analyzes individual browser-captured still frames (never a video stream)
for:

- **Face presence** — is a face visible at all (MediaPipe Face Mesh)
- **Head orientation / "looking away"** — approximate yaw angle via
  `cv2.solvePnP` against a generic 6-point 3D face model
- **Phone presence** — YOLOv8 object detection for the COCO "cell phone" class

Frames are decoded in memory, analyzed, and discarded immediately. Nothing
is written to disk or persisted by this service — event history is Node's
responsibility (Phase 10).

## Setup

```bash
cd python-monitoring
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
cp .env.example .env
pip install -r requirements.txt
```

`requirements.txt` installs FastAPI, OpenCV, and MediaPipe directly.
**Ultralytics (YOLO) is called out separately** in that file because on
Linux, PyPI's default `torch` wheel bundles full CUDA support — several
GB installed, even with no GPU. See the comment block in
`requirements.txt` for the CPU-only install path if you don't have a CUDA
GPU, or just `pip install ultralytics==8.3.40` if disk space and download
size aren't a concern.

## Downloading the YOLO model (required for phone detection)

This service does **not** bundle or fake YOLO weights. Phone detection is
explicitly reported as **unavailable** (not "no phone found") until you
provide a real weights file:

```bash
mkdir -p app/models
curl -L -o app/models/yolov8n.pt \
  https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt
```

(Or download manually from the Ultralytics releases page on GitHub and
place it at `python-monitoring/app/models/yolov8n.pt`.)

Once both `ultralytics` is installed and the weights file exists at that
path (or wherever `YOLO_MODEL_PATH` in `.env` points), phone detection
activates automatically on the next request — no code changes needed.

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

- `GET /health` — liveness check
- `GET /docs` — interactive Swagger UI
- `POST /analyze` — the main endpoint, called by Node's `monitoringClient.js`

## What was verified during development (and what wasn't)

This service was built and tested in a sandboxed environment with **no
GPU and limited disk space**, which shaped what could be verified
directly:

- Face detection is real and was tested against real photos: a known
  public-domain test image with a face correctly returned
  `face_detected: true`, and blank/random-noise images correctly returned
  `face_detected: false`. This is genuine MediaPipe inference, not a stub.
- The looking-away heuristic runs real geometry (solvePnP against
  detected landmarks) and produced a plausible large yaw angle on a
  photo with an off-angle face pose.
- YOLO/phone detection could not be installed or run in the sandbox this
  project was built in — `ultralytics`'s PyPI dependency chain (`torch`
  with bundled CUDA libraries) exceeded the available disk space, and the
  lightweight CPU-only PyTorch package index wasn't reachable from that
  environment. The detector code (`app/detection/yolo_detector.py`) is
  complete and follows the same patterns as the working face-detection
  code, and it correctly reports `phone_detection_available: false` with
  a clear reason when the model isn't installed — but the actual
  detection path (finding a real phone in a real frame) has not been
  exercised end-to-end. Please install `ultralytics` and download the
  weights on your own machine and verify this yourself before relying on
  it — this is the one piece of the AI service that could not be
  personally confirmed working, as distinct from "confirmed working,
  please double-check."

## Environment Variables

See `.env.example`:
- `PORT` — service port (default 8000)
- `NODE_SERVER_URL` — restricts CORS to only Node's server
- `YOLO_MODEL_PATH` — path to the downloaded weights file
- `PHONE_DETECTION_CONFIDENCE` — minimum confidence to count as a positive detection
