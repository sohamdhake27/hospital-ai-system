# AI Hospital Patient Tracking System

Full-stack hospital operations project with:

- patient management
- bed allocation
- billing and invoice generation
- AI risk prediction
- realtime dashboard updates

## Localhost Setup

This project now defaults to localhost for offline use.

### 1. Start MongoDB

Make sure MongoDB is running locally at:

`mongodb://127.0.0.1:27017/hospitalDB`

If you want a different database URL, create `Backend/.env` from `Backend/.env.example`.

### 2. Start the backend

```bash
cd Backend
npm install
npm run dev
```

Backend runs on:

`http://localhost:5000`

On first startup it will automatically:

- seed beds
- create a demo user if it does not exist

Demo login:

- Email: `test123@gmail.com`
- Password: `123456`

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

`http://localhost:5173`

The Vite dev server proxies `/api` and `/socket.io` to the local backend.

### 4. Optional AI microservice

Patient creation already has a fallback risk calculation, so the app works even if the Python AI service is not running.

If you want the ML model running locally:

```bash
cd ai-model
pip install -r requirements.txt
python app.py
```

AI service runs on:

`http://localhost:5001`

## Environment Files

Examples are included here:

- `Backend/.env.example`
- `frontend/.env.example`

## Notes

- Frontend API default: `/api`
- Frontend socket default: `http://localhost:5000`
- Backend MongoDB default: `mongodb://127.0.0.1:27017/hospitalDB`
- Backend JWT secret has a local development fallback
