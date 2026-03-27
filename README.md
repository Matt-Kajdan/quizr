<h1 align="center">
  <img src="./frontend/shared/assets/quizr.png" alt="Quizr logo" width="44" valign="middle" /> Quizr
</h1>

Quizr is a full-stack quiz platform built with React, Vite, Express, MongoDB, and Firebase Authentication.

## Structure

```text
.
├── backend/
│   ├── app/
│   ├── features/
│   ├── lib/
│   └── tests/
├── frontend/
│   ├── app/
│   ├── features/
│   ├── shared/
│   └── tests/
└── README.md
```

Folder rules:
- `backend/app`: Express assembly and startup
- `backend/features`: domain modules such as users, quizzes, and friends
- `backend/lib`: backend infrastructure and shared support code
- `backend/tests`: Jest coverage for backend behavior
- `frontend/app`: router, app shell, and provider composition
- `frontend/features`: product areas and route-level UI
- `frontend/shared`: reusable client utilities, auth, state, hooks, and UI
- `frontend/tests`: Vitest coverage for current client behavior

## Requirements

- Node.js
- npm
- MongoDB
- Firebase project credentials

## Environment

Create `backend/.env`:

```env
PORT=3000
MONGODB_URL=mongodb://127.0.0.1:27017/quizr
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account"}
```

The backend also supports a local file at `backend/secrets/firebase-service-account.json`.

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_FB_API_KEY=your_firebase_api_key
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_STORAGE_BUCKET=your-project.appspot.com
VITE_FB_APP_ID=your_firebase_app_id
```

## Install

Install from the repository root:

```bash
npm install
```

## Scripts

Run from the repository root unless you are working inside one app on purpose.

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
npm test
npm run test:backend
npm run test:frontend
npm run build
npm run lint
npm run seed
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Testing

- Frontend tests run with Vitest from `frontend/tests`
- Backend tests run with Jest from `backend/tests`
- Backend tests start a temporary local `mongod` process and only allow local Mongo connections while `NODE_ENV=test`

Note: if your environment blocks local process socket binding, backend tests may require elevated execution permissions.

## API Notes

- Health check: `GET /health` or `GET /api/health`
- Protected routes require `Authorization: Bearer <firebase-id-token>`
- In production, the backend serves `frontend/dist`
