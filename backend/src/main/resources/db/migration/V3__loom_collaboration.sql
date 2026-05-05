ALTER TABLE videos
    ADD COLUMN privacy VARCHAR(24) NOT NULL DEFAULT 'PUBLIC_LINK',
    ADD COLUMN summary TEXT,
    ADD COLUMN transcript TEXT,
    ADD COLUMN cta_label VARCHAR(80),
    ADD COLUMN cta_url TEXT;

CREATE TABLE video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    author_name VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    emoji VARCHAR(16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE video_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    emoji VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_comments_video_created ON video_comments(video_id, created_at DESC);
CREATE INDEX idx_video_reactions_video_emoji ON video_reactions(video_id, emoji);
