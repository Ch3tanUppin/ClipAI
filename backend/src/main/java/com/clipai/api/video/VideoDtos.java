package com.clipai.api.video;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class VideoDtos {
    private VideoDtos() {}

    public record UploadUrlRequest(
            @NotBlank String fileName,
            @NotBlank String contentType,
            @Min(1) long sizeBytes
    ) {}

    public record UploadUrlResponse(String uploadUrl, String objectKey) {}

    public record CreateVideoRequest(
            @NotBlank @Size(max = 180) String title,
            String description,
            @NotBlank String objectKey,
            @Min(1) long sizeBytes
    ) {}

    public record RenameVideoRequest(@NotBlank @Size(max = 180) String title) {}

    public record UpdateVideoRequest(
            @Size(max = 180) String title,
            String description,
            @Size(max = 24) String privacy,
            String summary,
            String transcript,
            @Size(max = 80) String ctaLabel,
            String ctaUrl
    ) {}

    public record CommentRequest(
            @NotBlank @Size(max = 120) String authorName,
            @NotBlank @Size(max = 2000) String body,
            @Size(max = 16) String emoji
    ) {}

    public record ReactionRequest(@NotBlank @Size(max = 16) String emoji) {}

    public record VideoResponse(
            UUID id,
            String publicId,
            String title,
            String description,
            String privacy,
            String summary,
            String transcript,
            String ctaLabel,
            String ctaUrl,
            VideoStatus status,
            Long sizeBytes,
            Integer durationSeconds,
            Instant createdAt,
            List<AssetResponse> assets,
            List<CommentResponse> comments,
            Map<String, Long> reactions
    ) {}

    public record AssetResponse(AssetType type, String cdnUrl, Integer width, Integer height, Integer bitrate) {}

    public record CommentResponse(UUID id, String authorName, String body, String emoji, Instant createdAt) {}

    public record AiSummaryResponse(String title, String summary, String transcript) {}

    public record ProcessingResult(
            @NotNull UUID videoId,
            String mp4Key,
            String thumbnailKey,
            Integer durationSeconds
    ) {}
}
