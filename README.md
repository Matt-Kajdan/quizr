<div align="center">
  <h1>
    <img src="./frontend/src/assets/quizr.png" alt="Quizr logo" width="44" style="vertical-align: middle; margin-right: 10px;" />
    <span style="vertical-align: middle;">Quizr</span>
  </h1>
</div>

Quizr is a full-stack quiz platform built with React, Vite, Express, MongoDB, and Firebase Authentication. Users can create quizzes, take quizzes, favourite them, manage profiles, add friends, and view leaderboard data.

## Features

- Email/password authentication
- Username-based profiles
- Quiz creation, editing, deletion, and submission
- Quiz categories and difficulty levels
- Single-answer and multi-answer quizzes
- Quiz favourites
- Per-quiz leaderboards
- Global leaderboard
- Friend requests and friends list
- Theme preference persistence
- Account deletion flow with quiz preservation or full removal

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Auth and storage: Firebase
- Testing: Vitest, Jest, Supertest

## Project Structure

```text
.
├── api/        # Express API
├── frontend/   # React application
├── README.md
└── DOCUMENTATION.md
```

## Requirements

- Node.js
- npm
- MongoDB database
- Firebase project

## Environment Variables

### Backend

Create `api/.env`:

```env
PORT=3000
MONGODB_URL=mongodb://127.0.0.1:27017/quizr
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account"}
```

Notes:

- `MONGODB_URI` is also supported instead of `MONGODB_URL`.
- The backend can also read a Firebase service account from `api/secrets/firebase-service-account.json`.

### Frontend

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_FB_API_KEY=your_firebase_api_key
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_STORAGE_BUCKET=your-project.appspot.com
VITE_FB_APP_ID=your_firebase_app_id
```

## Installation

Install dependencies per app:

```bash
cd api
npm install
```

```bash
cd frontend
npm install
```

Do not run `npm install` from the repository root. The root `package.json` is intentionally a guard file.

## Usage

Start the backend:

```bash
cd api
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

The frontend uses `VITE_BACKEND_URL` and automatically targets `/api`.

## Available Scripts

### Backend

```bash
npm start
npm run dev
npm test
npm run seed
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm test
```

## API Notes

- Health check: `GET /health` or `GET /api/health`
- Protected routes require a Firebase ID token in `Authorization: Bearer <token>`
- In production, the backend serves the built frontend from `frontend/dist`

## Tests

Backend tests:

```bash
cd api
npm test
```

Frontend tests:

```bash
cd frontend
npm test
```
