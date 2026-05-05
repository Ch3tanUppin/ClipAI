package com.clipai.api.video;

import com.clipai.api.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoRepository extends JpaRepository<Video, UUID> {
    List<Video> findByOwnerOrderByCreatedAtDesc(User owner);
    Optional<Video> findByIdAndOwner(UUID id, User owner);
    Optional<Video> findByPublicId(String publicId);
}

