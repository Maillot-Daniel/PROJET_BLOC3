package com.olympics.tickets.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/test")
    public String test() {
        return "Backend is working!";
    }

    @GetMapping("/api/db-test")
    public String dbTest() {
        return "Database connection test endpoint";
    }
}