CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('FREE', 'PREMIUM', 'ADMIN');
CREATE TYPE video_status AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED');
CREATE TYPE asset_type AS ENUM ('ORIGINAL', 'THUMBNAIL', 'MP4', 'HLS');
CREATE TYPE payment_status AS ENUM ('CREATED', 'PAID', 'FAILED');
CREATE TYPE plan_type AS ENUM ('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    role user_role NOT NULL DEFAULT 'FREE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_id VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    source_key TEXT NOT NULL,
    status video_status NOT NULL DEFAULT 'UPLOADED',
    duration_seconds INTEGER,
    size_bytes BIGINT NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE video_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    type asset_type NOT NULL,
    storage_key TEXT NOT NULL,
    cdn_url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    bitrate INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan plan_type NOT NULL,
    amount_paise INTEGER NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'CREATED',
    razorpay_order_id VARCHAR(80) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(80) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan plan_type NOT NULL,
    status subscription_status NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_owner_created ON videos(owner_id, created_at DESC);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_video_assets_video_type ON video_assets(video_id, type);
CREATE INDEX idx_payments_user_created ON payments(user_id, created_at DESC);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

