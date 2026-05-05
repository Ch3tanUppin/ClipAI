package com.clipai.api.processing;

import com.clipai.api.config.AppProperties;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class VideoProcessingProducer {
    private final KafkaTemplate<String, VideoProcessingJob> kafka;
    private final AppProperties properties;

    public VideoProcessingProducer(KafkaTemplate<String, VideoProcessingJob> kafka, AppProperties properties) {
        this.kafka = kafka;
        this.properties = properties;
    }

    public void enqueue(VideoProcessingJob job) {
        kafka.send(properties.video().processingTopic(), job.videoId().toString(), job);
    }
}

