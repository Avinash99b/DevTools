# Deployment Guide

DevTools uses a Node.js backend (Express + SQLite) for server-side features such as
video conversion, file proxying and AI tools, and a static React frontend.

## Standalone Deployment (No Docker)

1. **Frontend:**

   Configure the backend URL before building. The frontend reads `VITE_BACKEND_URL`
   at build time, so it must be set for production (otherwise it defaults to
   `http://localhost:3000`, which is wrong for remote users):

   ```sh
   cd frontend/web
   cp .env.example .env        # edit VITE_BACKEND_URL, e.g. https://api.example.com
   npm install
   npm run build
   # Serve the `dist` folder with your preferred web server (Nginx, Caddy, etc.)
   ```

   The app uses hash routing (`createHashRouter`), so a plain static server works.
   If you later switch to browser (history) routing, configure an SPA fallback that
   serves `index.html` for unknown paths.

2. **Backend:**

   ```sh
   cd backend
   npm install
   npm run build
   ```

   Create a `.env` file in the `backend` folder based on `.env.example`.
   Start the backend:

   ```sh
   node dist/server.js
   ```

   Run the backend smoke/security tests with:

   ```sh
   npm test
   ```

## Docker Compose Deployment

We provide a `docker-compose.yml` to run the frontend (Nginx) and backend (Node) together.

1. Ensure Docker and Docker Compose are installed.
2. In the root directory, create a `.env` file:
   ```env
   ACCESS_SECRET=your_secure_password_here
   CORS_ORIGIN=http://localhost:5173
   ```
3. If the frontend and backend are served from different origins, pass the backend
   URL into the frontend build (`VITE_BACKEND_URL`). When they are served behind a
   single reverse proxy on the same origin, point `VITE_BACKEND_URL` at that origin.
4. Build and start the containers:
   ```sh
   docker-compose up -d --build
   ```

The frontend will be available on port `5173` and the backend on port `3000`. You can put these behind an Nginx reverse proxy to handle TLS termination in production.

## Security Notes

* Set a strong `ACCESS_SECRET`. Sessions are validated server-side and expire after
  `SESSION_TTL_MS` (default 24h); logout invalidates the session immediately.
* Login is rate limited per IP (`LOGIN_MAX_ATTEMPTS` per `LOGIN_WINDOW_MS`).
* Server-side proxying validates destination IPs against private/loopback/link-local
  ranges (IPv4 and IPv6) and revalidates on every redirect. Keep this in mind when
  running behind proxies that rewrite hostnames.
* Uploads are limited to `PERSISTENT_FILE_SIZE_MAX` bytes and to known media types.
* Set `CORS_ORIGIN` to your real frontend origin; avoid `*` with `credentials: true`.