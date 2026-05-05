# System Design

## 1. High-Level Architecture

ClipAI is split into independently deployable frontend, API, and processing workers.

```text
Browser / Next.js SPA
  | JWT + HTTPS API calls
  v
Spring Boot API Gateway/App
  |-- PostgreSQL: users, videos, assets, payments, subscriptions
  |-- Redis: sessions/rate limits/cache
  |-- S3: original uploads and processed assets
  |-- Kafka: video processing jobs
  |-- Razorpay: orders, verification, webhooks
  v
Video Worker
  |-- downloads original from S3
  |-- FFmpeg creates thumbnails + HLS/MP4 renditions
  |-- uploads processed assets to S3
  v
CloudFront CDN -> public/shared playback URLs
```

## Recording To Playback Flow

1. The frontend records screen, webcam, or both with the `MediaRecorder` API.
2. The user previews the local blob before upload.
3. The frontend requests `POST /videos/upload-url` with file metadata.
4. The backend creates a private S3 object key and returns a pre-signed PUT URL.
5. The frontend uploads directly to S3 and reports progress with Axios.
6. The frontend calls `POST /videos` with the object key, title, and size.
7. The backend stores metadata with `UPLOADED` status and publishes a Kafka job.
8. A worker consumes the job, marks the video `PROCESSING`, runs FFmpeg, stores renditions and thumbnails as `video_assets`, then marks the video `READY`.
9. Playback pages use CloudFront URLs for processed assets. Shareable links expose only public IDs, not internal database IDs.

## Frontend And Backend Interaction

- Auth uses `POST /auth/signup` and `POST /auth/login`.
- The API returns JWTs. The frontend stores them in Zustand-backed session state and `localStorage` for this implementation; production web deployments should prefer an HttpOnly secure cookie BFF pattern.
- Protected pages call the API with `Authorization: Bearer <token>`.
- Uploads go directly from browser to S3 using pre-signed URLs so application servers do not stream large files.

## CDN Streaming

- S3 stores originals in private prefixes and processed assets under CDN-safe keys.
- CloudFront fronts S3 with Origin Access Control.
- The backend returns canonical playback URLs for `READY` assets.
- HLS renditions are preferred for longer videos; MP4 renditions are acceptable for MVP playback.

## Async Processing Pipeline

```text
POST /videos
  -> Video(status=UPLOADED)
  -> Kafka topic video-processing-jobs
  -> Worker receives videoId
  -> Video(status=PROCESSING)
  -> FFmpeg: 1080p/720p/480p + thumbnail
  -> S3 processed uploads
  -> VideoAsset rows
  -> Video(status=READY)
```

# Database Schema

## Enums

- `user_role`: `FREE`, `PREMIUM`, `ADMIN`
- `video_status`: `UPLOADED`, `PROCESSING`, `READY`, `FAILED`
- `asset_type`: `ORIGINAL`, `THUMBNAIL`, `MP4`, `HLS`
- `payment_status`: `CREATED`, `PAID`, `FAILED`
- `plan_type`: `FREE`, `PREMIUM_MONTHLY`, `PREMIUM_YEARLY`
- `subscription_status`: `ACTIVE`, `CANCELLED`, `EXPIRED`, `PAST_DUE`

## Tables And Relationships

- `users` has many `videos`, `payments`, and `subscriptions`.
- `videos` belongs to `users` and has many `video_assets`.
- `payments` optionally activates or extends a `subscription`.
- `subscriptions` belongs to `users`.

Important indexes:

- `users.email` unique for login.
- `videos.owner_id, created_at` for dashboard queries.
- `videos.public_id` unique for sharing.
- `video_assets.video_id, type` for playback asset lookup.
- `payments.razorpay_order_id` and `payments.razorpay_payment_id` for idempotent verification/webhooks.

# Deployment Guide

## Backend

1. Build with `mvn clean package`.
2. Build Docker image from `backend/Dockerfile`.
3. Deploy API and worker replicas to ECS or Kubernetes.
4. Configure env vars from AWS Secrets Manager or Kubernetes Secrets.
5. Use RDS PostgreSQL, ElastiCache Redis, MSK/Self-managed Kafka, S3, and CloudFront.

## Frontend

1. Deploy `frontend` to Vercel or Netlify.
2. Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CDN_URL`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. Enforce HTTPS and configure API CORS to the production frontend origin.

## Scalability

- API is stateless and horizontally scalable.
- Large uploads bypass API servers via S3 pre-signed URLs.
- FFmpeg workers scale independently by Kafka consumer group size.
- CDN absorbs playback traffic.
- Redis supports rate limiting, hot metadata caching, and token deny-listing if needed.

## Bonus Extensions

- Analytics: `video_views` table with aggregate Redis counters flushed to PostgreSQL.
- Comments: `comments(video_id, user_id, body, created_at)`.
- AI captions: publish `caption-jobs`, transcribe audio, store WebVTT assets.

