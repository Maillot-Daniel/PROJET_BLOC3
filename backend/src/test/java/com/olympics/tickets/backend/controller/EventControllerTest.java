package com.olympics.tickets.backend.controller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import com.olympics.tickets.backend.entity.Event;
import com.olympics.tickets.backend.service.EventService;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EventControllerTest {

    @Mock
    private EventService eventService;

    @InjectMocks
    private EventController eventController;

    @Test
    public void getAllEvents_ShouldReturnPage() {
        // Setup
        Event event = new Event();
        Page<Event> page = new PageImpl<>(Arrays.asList(event));

        when(eventService.getAllEvents(any(Pageable.class))).thenReturn(page);

        // Execute
        ResponseEntity<Page<Event>> response = eventController.getAllEvents(Pageable.unpaged());

        // Verify
        verify(eventService).getAllEvents(any(Pageable.class));
    }
}