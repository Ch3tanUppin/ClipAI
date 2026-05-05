export type UserRole = "FREE" | "PREMIUM" | "ADMIN";
export type VideoStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
export type AssetType = "ORIGINAL" | "THUMBNAIL" | "MP4" | "HLS";
export type PlanType = "PREMIUM_MONTHLY" | "PREMIUM_YEARLY";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface VideoAsset {
  type: AssetType;
  cdnUrl: string;
  width?: number;
  height?: number;
  bitrate?: number;
}

export interface VideoComment {
  id: string;
  authorName: string;
  body: string;
  emoji?: string;
  createdAt: string;
}

export interface Video {
  id: string;
  publicId: string;
  title: string;
  description?: string;
  privacy: "PUBLIC_LINK" | "WORKSPACE" | "PRIVATE";
  summary?: string;
  transcript?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  status: VideoStatus;
  sizeBytes: number;
  durationSeconds?: number;
  createdAt: string;
  assets: VideoAsset[];
  comments: VideoComment[];
  reactions: Record<string, number>;
}
