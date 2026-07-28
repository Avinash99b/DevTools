# Deployment Guide

DevTools now supports a Node.js backend to power server-side features like video conversion, file proxying, and AI tools.

## Standalone Deployment (No Docker)

1. **Frontend:**
   ```sh
   cd frontend/web
   npm install
   npm run build
   # Serve the `dist` folder with your preferred web server (Nginx, Caddy, etc.)
   ```

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

## Docker Compose Deployment

We provide a `docker-compose.yml` to run the frontend (Nginx) and backend (Node) together.

1. Ensure Docker and Docker Compose are installed.
2. In the root directory, create a `.env` file:
   ```env
   ACCESS_SECRET=your_secure_password_here
   CORS_ORIGIN=http://localhost:5173
   ```
3. Build and start the containers:
   ```sh
   docker-compose up -d --build
   ```

The frontend will be available on port `5173` and the backend on port `3000`. You can put these behind an Nginx reverse proxy to handle TLS termination in production.
