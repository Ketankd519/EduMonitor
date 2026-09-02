# EduMonitor
### Smart Virtual Classroom with AI-Based Student Activity Monitoring
**Academic Project:** Monitoring Student Activity in a Virtual Classroom (MCA)

---

## 1. Project Objective

EduMonitor is a full-stack virtual classroom platform that combines standard
LMS functionality (classes, posts, notes, MCQ assignments, attendance,
academic records) with a live WebRTC classroom and an independent
Python-based computer-vision service that derives **Attention** signals
(face presence, gaze, phone usage) during live sessions — kept strictly
separate from **Attendance** (presence), per the project brief.

## 2. Current Status: Phase 9 Complete

Phases 1–8 built the scaffold, auth, dashboards, class/classroom features,
assignments, attendance, academic records, and the live WebRTC classroom.
Phase 9 wires in the real Python AI monitoring service: face detection,
a head-orientation "looking away" heuristic, and YOLO-based phone
detection, integrated end-to-end from the student's browser through Node
to Python and back.

| Module | Status |
|---|---|
| `python-monitoring` (`/analyze`) | ✅ Real MediaPipe face detection + solvePnP head-pose heuristic, tested against real photos (see `python-monitoring/README.md`). YOLO phone detection is fully coded but **could not be installed/run in this sandbox** — disk space (see below) |
| `server` monitoring (`/api/monitoring/analyze-frame`) | ✅ Verified end-to-end against the real Python service with real images; in-memory temporal smoothing confirmed working correctly |
| `server` Socket.IO | ✅ `live:monitoring-status` broadcasts to the teacher in real time |
| `client` | ✅ Builds (0 errors); students see their own live monitoring overlay during a call, teachers see a live per-student status panel |

**On the YOLO/disk-space limitation — please read:** installing
`ultralytics` pulls in PyTorch, and on Linux, PyPI's default wheel bundles
full CUDA support (several GB of `nvidia-*` packages) even with no GPU.
This sandbox ran out of disk space attempting that install, and the
lightweight CPU-only PyTorch package index isn't reachable from here. So:
**face detection is real, tested, and confirmed working against actual
photos. Phone detection is fully implemented but genuinely untested** —
the code correctly reports "unavailable" rather than faking a result when
the model isn't present (per the project's own "do not fake AI"
requirement), and I'm being equally upfront that I could not verify the
detection path itself works. Please install `ultralytics` + download
`yolov8n.pt` on your own machine (`python-monitoring/README.md` has exact
commands) and confirm phone detection actually flags a phone in frame
before relying on it.

**What Phase 9 does NOT include yet (by design, per the agreed
roadmap):** persisted `MonitoringEvent`/`MonitoringSession` records, the
full monitoring dashboard with historical data, the end-of-class report,
and student progress charts — those are Phase 10. What exists now is
real-time only: a student's current status this instant, and a live
status panel for the teacher that resets when the page refreshes.

**Privacy (§47):** the browser captures a single downscaled JPEG still
every 5 seconds from the student's own camera feed — never a continuous
video stream — sends it for analysis, and discards it immediately after.
Nothing is written to disk at any point in the pipeline. A visible banner
tells students monitoring is active during the call.

> **Sandbox note (carried over):** still no MongoDB here, so the
> membership/live-class-active checks in `monitoringController.js` were
> verified via route-level auth rejection only, not a full live-class
> flow. The Node↔Python integration itself — the actual AI pipeline —
> **was** tested for real, including a genuine end-to-end call with real
> photos producing correct classifications (see below). Please verify the
> full "join live class as a student → see your own status update → see
> it appear on the teacher's panel" flow yourself; the WebRTC layer this
> depends on still needs your two-browser-window testing from Phase 8 if
> you haven't done that yet.

## 3. Technology Stack

- **Frontend:** React 18, Vite, React Router, Axios, Socket.IO client, Recharts, Lucide React
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, Multer, Socket.IO
- **AI Service:** Python, FastAPI (OpenCV / MediaPipe / YOLO added in Phase 9)
- **Database:** MongoDB

## 4. Folder Structure

```
edumonitor/
├── client/              React frontend
├── server/               Node/Express API + Socket.IO
├── python-monitoring/     FastAPI AI microservice
└── README.md
```

See each service's own structure inside `client/src`, `server/`, and
`python-monitoring/app/` — these are pre-created per the project's module
breakdown (controllers, routes, models, services, etc.) even where a given
folder is still empty, so file locations stay predictable as phases are added.

