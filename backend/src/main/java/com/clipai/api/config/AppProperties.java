package com.clipai.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendOrigin,
        String publicApiBaseUrl,
        Jwt jwt,
        Aws aws,
        Razorpay razorpay,
        Video video,
        Local local
) {
    public record Jwt(String secret, String issuer, long ttlMinutes) {}
    public record Aws(String region, String bucket, String cdnBaseUrl, boolean enabled) {}
    public record Razorpay(String keyId, String keySecret, String webhookSecret) {}
    public record Video(String processingTopic, boolean localProcessing) {}
    public record Local(String uploadDir, boolean mockPayments) {}
}
