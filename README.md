# TaskForce AI

TaskForce AI is a productivity planner that turns a plain-text task list into a prioritized daily schedule. Track task completion, review distractions in a daily debrief, see productivity trends, and earn points on a leaderboard.

## Features

- **AI-assisted task triage:** Paste a task list to generate task titles, categories, suggested start times, durations, and a schedule feasibility check. When `GEMINI_API_KEY` is not configured or Gemini is unavailable, the backend uses a local heuristic parser.
- **Daily task dashboard:** View and manage today's tasks, including status and schedule details.
- **Daily debrief:** Mark tasks completed or missed, record distractions, and review an efficiency score and most common distraction.
- **Analytics:** Review recent daily efficiency and distraction data.
- **Points and leaderboard:** Earn points for completing tasks (with an early-completion bonus) and compare total points on the leaderboard.
- **Accounts:** Register and log in; task and debrief data is associated with the authenticated user.

## Tech stack

- **Frontend:** React, Vite, React Router, Tailwind CSS, Chart.js
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT
- **AI integration:** Google Gemini API (optional)
- **Deployment:** Docker

## Requirements

- Node.js 20 or newer and npm
- MongoDB, running locally or available through a connection URI
- A Google Gemini API key is optional; without it, task triage uses the built-in fallback parser

## Run locally

1. Clone the repository and create the backend environment file:

   ```bash
   git clone https://github.com/Rituraj-Mishra01/taskforce-ai.git
   cd taskforce-ai
   cp .env.example backend/.env
   ```

2. Edit `backend/.env` and set `MONGODB_URI` and a strong, unique `JWT_SECRET`. To enable Gemini-powered triage, also add `GEMINI_API_KEY`.

   ```dotenv
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskforce-ai
   JWT_SECRET=replace_with_a_long_random_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

   `GEMINI_API_KEY` is optional. Do not commit `.env` files or real secrets.

3. Install dependencies:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Start the backend and frontend in separate terminals, from their respective directories:

   ```bash
   # Terminal 1 — from backend/
   npm run dev
   ```

   ```bash
   # Terminal 2 — from frontend/
   npm run dev
   ```

   Open the Vite URL shown in the frontend terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to the backend at `http://localhost:5000`.

## Docker

The Dockerfile builds the frontend and serves it from the Express backend. From the repository root:

```bash
docker build -t taskforce-ai .
docker run --rm -p 5000:5000 \
  -e MONGODB_URI='mongodb://host.docker.internal:27017/taskforce-ai' \
  -e JWT_SECRET='replace_with_a_long_random_secret' \
  -e GEMINI_API_KEY='your_gemini_api_key' \
  taskforce-ai
```

`GEMINI_API_KEY` is optional. Set `MONGODB_URI` to a MongoDB instance reachable from the container; connection addresses may differ depending on your Docker environment. The app will be available at `http://localhost:5000`.

## API overview

The API is served under `/api`. Routes marked **protected** require a bearer token obtained from registration or login.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account |
| `POST` | `/api/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/api/tasks` | Protected | Get today's tasks |
| `POST` | `/api/tasks/triage` | Protected | Parse and schedule a raw task list |
| `PUT` | `/api/tasks/:id` | Protected | Update a task |
| `DELETE` | `/api/tasks/:id` | Protected | Delete a task |
| `POST` | `/api/tasks/carryover` | Protected | Carry pending tasks into today |
| `POST` | `/api/logs/debrief` | Protected | Submit a daily debrief |
| `GET` | `/api/logs/analytics` | Protected | Get recent daily logs for analytics |
| `GET` | `/api/logs/latest-distraction` | Protected | Get the latest distraction summary |
| `GET` | `/api/logs/today` | Protected | Get today's daily log |
| `GET` | `/api/leaderboard` | Public | Get the top 10 users by points |

For protected routes, send the token as `Authorization: Bearer <token>`.

## Project structure

```text
.
├── backend/
│   ├── middleware/   # Authentication middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # Authentication, tasks, logs, leaderboard APIs
│   ├── server.js
│   └── seed.js       # Optional demo leaderboard data
├── frontend/
│   └── src/          # React app, pages, and components
├── .env.example
└── Dockerfile
```

## Useful commands

Run commands from the relevant directory:

| Directory | Command | Description |
| --- | --- | --- |
| `backend/` | `npm run dev` | Start the API with Nodemon |
| `backend/` | `npm start` | Start the API |
| `backend/` | `npm run seed` | Add or update sample leaderboard users |
| `frontend/` | `npm run dev` | Start the Vite development server |
| `frontend/` | `npm run build` | Build the frontend for production |
| `frontend/` | `npm run lint` | Run Oxlint |

The seed script creates demo users with the shared password `password123`; use it only with a development database.
