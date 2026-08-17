package com.nmn.financeadvisor.controller;

import com.nmn.financeadvisor.config.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            log.warn("[AUDIT] Intento de login con credenciales incompletas");
            return ResponseEntity.badRequest().body(Map.of("message", "Usuario y contraseña son obligatorios."));
        }

        if (adminUsername.equals(username) && adminPassword.equals(password)) {
            String token = jwtUtil.generateToken(username);
            log.info("[AUDIT] Login exitoso para usuario: {}", username);
            return ResponseEntity.ok(Map.of(
                "token", token,
                "username", username
            ));
        }

        log.warn("[AUDIT] Intento de login fallido para usuario: {}", username);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Credenciales inválidas."));
    }
}
