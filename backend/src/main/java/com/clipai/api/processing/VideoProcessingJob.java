package com.clipai.api.processing;

import java.util.UUID;

public record VideoProcessingJob(UUID videoId, String sourceKey) {}

