package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import java.util.Calendar;
import java.util.Date;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @OneToOne(targetEntity = OurUsers.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    private OurUsers user;

    @Column(nullable = false)
    private Date expiryDate;

    public PasswordResetToken() {}

    public PasswordResetToken(String token, OurUsers user) {
        this.token = token;
        this.user = user;
        this.expiryDate = calculateExpiryDate(24 * 60);
    }

    private Date calculateExpiryDate(int expiryTimeInMinutes) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(new Date());
        cal.add(Calendar.MINUTE, expiryTimeInMinutes);
        return cal.getTime();
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public OurUsers getUser() { return user; }
    public void setUser(OurUsers user) { this.user = user; }

    public Date getExpiryDate() { return expiryDate; }
    public void setExpiryDate(Date expiryDate) { this.expiryDate = expiryDate; }
}