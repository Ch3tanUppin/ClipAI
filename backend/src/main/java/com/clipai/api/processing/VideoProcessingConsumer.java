package com.clipai.api.processing;

import com.clipai.api.config.AppProperties;
import com.clipai.api.video.VideoDtos;
import com.clipai.api.video.VideoService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.video.local-processing", havingValue = "false")
public class VideoProcessingConsumer {
    private static final Logger log = LoggerFactory.getLogger(VideoProcessingConsumer.class);
    private final VideoService videoService;
    private final AppProperties properties;

    public VideoProcessingConsumer(VideoService videoService, AppProperties properties) {
        this.videoService = videoService;
        this.properties = properties;
    }

    @KafkaListener(topics = "${app.video.processing-topic}")
    public void consume(VideoProcessingJob job) {
        UUID videoId = job.videoId();
        try {
            videoService.markProcessing(videoId);
            log.info("Processing video {} from {}", videoId, job.sourceKey());
            if (properties.video().localProcessing()) {
                videoService.markReady(new VideoDtos.ProcessingResult(videoId, job.sourceKey(), null, null));
                return;
            }
            // Production workers should download from S3, run FFmpeg, and upload renditions.
            // This local scaffold models the contract and marks derived output keys deterministically.
            String base = "processed/%s/".formatted(videoId);
            videoService.markReady(new VideoDtos.ProcessingResult(videoId, base + "720p.mp4", base + "thumbnail.jpg", null));
        } catch (Exception ex) {
            log.error("Video processing failed for {}", videoId, ex);
            videoService.markFailed(videoId, ex.getMessage());
        }
    }
}
