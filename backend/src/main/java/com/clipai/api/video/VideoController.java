package com.clipai.api.video;

import com.clipai.api.user.User;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/videos")
public class VideoController {
    private final VideoService videoService;

    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    @PostMapping("/upload-url")
    VideoDtos.UploadUrlResponse uploadUrl(@AuthenticationPrincipal User user, @Valid @RequestBody VideoDtos.UploadUrlRequest request) {
        return videoService.uploadUrl(user, request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    VideoDtos.VideoResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody VideoDtos.CreateVideoRequest request) {
        return videoService.create(user, request);
    }

    @GetMapping
    List<VideoDtos.VideoResponse> list(@AuthenticationPrincipal User user) {
        return videoService.list(user);
    }

    @GetMapping("/{id}")
    VideoDtos.VideoResponse get(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        return videoService.get(user, id);
    }

    @PatchMapping("/{id}")
    VideoDtos.VideoResponse rename(@AuthenticationPrincipal User user, @PathVariable UUID id, @Valid @RequestBody VideoDtos.RenameVideoRequest request) {
        return videoService.rename(user, id, request);
    }

    @PatchMapping("/{id}/settings")
    VideoDtos.VideoResponse update(@AuthenticationPrincipal User user, @PathVariable UUID id, @Valid @RequestBody VideoDtos.UpdateVideoRequest request) {
        return videoService.update(user, id, request);
    }

    @PostMapping("/{id}/ai-summary")
    VideoDtos.AiSummaryResponse aiSummary(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        return videoService.generateAiSummary(user, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        videoService.delete(user, id);
    }

    @GetMapping("/share/{publicId}")
    VideoDtos.VideoResponse shared(@PathVariable String publicId) {
        return videoService.getShared(publicId);
    }

    @PostMapping("/share/{publicId}/comments")
    VideoDtos.CommentResponse comment(@PathVariable String publicId, @Valid @RequestBody VideoDtos.CommentRequest request) {
        return videoService.addComment(publicId, request);
    }

    @PostMapping("/share/{publicId}/reactions")
    java.util.Map<String, Long> react(@PathVariable String publicId, @Valid @RequestBody VideoDtos.ReactionRequest request) {
        return videoService.react(publicId, request);
    }
}