## 5. Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A running MongoDB instance (local `mongod` or MongoDB Atlas)

### 5.1 MongoDB
Install MongoDB locally, or create a free MongoDB Atlas cluster and copy its
connection string. Either way you'll set it as `MONGO_URI` in `server/.env`.

### 5.2 Backend (Node/Express)
```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev        # nodemon, auto-restarts on changes
# or: npm start
```
Verify: `curl http://localhost:5000/api/health` should return
`{"success":true,...,"data":{"db":"connected",...}}` once Mongo is reachable.

### 5.3 Frontend (React/Vite)
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Open the printed local URL (default `http://localhost:5173`). The home page
shows a live "Backend connectivity" status pulled from `/api/health`.

### 5.4 Python AI Monitoring Service
```bash
cd python-monitoring
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Verify: `curl http://localhost:8000/health`, or open
`http://localhost:8000/docs` for interactive API docs.

> **Note on AI models:** `requirements.txt` currently installs only FastAPI
> core packages. `opencv-python`, `mediapipe`, and `ultralytics` (YOLO) are
> added in **Phase 9**, along with the exact command to download the YOLO
> weights file. The service will not silently fake phone/face detection
> before that phase — those endpoints simply don't exist yet.

## 6. Environment Variables

Each service has its own `.env.example` (copy to `.env` and fill in):
- `server/.env.example` — Mongo URI, JWT secret, CORS origin, Python service URL
- `client/.env.example` — API base URL, Socket.IO URL
- `python-monitoring/.env.example` — port, allowed caller origin, (later) model path

Never commit `.env` files — `.gitignore` already excludes them.

## 7. Running All Three Together

Open three terminals:
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# Terminal 3
cd python-monitoring && source venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

