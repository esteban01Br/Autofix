package com.autofix.security;

import com.autofix.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${autofix.jwt.secret}")
    private String secretKey;

    @Value("${autofix.jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public String generateToken(Usuario usuario) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("id", usuario.getId());
        claims.put("rol", usuario.getRol().name());

        return buildToken(claims, usuario.getCorreo());
    }

    private String buildToken(Map<String, Object> claims, String subject) {

        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extraerCorreo(String token) {
        return extraerClaim(token, Claims::getSubject);
    }

    public Long extraerUsuarioId(String token) {
        return extraerTodosLosClaims(token).get("id", Long.class);
    }

    public String extraerRol(String token) {
        return extraerTodosLosClaims(token).get("rol", String.class);
    }

    public boolean esTokenValido(String token, UserDetails userDetails) {

        String correo = extraerCorreo(token);

        return correo.equals(userDetails.getUsername())
                && !estaExpirado(token);
    }

    private boolean estaExpirado(String token) {
        return extraerExpiracion(token).before(new Date());
    }

    private Date extraerExpiracion(String token) {
        return extraerClaim(token, Claims::getExpiration);
    }

    private <T> T extraerClaim(String token, Function<Claims, T> resolver) {

        Claims claims = extraerTodosLosClaims(token);

        return resolver.apply(claims);
    }

    private Claims extraerTodosLosClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}