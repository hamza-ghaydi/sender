# Email Sender App

Full-stack email sender with Node.js + Express + SQLite backend and React (Vite + TS) frontend.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Quick Start

1. **Install Backend Dependencies:**
```bash
cd backend
npm install
```

2. **Install Frontend Dependencies:**
```bash
cd frontend
npm install
```

3. **Start the Backend Server:**
```bash
cd backend
npm start
```
The backend will run on http://localhost:5000

4. **Start the Frontend Server (in a new terminal):**
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:5173

## Alternative: Development Mode

For development with auto-restart on file changes:

**Backend (with nodemon):**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Frontend Overview

Pages in `frontend`:
- Email List: upload CSV or paste list, view statuses
- SMTP Profiles: manage multiple local profiles; click "Set Active on Backend" to save selected profile to server. Backend uses the latest saved profile when sending.
- Settings: set delay (ms) and max emails per day
- Send: compose subject/HTML, start/stop, view progress

API base URL is `http://localhost:5000/api`. If needed, edit `frontend/src/api.ts`.

## Features

- Sequential email sending with configurable delays
- Daily limit enforcement to prevent spam flagging
- Real-time progress tracking
- Email validation and duplicate filtering
- CSV upload support
- Modern React dashboard

⚠️ Use responsibly and comply with email marketing regulations.
