package com.clipai.api.video;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoAssetRepository extends JpaRepository<VideoAsset, UUID> {
    List<VideoAsset> findByVideo(Video video);
}

