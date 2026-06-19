package com.clipai.api.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

public class GlobalCorsFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(GlobalCorsFilter.class);
    
    private final AppProperties properties;

    public GlobalCorsFilter(AppProperties properties) {
        this.properties = properties;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String origin = request.getHeader("Origin");
        String method = request.getMethod();
        String path = request.getRequestURI();

        log.info("[CORS Debug] Request Method: {}, Path: {}, Origin Header: {}", method, path, origin);

        if (origin != null) {
            boolean isValidOrigin = false;
            String configuredOrigin = properties.frontendOrigin();
            
            // Perform origin validation.
            // Check if origin matches configuration, localhost, or standard loopback interfaces.
            if (origin.equalsIgnoreCase(configuredOrigin) 
                    || origin.startsWith("http://localhost:") 
                    || origin.startsWith("http://127.0.0.1:")
                    || origin.startsWith("https://localhost:") 
                    || origin.startsWith("https://127.0.0.1:")) {
                isValidOrigin = true;
            }

            if (isValidOrigin) {
                response.setHeader("Access-Control-Allow-Origin", origin);
                response.setHeader("Access-Control-Allow-Credentials", "true");
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
                response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
                response.setHeader("Access-Control-Max-Age", "3600");
                log.info("[CORS Debug] Origin '{}' approved and headers set.", origin);
            } else {
                log.warn("[CORS Debug] Origin '{}' rejected. Configured origin is '{}'", origin, configuredOrigin);
            }
        }

        // Handle preflight OPTIONS request
        if ("OPTIONS".equalsIgnoreCase(method)) {
            log.info("[CORS Debug] Responding 200 OK to preflight OPTIONS request for path: {}", path);
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(req, res);
    }
}
