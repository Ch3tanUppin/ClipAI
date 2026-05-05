package com.clipai.api.video;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoReactionRepository extends JpaRepository<VideoReaction, UUID> {
    List<VideoReaction> findByVideo(Video video);
}
