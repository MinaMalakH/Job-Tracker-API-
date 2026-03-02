# Job Tracker API

AI-powered backend for tracking job applications, resume tailoring, follow-ups, and analytics.

## Features

- JWT authentication
- CRUD for job applications
- Resume upload + text extraction (Cloudinary)
- AI resume analysis (Groq)
- Cover letter & interview prep generation
- Async processing with Bull + Redis
- Monthly analytics (PostgreSQL)
- Email follow-up reminders (cron)

## Tech Stack

- Node.js + Express + TypeScript
- MongoDB (applications, users)
- PostgreSQL (analytics)
- Redis + Bull (queues)
- Groq AI (LLM)
- Cloudinary (file storage)
- Nodemailer (emails)

## Setup

1. Clone repo
2. `npm install`
3. Create `.env` from `.env.example`
4. Start Redis: run `redis-server.exe` in its folder
5. Start PostgreSQL service
6. `npm run dev`

## API Docs

http://localhost:3000/api-docs

## Testing

`npm test`

## Deployment

Ready for Railway/Render (Dockerfile coming soon)
