# Email Sender App

Full-stack email sender with Node.js + Express + SQLite backend and React + Tailwind frontend.

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
npm start
```
The frontend will run on http://localhost:3000

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
npm start
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Usage

1. **SMTP Config**: Configure email provider (Gmail: smtp.gmail.com:587)
2. **Settings**: Set delay (1000-5000ms) and daily limits (50-200)  
3. **Upload Emails**: Add emails via text or CSV
4. **Dashboard**: Start sending and monitor progress

## Features

- Sequential email sending with configurable delays
- Daily limit enforcement to prevent spam flagging
- Real-time progress tracking
- Email validation and duplicate filtering
- CSV upload support
- Modern React dashboard

⚠️ Use responsibly and comply with email marketing regulations.
