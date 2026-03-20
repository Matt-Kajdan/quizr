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

What the backend needs:

- `PORT`
  - Optional.
  - Local API port. Defaults to `3000` if omitted.
- `MONGODB_URL`
  - Required unless you use `MONGODB_URI` instead.
  - This is the MongoDB connection string used by Mongoose.
  - For local MongoDB, a typical value is `mongodb://127.0.0.1:27017/quizr`.
  - For MongoDB Atlas, get it from your cluster in Atlas:
    Connect -> Drivers -> copy the connection string, then replace username, password, and database name.
- `FIREBASE_SERVICE_ACCOUNT_JSON`
  - Required for Firebase Admin features such as verifying auth tokens and creating Firebase users in the seed script.
  - In the Firebase console, open:
    Project settings -> Service accounts -> Generate new private key
  - Download the JSON key, then either:
    - paste the JSON as a single-line string into `FIREBASE_SERVICE_ACCOUNT_JSON`, or
    - save the file as `api/secrets/firebase-service-account.json`

Backend notes:

- `MONGODB_URI` is also supported instead of `MONGODB_URL`.
- If `FIREBASE_SERVICE_ACCOUNT_JSON` is not set, the backend will also try `api/secrets/firebase-service-account.json`.
- The app may still start without Firebase Admin credentials in some environments with default Google credentials configured, but local development should not rely on that.

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

What the frontend needs:

- `VITE_BACKEND_URL`
  - Required.
  - Base URL for the Express API.
  - For local development, use `http://localhost:3000`.
  - The frontend app appends `/api` automatically.
- `VITE_FB_API_KEY`
- `VITE_FB_AUTH_DOMAIN`
- `VITE_FB_PROJECT_ID`
- `VITE_FB_STORAGE_BUCKET`
- `VITE_FB_APP_ID`
  - Required.
  - These are the Firebase Web App config values used by the client-side Firebase SDK.
  - In the Firebase console, open:
    Project settings -> General -> Your apps
  - Create a Web app if you do not already have one, then copy the config values from the SDK setup snippet.

Recommended setup:

1. Create one Firebase project for this app.
2. In Firebase Authentication, enable Email/Password sign-in.
3. In Project settings -> General, register a Web app and copy its config into `frontend/.env`.
4. In Project settings -> Service accounts, generate a private key for the backend and add it to `api/.env` or `api/secrets/firebase-service-account.json`.
5. Create a MongoDB database locally or in Atlas and put its connection string into `api/.env`.

Example backend service account file option:

```text
api/secrets/firebase-service-account.json
```

Example local file layout:

```text
api/.env
frontend/.env
api/secrets/firebase-service-account.json
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
