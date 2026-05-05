# ClipAI

Production-oriented Loom-like platform with a Spring Boot API, Next.js frontend, PostgreSQL, Redis, Kafka, S3/CloudFront storage, FFmpeg processing hooks, and Razorpay billing.

## Structure

- `docs/system-design.md` - architecture, flows, schema, deployment notes
- `backend` - Spring Boot 3 API and async video worker consumer
- `frontend` - Next.js React app using Tailwind, Axios, Zustand, MediaRecorder
- `docker-compose.yml` - local PostgreSQL, Redis, Kafka, and Zookeeper

## Local Services

```bash
docker compose up -d
```

## Backend

```bash
cd backend
cp .env.example .env
mvn spring-boot:run
```

Required environment variables are documented in `backend/.env.example`. The local Docker PostgreSQL service is exposed on `localhost:5433` to avoid colliding with existing PostgreSQL installs.

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend defaults to `http://localhost:3000` and calls the API at `NEXT_PUBLIC_API_URL`.
