# Job Tracker API

![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)
![TypeScript](https://img.shields.io/badge/typescript-%3E%3D4.9-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

AI‑powered backend for tracking job applications, generating and storing resumes,
providing AI-driven recommendations, analytics, and automated follow-ups. Designed
for developers and job seekers who want to manage their search in one place.

---

## 🚀 Features

- ✉️ JWT authentication (access + refresh tokens)
- 📂 Full CRUD for job applications
- 📄 Resume upload with Cloudinary storage and text extraction
- 🧠 AI resume analysis, cover letter drafting and interview prep
- ⚙️ Asynchronous processing with Bull & Redis queues
- 📊 Monthly analytics stored in PostgreSQL
- 📥 Email follow-up reminders via daily cron job
- 📘 Swagger/OpenAPI documentation

---

## 🏗️ Architecture Overview

```mermaid
flowchart LR
  Client -->|HTTP| AuthMiddleware
  AuthMiddleware -->|valid| Controllers
  Controllers --> Services
  Services -->|reads/writes| MongoDB
  Services -->|writes| PostgreSQL
  Services -->|queues jobs| Bull
  Bull --> Redis
  Services --> Cloudinary
  Services --> OpenAI
  Services --> Nodemailer
```

This lightweight diagram shows how traffic flows from the client through
authentication middleware into controllers and service layers which interact
with databases, external APIs and background queues.

---

## 📦 Tech Stack

- **Language:** TypeScript, Node.js
- **Web Framework:** Express
- **Databases:** MongoDB (application data), PostgreSQL (analytics)
- **Queue:** Bull with Redis backend
- **Cloud:** Cloudinary for resume storage
- **AI:** OpenAI / Groq for natural language tasks
- **Email:** Nodemailer (Gmail)
- **Documentation:** Swagger (OpenAPI)
- **Testing:** Jest + Supertest (setup included)

---

## 🛠️ Getting Started

### Prerequisites

1. Node.js (v18 or later) and npm installed
2. MongoDB instance (local or cloud)
3. PostgreSQL server
4. Redis server
5. Cloudinary account & credentials
6. OpenAI API key
7. Gmail account (app password recommended)

### Installation

```bash
# clone the repository
git clone https://github.com/<your-username>/job-tracker-api.git
cd job-tracker-api

# install dependencies
npm install

# copy environment variables
cp .env.example .env
# edit .env and fill in secrets

# start databases/servers (Mongo, Postgres, Redis)
# then run in development mode
npm run dev
```

Your server will be available at `http://localhost:3000` and API docs at
`http://localhost:3000/api-docs`.

### Environment Variables

Rename `.env.example` to `.env` and supply real values. Example keys:

```
MONGO_URL=mongodb://localhost:27017/jobtracker
POSTGRES_URI=postgres://user:pass@localhost:5432/jobtracker
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

OPENAI_API_KEY=sk-xxxx

CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=12345
CLOUDINARY_API_SECRET=abcdef

EMAIL_USER=you@gmail.com
EMAIL_PASS=app_password

PORT=3000
NODE_ENV=development
```

> 💡 You can find a complete template in `.env.example`.

### Running Tests

```bash
npm test
```

Tests use Jest and Supertest; a local MongoDB/Redis/Postgres instance is
required.

### Deployment

The app is container-friendly; a `Dockerfile` and `docker-compose.yml` can be
added for production environments such as Railway, Render, or Heroku.

---

## 📁 Repository Structure

```
src/
├─ config/       # database, cloudinary, openai, etc.
├─ controllers/  # request handlers
├─ middleware/   # auth, error handling, uploads
├─ models/       # Mongoose schemas
├─ routes/       # Express routers
├─ services/     # business logic & external API integration
├─ queues/       # Bull queue configuration and processors
├─ jobs/         # cron tasks
└─ utils/        # helpers

tests/           # Jest test files
```

---

## 📄 Additional Documentation

- **[Flow Diagrams](docs/flow.md)** – supplementary Mermaid sketches.
- **INSTALLATION.md** – step-by-step setup guide (see project root).

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for
workflow, coding standards and issue submission guidelines.

---

## 📜 License

This project is licensed under the MIT License – see [LICENSE](LICENSE) for
details.

---

_Feel free to connect on [LinkedIn](www.linkedin.com/in/minamalakh) or open an issue
if you have questions!_
