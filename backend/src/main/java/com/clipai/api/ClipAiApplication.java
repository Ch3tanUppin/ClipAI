package com.clipai.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClipAiApplication {
    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(ClipAiApplication.class, args);
    }

    private static void loadDotEnv() {
        try {
            java.nio.file.Path envPath = java.nio.file.Paths.get(".env");
            if (!java.nio.file.Files.exists(envPath)) {
                envPath = java.nio.file.Paths.get("backend/.env");
            }
            if (java.nio.file.Files.exists(envPath)) {
                java.nio.file.Files.readAllLines(envPath).forEach(line -> {
                    line = line.trim();
                    if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                        int index = line.indexOf("=");
                        String key = line.substring(0, index).trim();
                        String value = line.substring(index + 1).trim();
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                        } else if (value.startsWith("'") && value.endsWith("'")) {
                            value = value.substring(1, value.length() - 1);
                        }
                        if (System.getenv(key) == null && System.getProperty(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                });
            }
        } catch (java.io.IOException ignored) {}
    }
}

