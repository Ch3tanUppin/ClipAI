package com.clipai.api.video;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoCommentRepository extends JpaRepository<VideoComment, UUID> {
    List<VideoComment> findByVideoOrderByCreatedAtDesc(Video video);
}
