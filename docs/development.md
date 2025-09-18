# Development Guide

## Prerequisites
- Node.js 18+ and npm
- Local MongoDB
- Windows PowerShell or any compatible terminal

## Project Structure (backend summary)
```
backend/src/
├── main.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── ...
```

## Environment Variables

### Backend (`backend/.env`)
Recommended example:
```
JWT_SECRET=a-magic-secret-key
JWT_EXPIRES_IN=24h
MONGO_URI=mongodb://localhost:27017/classroom_assistant_example
PORT=3000
```

### Frontend (`frontend/.env`)
Recommended example:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```
Notes:
- `JWT_SECRET` must be the same used by the backend.
- `NEXT_PUBLIC_API_URL` must point to the backend.
- The frontend port (3001 by default) is set in `frontend/package.json` scripts (`next dev -p 3001`, `next start -p 3001`). You can override it temporarily with `npm run dev -- -p <port>`.

## Install Dependencies

In each package root:
```bash
cd backend
npm install

cd ../frontend
npm install
```

If you want to run backend tests:
```bash
cd backend/tests
npm install
npm test
```

## Database
- Default URL: `mongodb://localhost:27017/classroom_assistant`
- For example/demo environment you may also use: `mongodb://localhost:27017/classroom_assistant_example`
- Ensure MongoDB service is running before starting the backend.

## Run in Development

### Backend (NestJS)
**Recommended command:** `npm run start:dev`
```bash
cd backend
npm run start:dev
# Serves at http://localhost:3000
```

### Frontend (Next.js)
**Recommended command:** `npm run dev`
```bash
cd frontend
npm run dev -- -p 3001
# Serves at http://localhost:3001
```

## Demo Environment (DEMO)
- To generate and load demo data, go to `backend/scripts` and read `README.md`.
- Important notice: DEMO DATA IS ARTIFICIAL AND MAY HAVE INCOMPLETE RELATIONSHIPS; ERRORS CAN APPEAR THAT WOULD NOT OCCUR IN A CLEAN FROM-SCRATCH SETUP. IT IS INTENDED FOR DEMONSTRATION PURPOSES.
- For stable development, prefer starting with a clean database seeded from zero.

## Quick Checks
- Backend responds at `http://localhost:3000/health` (if a health endpoint exists).
- Frontend consumes API from `NEXT_PUBLIC_API_BASE`.
- Check CORS if accessing from different domains/ports.

## Useful Commands
Backend:
```bash
npm run start:dev     # hot reload development
npm run build         # build
npm run start:prod    # production
npm run format        # format
```
Frontend:
```bash
npm run dev           # development (use -p 3001 to set the port)
npm run build         # build
npm run start         # serve build
```

## Common Issues
- Authentication errors: check `JWT_SECRET` and that the frontend points to the correct backend URL.
- Data errors: if using DEMO, remember relationships may be incomplete.
- Mongo connection: ensure MongoDB is running and the URL is reachable.