package com.clipai.api.storage;

import com.clipai.api.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class LocalStorageController {
    private final AppProperties properties;
    private final Path root;

    public LocalStorageController(AppProperties properties) {
        this.properties = properties;
        this.root = Path.of(properties.local().uploadDir()).toAbsolutePath().normalize();
    }

    @PutMapping("/local-uploads/{encodedKey}")
    @CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void upload(@PathVariable String encodedKey, HttpServletRequest request) throws IOException {
        Path target = resolve(encodedKey);
        Files.createDirectories(target.getParent());
        Files.copy(request.getInputStream(), target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
    }

    @GetMapping("/local-uploads/{encodedKey}")
    @CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
    ResponseEntity<Resource> download(@PathVariable String encodedKey) throws IOException {
        Path target = resolve(encodedKey);
        if (!Files.exists(target)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new UrlResource(target.toUri());
        String contentType = Files.probeContentType(target);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=60")
                .contentType(MediaType.parseMediaType(contentType == null ? "application/octet-stream" : contentType))
                .body(resource);
    }

    @GetMapping("/local-assets/{encodedKey}")
    @CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
    ResponseEntity<Resource> asset(@PathVariable String encodedKey) throws IOException {
        Path target = resolve(encodedKey);
        if (!Files.exists(target)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new UrlResource(target.toUri());
        String contentType = Files.probeContentType(target);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=60")
                .contentType(MediaType.parseMediaType(contentType == null ? "application/octet-stream" : contentType))
                .body(resource);
    }

    private Path resolve(String encodedKey) {
        String key = URLDecoder.decode(encodedKey, StandardCharsets.UTF_8);
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Invalid local storage key");
        }
        return target;
    }
}
