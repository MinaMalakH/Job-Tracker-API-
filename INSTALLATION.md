# Installation Guide

This document provides a step-by-step walkthrough for setting up the Job Tracker
API locally. It mirrors the "Getting Started" section of the main README but
can be shared independently.

## Prerequisites

- **Node.js** 18+ and **npm** (or Yarn)
- **MongoDB** (standalone or Atlas)
- **PostgreSQL** server
- **Redis** server (used by Bull queue)
- **Cloudinary** account (free tier is sufficient)
- **OpenAI / Groq** API key
- **Gmail account** (use an app password for security)

> Tip: Docker or docker-compose can be used to run MongoDB, Postgres, and Redis
> quickly if you don’t want to install them locally.

## Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/job-tracker-api.git
   cd job-tracker-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Open `.env` in a text editor and fill in values for each key
   - Keep secrets out of version control

4. **Start required services**
   - Start MongoDB: `mongod` (or use a managed Atlas instance)
   - Start PostgreSQL: `pg_ctl start` or your OS service manager
   - Start Redis: `redis-server` or Docker container

5. **Run the application**
   ```bash
   npm run dev    # development with ts-node and nodemon
   ```

# or

npm start # built/compiled version (after `npm run build`)

````

6. **Access the API**
- Base URL: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api-docs`

7. **Run tests (optional)**
```bash
npm test
````

## Additional notes

- Remember to set secure JWT secrets before deploying to production.
- A Dockerfile and `docker-compose.yml` can be added to containerize services.

Refer to the full README for design details and contributing guidelines.
