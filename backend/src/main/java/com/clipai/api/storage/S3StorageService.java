package com.clipai.api.storage;

import com.clipai.api.config.AppProperties;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class S3StorageService {
    private final AppProperties properties;
    private final S3Presigner presigner;

    public S3StorageService(AppProperties properties) {
        this.properties = properties;
        this.presigner = S3Presigner.builder()
                .region(Region.of(properties.aws().region()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    public URL createUploadUrl(String key, String contentType) {
        if (!properties.aws().enabled()) {
            return url(properties.publicApiBaseUrl().replaceAll("/$", "") + "/local-uploads/" + encode(key));
        }
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(properties.aws().bucket())
                .key(key)
                .contentType(contentType)
                .build();
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(objectRequest)
                .build();
        return presigner.presignPutObject(presignRequest).url();
    }

    public String cdnUrl(String key) {
        if (!properties.aws().enabled()) {
            return properties.publicApiBaseUrl().replaceAll("/$", "") + "/local-assets/" + encode(key);
        }
        return properties.aws().cdnBaseUrl().replaceAll("/$", "") + "/" + key;
    }

    private String encode(String key) {
        return URLEncoder.encode(key, StandardCharsets.UTF_8);
    }

    private URL url(String value) {
        try {
            return new URL(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid local upload URL", ex);
        }
    }
}
