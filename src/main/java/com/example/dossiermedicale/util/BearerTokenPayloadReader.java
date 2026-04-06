package com.example.dossiermedicale.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Base64;
import java.util.Optional;

/**
 * Lit les claims du JWT depuis le header Authorization (payload Base64 uniquement).
 * La signature n'est pas vérifiée ici : l'API Gateway a déjà validé le token.
 */
public final class BearerTokenPayloadReader {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private BearerTokenPayloadReader() {}

    public static Optional<JsonNode> payload(HttpServletRequest request) {
        if (request == null) {
            return Optional.empty();
        }
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return Optional.empty();
        }
        String token = auth.substring(7).trim();
        String[] parts = token.split("\\.");
        if (parts.length < 2) {
            return Optional.empty();
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            return Optional.of(MAPPER.readTree(decoded));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public static Optional<String> preferredUsername(HttpServletRequest request) {
        return payload(request).map(BearerTokenPayloadReader::extractPreferredUsername)
                .filter(s -> !s.isBlank());
    }

    private static String extractPreferredUsername(JsonNode p) {
        String u = text(p, "preferred_username");
        if (u != null) {
            return u;
        }
        return text(p, "sub");
    }

    public static String text(JsonNode payload, String field) {
        if (payload == null) {
            return null;
        }
        JsonNode n = payload.get(field);
        if (n == null || n.isNull()) {
            return null;
        }
        String s = n.asText();
        return s.isEmpty() ? null : s;
    }
}
