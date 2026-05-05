package com.clipai.api.video;

import com.clipai.api.common.ApiException;
import com.clipai.api.config.AppProperties;
import com.clipai.api.processing.VideoProcessingJob;
import com.clipai.api.processing.VideoProcessingProducer;
import com.clipai.api.storage.S3StorageService;
import com.clipai.api.user.User;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VideoService {
    private final VideoRepository videos;
    private final VideoAssetRepository assets;
    private final VideoCommentRepository comments;
    private final VideoReactionRepository reactions;
    private final S3StorageService storage;
    private final VideoProcessingProducer producer;
    private final AppProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public VideoService(VideoRepository videos, VideoAssetRepository assets, VideoCommentRepository comments, VideoReactionRepository reactions, S3StorageService storage, VideoProcessingProducer producer, AppProperties properties) {
        this.videos = videos;
        this.assets = assets;
        this.comments = comments;
        this.reactions = reactions;
        this.storage = storage;
        this.producer = producer;
        this.properties = properties;
    }

    public VideoDtos.UploadUrlResponse uploadUrl(User user, VideoDtos.UploadUrlRequest request) {
        String extension = extension(request.fileName());
        String key = "originals/%s/%s%s".formatted(user.getId(), UUID.randomUUID(), extension);
        return new VideoDtos.UploadUrlResponse(storage.createUploadUrl(key, request.contentType()).toString(), key);
    }

    @Transactional
    public VideoDtos.VideoResponse create(User user, VideoDtos.CreateVideoRequest request) {
        Video video = new Video();
        video.setOwner(user);
        video.setPublicId(newPublicId());
        video.setTitle(request.title().trim());
        video.setDescription(request.description());
        video.setSourceKey(request.objectKey());
        video.setSizeBytes(request.sizeBytes());
        videos.save(video);
        addAsset(video, AssetType.ORIGINAL, request.objectKey(), null, null, null);
        if (properties.video().localProcessing()) {
            video.setStatus(VideoStatus.PROCESSING);
            markReady(new VideoDtos.ProcessingResult(video.getId(), video.getSourceKey(), null, null));
            return toResponse(video);
        }
        producer.enqueue(new VideoProcessingJob(video.getId(), video.getSourceKey()));
        return toResponse(video);
    }

    public List<VideoDtos.VideoResponse> list(User user) {
        return videos.findByOwnerOrderByCreatedAtDesc(user).stream().map(this::toResponse).toList();
    }

    public VideoDtos.VideoResponse get(User user, UUID id) {
        return toResponse(videos.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Video not found")));
    }

    public VideoDtos.VideoResponse getShared(String publicId) {
        return toResponse(sharedVideo(publicId));
    }

    @Transactional
    public VideoDtos.VideoResponse rename(User user, UUID id, VideoDtos.RenameVideoRequest request) {
        Video video = videos.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Video not found"));
        video.setTitle(request.title().trim());
        return toResponse(video);
    }

    @Transactional
    public VideoDtos.VideoResponse update(User user, UUID id, VideoDtos.UpdateVideoRequest request) {
        Video video = videos.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Video not found"));
        if (request.title() != null && !request.title().isBlank()) {
            video.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            video.setDescription(request.description().trim());
        }
        if (request.privacy() != null && !request.privacy().isBlank()) {
            video.setPrivacy(request.privacy().trim().toUpperCase());
        }
        if (request.summary() != null) {
            video.setSummary(request.summary().trim());
        }
        if (request.transcript() != null) {
            video.setTranscript(request.transcript().trim());
        }
        if (request.ctaLabel() != null) {
            video.setCtaLabel(request.ctaLabel().trim());
        }
        if (request.ctaUrl() != null) {
            video.setCtaUrl(request.ctaUrl().trim());
        }
        return toResponse(video);
    }

    @Transactional
    public VideoDtos.AiSummaryResponse generateAiSummary(User user, UUID id) {
        Video video = videos.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Video not found"));
        String summary = "Clear async update covering the key context, decisions, and next steps from \"%s\".".formatted(video.getTitle());
        String transcript = "Intro: explains the purpose of the recording.\nWalkthrough: shows the important screen details.\nNext steps: calls out what viewers should do after watching.";
        video.setSummary(summary);
        video.setTranscript(transcript);
        return new VideoDtos.AiSummaryResponse(video.getTitle(), summary, transcript);
    }

    @Transactional
    public VideoDtos.CommentResponse addComment(String publicId, VideoDtos.CommentRequest request) {
        Video video = sharedVideo(publicId);
        VideoComment comment = new VideoComment();
        comment.setVideo(video);
        comment.setAuthorName(request.authorName().trim());
        comment.setBody(request.body().trim());
        comment.setEmoji(request.emoji());
        comments.save(comment);
        return toCommentResponse(comment);
    }

    @Transactional
    public Map<String, Long> react(String publicId, VideoDtos.ReactionRequest request) {
        Video video = sharedVideo(publicId);
        VideoReaction reaction = new VideoReaction();
        reaction.setVideo(video);
        reaction.setEmoji(request.emoji().trim());
        reactions.save(reaction);
        return reactionCounts(video);
    }

    @Transactional
    public void delete(User user, UUID id) {
        Video video = videos.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Video not found"));
        videos.delete(video);
    }

    @Transactional
    public void markProcessing(UUID videoId) {
        Video video = videos.findById(videoId).orElseThrow();
        video.setStatus(VideoStatus.PROCESSING);
    }

    @Transactional
    public void markReady(VideoDtos.ProcessingResult result) {
        Video video = videos.findById(result.videoId()).orElseThrow();
        if (result.mp4Key() != null) {
            addAsset(video, AssetType.MP4, result.mp4Key(), 1280, 720, 2500);
        }
        if (result.thumbnailKey() != null) {
            addAsset(video, AssetType.THUMBNAIL, result.thumbnailKey(), 1280, 720, null);
        }
        video.setDurationSeconds(result.durationSeconds());
        video.setStatus(VideoStatus.READY);
    }

    @Transactional
    public void markFailed(UUID videoId, String reason) {
        Video video = videos.findById(videoId).orElseThrow();
        video.setStatus(VideoStatus.FAILED);
        video.setFailureReason(reason);
    }

    private void addAsset(Video video, AssetType type, String key, Integer width, Integer height, Integer bitrate) {
        VideoAsset asset = new VideoAsset();
        asset.setVideo(video);
        asset.setType(type);
        asset.setStorageKey(key);
        asset.setCdnUrl(storage.cdnUrl(key));
        asset.setWidth(width);
        asset.setHeight(height);
        asset.setBitrate(bitrate);
        assets.save(asset);
    }

    private VideoDtos.VideoResponse toResponse(Video video) {
        List<VideoDtos.AssetResponse> assetResponses = assets.findByVideo(video).stream()
                .map(a -> new VideoDtos.AssetResponse(a.getType(), a.getCdnUrl(), a.getWidth(), a.getHeight(), a.getBitrate()))
                .toList();
        List<VideoDtos.CommentResponse> commentResponses = comments.findByVideoOrderByCreatedAtDesc(video).stream()
                .map(this::toCommentResponse)
                .toList();
        return new VideoDtos.VideoResponse(video.getId(), video.getPublicId(), video.getTitle(), video.getDescription(),
                video.getPrivacy(), video.getSummary(), video.getTranscript(), video.getCtaLabel(), video.getCtaUrl(),
                video.getStatus(), video.getSizeBytes(), video.getDurationSeconds(), video.getCreatedAt(), assetResponses,
                commentResponses, reactionCounts(video));
    }

    private Video sharedVideo(String publicId) {
        Video video = videos.findByPublicId(publicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Video not found"));
        if ("PRIVATE".equals(video.getPrivacy())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Video not found");
        }
        return video;
    }

    private VideoDtos.CommentResponse toCommentResponse(VideoComment comment) {
        return new VideoDtos.CommentResponse(comment.getId(), comment.getAuthorName(), comment.getBody(), comment.getEmoji(), comment.getCreatedAt());
    }

    private Map<String, Long> reactionCounts(Video video) {
        return reactions.findByVideo(video).stream()
                .collect(Collectors.groupingBy(VideoReaction::getEmoji, Collectors.counting()));
    }

    private String newPublicId() {
        byte[] bytes = new byte[18];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String extension(String filename) {
        int index = filename.lastIndexOf('.');
        if (index < 0) {
            return "";
        }
        return filename.substring(index).replaceAll("[^A-Za-z0-9.]", "");
    }
}