## 8. API Overview (Phase 1–9)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | — | Node server + DB connection status |
| `/health` (Python, port 8000) | GET | — | AI monitoring service liveness |
| `/api/auth/register` | POST | — | Create account (student or teacher) |
| `/api/auth/login` | POST | — | Login, returns JWT + user |
| `/api/auth/forgot-password` | POST | — | Generates reset token (see dev note below) |
| `/api/auth/reset-password/:token` | POST | — | Sets new password |
| `/api/users/me` | GET | JWT | Get own profile |
| `/api/users/me` | PUT | JWT | Update own profile fields |
| `/api/users/me/avatar` | PUT | JWT | Upload profile photo (multipart, field name `avatar`) |
| `/api/dashboard/student` | GET | JWT + student role | Student dashboard stats |
| `/api/dashboard/teacher` | GET | JWT + teacher role | Teacher dashboard stats |
| `/api/classes` | POST | JWT + teacher role | Create a class (auto-generates class code) |
| `/api/classes/mine` | GET | JWT | Role-aware: teacher's created classes / student's joined classes |
| `/api/classes/join` | POST | JWT + student role | Join a class by code |
| `/api/classes/:classId/leave` | DELETE | JWT + student role | Leave a joined class |
| `/api/classes/:classId` | DELETE | JWT + teacher role | Soft-delete own class |
| `/api/classes/:classId` | GET | JWT (owner or member) | Class detail |
| `/api/classes/:classId/students` | GET | JWT + teacher role (own class) | Enrolled student roster |
| `/api/posts/class/:classId` | GET | JWT (owner or member) | List posts, supports `?search=` |
| `/api/posts/class/:classId` | POST | JWT + teacher role (own class) | Create a post |
| `/api/posts/:postId` | PUT | JWT (own post) | Edit a post |
| `/api/posts/:postId` | DELETE | JWT (own post) | Delete a post (+ its comments) |
| `/api/comments/post/:postId` | GET | JWT (owner or member) | List comments on a post |
| `/api/comments/post/:postId` | POST | JWT (owner or member) | Add a comment |
| `/api/comments/:commentId` | DELETE | JWT (own comment, or class-owning teacher) | Delete a comment |
| `/api/notes/class/:classId` | GET | JWT (owner or member) | List notes |
| `/api/notes/class/:classId` | POST | JWT + teacher role (own class) | Upload a note (multipart, field `file`) |
| `/api/notes/:noteId` | DELETE | JWT + teacher role (own class) | Delete a note |
| `/api/notes/:noteId/download` | GET | JWT (owner or member) | Download the file |
| `/api/assignments/class/:classId` | POST | JWT + teacher role (own class) | Create an MCQ assignment with questions |
| `/api/assignments/class/:classId` | GET | JWT (owner or member) | List assignments (students see their own submission status) |
| `/api/assignments/:assignmentId` | GET | JWT (owner or member) | Assignment detail (correct answers stripped for students) |
| `/api/assignments/:assignmentId` | PUT | JWT (own assignment) | Edit metadata / replace questions (resets submissions if questions change) |
| `/api/assignments/:assignmentId` | DELETE | JWT (own assignment) | Delete (cascades questions + submissions) |
| `/api/submissions/:assignmentId/submit` | POST | JWT + student role | Submit answers — graded entirely server-side |
| `/api/submissions/:assignmentId/mine` | GET | JWT + student role | Own result with per-question review |
| `/api/submissions/:assignmentId/all` | GET | JWT + teacher role (own assignment) | All students' results + class average |
| `/api/attendance/class/:classId/mark` | POST | JWT + teacher role (own class) | Bulk-mark attendance for a date (upserts) |
| `/api/attendance/class/:classId` | GET | JWT + teacher role (own class) | Per-student summary table |
| `/api/attendance/class/:classId/date/:date` | GET | JWT + teacher role (own class) | Existing marks for one date (edit prefill) |
| `/api/attendance/class/:classId/mine` | GET | JWT + student role (member) | Own summary + session history |
| `/api/academic-records/class/:classId` | GET | JWT + teacher role (own class) | All students' records (auto-provisioned) |
| `/api/academic-records/:recordId` | PUT | JWT (own class's record) | Update marks (overall recomputed server-side) |
| `/api/academic-records/class/:classId/mine` | GET | JWT + student role (member) | Own record + live attendance + assignment average |
| `/api/live-classes/class/:classId/start` | POST | JWT + teacher role (own class) | Start a live session (broadcasts `live:class-started`) |
| `/api/live-classes/:liveClassId/end` | POST | JWT (own class's session) | End a live session (broadcasts `live:class-ended`, kicks the room) |
| `/api/live-classes/:liveClassId` | GET | JWT (owner or member) | Session detail |
| `/api/live-classes/class/:classId/active` | GET | JWT (owner or member) | Currently active session for a class, or `null` |
| `/api/monitoring/analyze-frame` | POST | JWT + student role | Analyzes one captured frame (proxies to Python, applies temporal smoothing) |

### Socket.IO events (Phase 8)

| Event | Direction | Purpose |
|---|---|---|
| `class:join` / `class:leave` | client → server | Join/leave `class:<classId>` room to receive live-class start/end notifications |
| `live:join` | client → server | Join a live session's WebRTC room; server replies via callback with the current participant list |
| `live:user-joined` / `live:user-left` | server → client | Presence updates for the live room |
| `live:offer` / `live:answer` / `live:ice-candidate` | both directions | WebRTC signaling, relayed to a specific `targetSocketId` — payload never inspected or stored |
| `live:toggle-media` / `live:media-state` | client → server / server → client | Mic/camera on-off state, broadcast so peers can show a muted/camera-off indicator |
| `live:class-started` / `live:class-ended` | server → client | Triggered by the REST start/end endpoints, broadcast to the `class:<classId>` room |
| `live:monitoring-status` | server → client (teacher only) | Broadcast to `user:<teacherId>` whenever a student's frame is analyzed |

**Dev note on password reset:** no email provider is configured yet (per
the project brief, this is acceptable for local/academic development). The
reset token is returned directly in the `forgot-password` API response
(`data.devResetToken`) and shown on the Forgot Password page with a direct
link to the reset page. Swap this for real email delivery before any
production use.

Remaining API surface (classes, posts, assignments, attendance, live
classes, monitoring, notifications) is added incrementally — see the
architecture document for the complete planned route list.

## 9. Development Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Project scaffolding — all 3 services boot and connect | ✅ Done |
| 2 | Authentication (register/login/JWT/roles) | ✅ Done |
| 3 | Student & Teacher dashboards | ✅ Done |
| 4 | Class creation & joining | ✅ Done |
| 5 | Classroom posts, comments and notes | ✅ Done |
| 6 | MCQ assignment system | ✅ Done |
| 7 | Attendance and academic records | ✅ Done |
| 8 | Live classroom using WebRTC | ✅ Done |
| 9 | Python AI monitoring | ✅ Done |
| 10 | Monitoring reports & analytics | Next |
| 11 | Testing, security review, polish | Pending |

## 10. Testing

### Phase 1 (re-verified)
- `npm run build` in `client/` completes with 0 errors.
- `server.js` correctly fails fast with a clear error if MongoDB is
  unreachable (verified against `ECONNREFUSED`), rather than hanging silently.
- `/api/health` returns `200` with correct DB status field.
- CORS headers correctly allow the configured `CLIENT_URL` origin.
- FastAPI service boots, `/health` and `/docs` respond correctly.

### Phase 2 — verified directly (no DB required)
- bcrypt hash + compare: correct password matches, wrong password rejected.
- JWT: token generated and correctly decoded; garbage tokens correctly rejected (`JsonWebTokenError`).
- Validation middleware: missing fields, password mismatch, invalid role, and invalid email all return clear 400s with specific messages; valid payloads pass through.
- `authMiddleware`: requests with no token or an invalid token are correctly rejected with 401, before ever touching the database.
- `server.js` boots with all Phase 2 routes registered, with no import/require errors.

### Phase 2 — please verify yourself once MongoDB is running
Start MongoDB, then `cd server && npm run dev`. Run these in order:

```bash
# 1. Register a student
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ketan Dhanvijay","email":"ketan@example.com","password":"password123","confirmPassword":"password123","role":"student"}'

# 2. Try registering the same email again -> should return 400 "already exists"
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ketan Dhanvijay","email":"ketan@example.com","password":"password123","confirmPassword":"password123","role":"student"}'

# 3. Login -> copy the "token" from the response
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ketan@example.com","password":"password123"}'

# 4. Access protected profile route with the token
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <paste token here>"

# 5. Access it WITHOUT a token -> should be 401
curl http://localhost:5000/api/users/me

# 6. Forgot password -> copy devResetToken from the response
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ketan@example.com"}'

# 7. Reset password with that token
curl -X POST http://localhost:5000/api/auth/reset-password/<paste devResetToken here> \
  -H "Content-Type: application/json" \
  -d '{"password":"newPassword123"}'

# 8. Log in again with the NEW password to confirm the reset worked
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ketan@example.com","password":"newPassword123"}'
```

Also test in the browser: `npm run dev` in `client/`, register a student and a teacher account, log in as each, confirm you land on the correct dashboard (`/student/dashboard` vs `/teacher/dashboard`), refresh the page and confirm you're still logged in, then log out.

### Phase 3 — verified directly (no DB required)
- `/api/dashboard/student` and `/api/dashboard/teacher` correctly return 401 with no token and with an invalid token, before ever reaching the controller.
- Role middleware (`authorize`) correctly blocks a student from hitting `/api/dashboard/teacher` and vice versa (403), reusing the same check verified in Phase 2.
- `npm run build` in `client/` completes with 0 errors with all Phase 3 pages included.

### Phase 3 — please verify yourself once MongoDB is running
1. `cd server && npm run dev`, `cd client && npm run dev`.
2. Log in as a student → you should land on `/student/dashboard` and see: your name in "Welcome, ...", all stat cards showing `0` or "No data yet" (not fake numbers), an empty "Recent Announcements" state, and a "No classes joined yet." empty state with a "+ Join Class" button.
3. Click **Profile** in the sidebar → confirm your registered details show up, edit your name/phone/department and Save, confirm the navbar avatar initials/name update immediately without a refresh.
4. Click **Change Photo**, upload an image → confirm it appears in both the profile page and navbar.
5. Click through the other sidebar links (Classes, Assignments, Attendance, etc.) → confirm each shows a clearly labeled "built in Phase X" placeholder instead of a blank page or crash.
6. Repeat steps 2–5 logged in as a teacher, confirming the teacher-specific stat cards, sidebar items (My Classes, Students, Live Classes, Monitoring Reports), and "+ Create Class" empty state.
7. Confirm a student cannot navigate to `/teacher/dashboard` (and vice versa) by typing the URL directly — should redirect to their own dashboard.

### Phase 4 — verified directly (no DB required)
- Every `/api/classes/*` route correctly returns 401 with no auth token, before reaching the controller.
- `generateClassCode('mc0004', 'a')` → `MC0004_A`, confirmed uppercase-normalized and correctly formatted.
- Collision handling verified with a mocked DB: when `MC0004_A` is already taken, the service correctly retries and returns `MC0004_A2`.
- `npm run build` in `client/` completes with 0 errors with all Phase 4 pages included.

### Phase 4 — please verify yourself once MongoDB is running
1. Log in as a teacher → **My Classes** → **+ Create Class** → fill in Subject Title "Java Programming", Subject Code "MC0004", Section "A" → confirm the new card shows `MC0004`, "Section: A", "Java Programming", and a class code of `MC0004_A`.
2. Click **Open Class** on that card → confirm the detail page shows the same info and an empty "No students have joined this class yet." state.
3. Log in as a student (different account) → **Classes** → **+ Join Class** → enter `MC0004_A` → confirm it joins and the card appears with an "Open Class" / "Leave" pair.
4. Try joining the same code again → should show "You have already joined this class."
5. Try joining a made-up code like `FAKE_CODE` → should show "Invalid class code."
6. Go back to the teacher's dashboard → confirm **My Classes: 1** and **Total Students: 1** now show real counts (not zero).
7. Open the class again as the teacher → confirm the joined student now appears in the roster with their name, email, and avatar/initials.
8. As the student, click **Leave** on the class → confirm it disappears from their list and the teacher's student count drops back to 0.
9. As the teacher, click **Delete** on the class (confirm the browser dialog) → confirm it disappears from **My Classes**, and confirm a student can no longer join using that same class code.

### Phase 5 — verified directly (no DB required)
- Every `/api/posts/*`, `/api/comments/*`, and `/api/notes/*` route (including the newly-added `GET /api/comments/post/:postId`) correctly returns 401 with no auth token.
- `npm run build` in `client/` completes with 0 errors with all Phase 5 pages/components included.

### Phase 5 — please verify yourself once MongoDB is running
1. As a teacher, open a class → **Post** tab → write something in "Share something..." → **Post** → confirm it appears immediately with your name, avatar initials, and timestamp.
2. As the enrolled student, open the same class → confirm the post is visible, click the comment count to expand → add a comment → confirm it appears with your name and "just now".
3. As the teacher, expand the same post's comments → confirm you can delete the student's comment (moderation) even though you didn't write it.
4. As the student, try to delete the teacher's post or another student's comment via the UI — the buttons shouldn't even appear, since only the author (or, for comments, the class teacher) sees a Delete option.
5. As the teacher, edit your own post's text and save → confirm the content updates in place.
6. Type a keyword from one of your posts into the **Search posts...** box → confirm only matching posts remain, and clearing the box brings all posts back.
7. Switch to the **Notes** tab as the teacher → **+ Upload Note** → pick a PDF or image, give it a title → confirm it appears in the list with the correct file type/size.
8. As the student, open **Notes** → click the download icon on that note → confirm the file downloads with its original filename.
9. Try uploading a `.zip` or `.exe` file as a note → should be rejected with "File type ... is not supported" rather than silently accepted.
10. As the teacher, delete the note → confirm it disappears from both the teacher's and student's Notes tab.
11. Check both dashboards again → confirm **Recent Announcements** (student) / **Recent Activity** (teacher) now show your real post(s) instead of the earlier empty state.

### Phase 6 — verified directly (no DB required)
- Every `/api/assignments/*` and `/api/submissions/*` route correctly returns 401 with no auth token.
- The auto-grading algorithm was unit-tested in isolation with fixed fake data (no DB):
  - The project brief's exact example — 20 questions, 1 mark each, 16 correct — produced exactly `correctCount: 16, incorrectCount: 3, unansweredCount: 1, score: 16, totalMarks: 20, percentage: 80`.
  - A weighted-marks case (questions worth 2, 3, and 5 marks) computed the correct score (7/10, 70%).
  - Malformed/malicious input — a nonexistent `questionId`, an invalid option letter, and a missing `selectedOption` — was all correctly treated as "unanswered" rather than crashing or being miscounted.
- `npm run build` in `client/` completes with 0 errors (one advisory chunk-size warning, not an error).

### Phase 6 — please verify yourself once MongoDB is running
1. As a teacher, open a class → **Assignment** tab → **+ Create Assignment** → fill in a title, duration, start/end dates → add 2–3 questions with all four options and pick a correct answer for each → confirm "Total Marks" updates live as you change question marks → **Create Assignment**.
2. Confirm the new assignment appears in the list with the right question count, total marks, and an **Open** status badge (or **Upcoming** if the start date is in the future).
3. As the enrolled student, open the same class's Assignment tab → click **Start** → confirm you see a live countdown timer, one question at a time is not required (all shown at once is fine) but selecting an option highlights it.
4. Submit before the timer runs out → confirm you land on a result screen showing score, percentage, and a correct/incorrect/unanswered breakdown, with each question's correct answer marked ✓ and your wrong picks marked in red.
5. Try opening the same assignment again as that student → confirm it goes straight to "View Result" / the same result screen rather than letting you retake it, and that the class list badge now shows **Submitted**.
6. As the teacher, click **Results** on that assignment → confirm the results table shows the student's score, and the bar chart renders their percentage.
7. Set the assignment's end date in the past (edit it) and confirm a student who hasn't submitted sees an **Expired** status and cannot start it.
8. Create a second assignment with **Allow retake** checked, submit as a student, then submit again with different answers → confirm the second submission replaces the first (one row, not two) and the score reflects the new answers.
9. Check both dashboards → confirm **Upcoming Assignments** / **Avg. Assignment Score** (student) and **Pending Assignments** (teacher) now reflect real numbers.
10. Confirm the sidebar **Assignments** link (both roles) shows an aggregated list across all your classes, not just one.

### Phase 7 — verified directly (no DB required)
- Every `/api/attendance/*` and `/api/academic-records/*` route correctly returns 401 with no auth token.
- The attendance-percentage math was unit-tested against the project brief's exact example (§18: 40 classes, 34 present) and produced exactly `totalClasses: 40, present: 34, absent: 6, percentage: 85`.
- Confirmed a class/student with zero attendance sessions returns `percentage: null` rather than a misleading `0%`.
- The overall-marks derivation (sum of the six manually-entered fields) was unit-tested and matched by hand.
- `npm run build` in `client/` completes with 0 errors.

### Phase 7 — please verify yourself once MongoDB is running
1. As a teacher, open **Attendance** in the sidebar → pick a class → **Mark Attendance** → pick today's date → mark a few students Present and a few Absent → **Save Attendance**.
2. Confirm the summary table now shows real Total Classes / Present / Absent / Attendance % for each student (not zeros for everyone).
3. Open **Mark Attendance** again for the *same* date and change a student from Present to Absent → save → confirm the summary updates (it corrects the existing record rather than adding a duplicate day).
4. As that student, open **Attendance** in the sidebar → confirm you see your own real numbers, the pie chart, and a session history table with the date and status you were just marked.
5. As the teacher, open **Academic Records** → pick the same class → confirm every enrolled student has a row (auto-created, all zeros) even though you never explicitly created records.
6. Click **Edit** on a student's row → enter some marks across the fields → confirm "Overall Marks" updates live as you type → **Save** → confirm the table row reflects the new values, including the real attendance % already shown in that row.
7. As the student, open **Academic Records** → confirm you see your own marks, overall total, real attendance %, real average assignment score, and a bar chart of the marks breakdown.
8. Check both dashboards → confirm **Attendance** (student) / **Avg. Class Attendance** (teacher) now show real percentages instead of "No data yet", and that a class with zero sessions taken doesn't drag the average down.

### Phase 8 — verified directly
- Every `/api/live-classes/*` route correctly rejects requests with no token and with an invalid token.
- Socket.IO connection-level auth: verified with a real `socket.io-client` test harness that connections with no token and with a garbage token are both rejected with the correct error message, and that the server itself never crashes on a bad connection attempt.
- The `io.liveRooms` presence-tracking logic (who's in a live room, and what participant list a new joiner receives) was unit-tested in isolation: a teacher joining first correctly sees an empty list; a student joining second correctly sees the teacher already present; after everyone leaves, the room is fully cleaned up (no memory leak). This is the logic that guarantees "new joiner calls existing participants" produces exactly one offer per pair.
- `npm run build` in `client/` completes with 0 errors.

### Phase 8 — ⚠️ please verify yourself — this is the most important checklist in the project so far
I could not test any real camera/microphone capture or actual peer-to-peer video negotiation in this sandbox (no browser, no media devices, no way to run two simultaneous tabs). Please run through this with two different browser windows (or two different browsers, or a browser + phone) logged in as a teacher and a student in the same class:

1. As the teacher, open a class → **Live Class** tab → **Start Live Class** → confirm the browser asks for camera/microphone permission, and once granted, you see your own video tile.
2. As the student (second window), open the same class → **Live Class** tab → confirm it now shows **"A live class is in progress"** with a **Join Live Class** button (this should update within a second or two of the teacher starting, without needing to refresh — that's the `live:class-started` socket broadcast).
3. Click **Join Live Class** as the student → grant camera/mic permission → confirm both the teacher's window and the student's window now show **both** video tiles with live video.
4. Test mic mute on one side → confirm the other side's tile shows a muted icon.
5. Test camera off on one side → confirm the other side's tile switches to an avatar-initials placeholder instead of a frozen/black video.
6. Test **Share Screen** on the teacher's side → confirm the student's window shows the shared screen instead of the webcam feed, and that toggling it back off restores the webcam.
7. Open a third window as a second student and join → confirm all three participants can see and hear each other (full mesh, not just teacher-to-student).
8. As the teacher, click **End Class** → confirm every participant is immediately kicked back to the classroom page with a clear "the teacher has ended this live class" message, not a frozen screen.
9. Try starting a second live class for the same class while one is already active (e.g. two rapid clicks, or two teacher tabs) → confirm the second attempt is rejected with "A live class is already in progress for this class."
10. As a student **not** enrolled in the class, try navigating directly to a live class URL you copy from an enrolled student → confirm you're rejected rather than able to join.

Please let me know what breaks — WebRTC across different browsers/networks (especially with strict NATs/firewalls) sometimes needs a TURN server in addition to the public STUN server this uses by default, and that's the most likely real-world gap if peer connections fail to establish outside a simple local network.

### Phase 9 — verified directly (this phase had real, working infrastructure to test against)
- Started the actual FastAPI service with real MediaPipe loaded and ran genuine inference:
  - A real public-domain photo containing a face correctly returned `face_detected: true` with a plausible head-pose estimate.
  - Blank and random-noise images correctly returned `face_detected: false` — not a hardcoded default, the model genuinely found nothing.
  - Phone detection correctly reported `phone_detection_available: false` with a clear explanatory reason (ultralytics not installed) rather than silently defaulting to "no phone detected."
- Ran a real Node → Python integration test: `monitoringClient.js` calling the live FastAPI service with the same test images, confirming the HTTP layer, JSON shapes, and error handling all work correctly together.
- Unit-tested the temporal smoothing logic (`attentionService.js`) against the real Python outputs: a single "looking away" frame stays `ATTENTIVE` (forgiving of a momentary glance), but sustained looking-away or sustained missing-face across consecutive frames correctly escalates to `NOT_ATTENTIVE`, matching §25's "sustained duration" requirement.
- Confirmed `/api/monitoring/analyze-frame` rejects unauthenticated requests.
- `npm run build` in `client/` completes with 0 errors.

### Phase 9 — please verify yourself
1. **Install and test YOLO yourself** (see `python-monitoring/README.md`) — this is the one piece I could not run at all. Confirm `phone_detection_available` flips to `true` once installed, and that holding a real phone in frame actually flags `phone_detected: true`.
2. With both the Node server and Python service running, join a live class as a student (per the Phase 8 checklist) → confirm you see a monitoring badge on your own video tile that updates every ~5 seconds (Attentive / Not Attentive / Checking...).
3. Deliberately turn your head far to the side and hold it there for ~10+ seconds → confirm your own badge switches to "Not Attentive" after a couple of update cycles, not instantly on the first glance away.
4. Cover your camera or step out of frame for ~10 seconds → confirm the badge shows "Face not detected" and eventually "Not Attentive."
5. As the teacher (second window), confirm the **Monitoring Status** panel in the live class sidebar shows the student's name and updates in real time as their status changes — you shouldn't need to refresh.
6. Stop the Python service (`Ctrl+C` on uvicorn) while a student is in a live class → confirm the student's overlay shows "AI monitoring is temporarily unavailable" rather than a stale or fake "Attentive" status, and that the rest of the call (video/audio) keeps working normally.
7. Confirm a teacher's own video tile never shows a monitoring overlay — only students are monitored.

## 11. Future Enhancements

Timetable module, email notifications, certificates, parent dashboard,
advanced analytics, plagiarism detection, LMS integrations, mobile app —
intentionally out of scope until the core system (Phases 2–11) is complete.
