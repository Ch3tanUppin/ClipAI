package com.clipai.api.video;

import com.clipai.api.common.BaseEntity;
import com.clipai.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "videos")
public class Video extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false, unique = true, length = 40)
    private String publicId;

    @Column(nullable = false, length = 180)
    private String title;

    private String description;

    @Column(nullable = false)
    private String sourceKey;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "video_status")
    private VideoStatus status = VideoStatus.UPLOADED;

    private Integer durationSeconds;

    @Column(nullable = false)
    private Long sizeBytes;

    private String failureReason;

    @Column(nullable = false, length = 24)
    private String privacy = "PUBLIC_LINK";

    private String summary;

    private String transcript;

    @Column(length = 80)
    private String ctaLabel;

    private String ctaUrl;
}
