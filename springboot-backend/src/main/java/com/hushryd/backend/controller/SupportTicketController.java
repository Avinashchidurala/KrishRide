package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.SupportTicket;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.SupportTicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/support-tickets")
public class SupportTicketController {

    @Autowired
    private SupportTicketService supportTicketService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTicket(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> body) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        String bookingId = (String) body.get("bookingId");
        String rideId = (String) body.get("rideId");
        String subject = (String) body.get("subject");
        String description = (String) body.get("description");
        String priority = (String) body.get("priority");

        SupportTicket ticket = supportTicketService.createTicket(
                userPrincipal.getId(), bookingId, rideId, subject, description, priority);

        Map<String, Object> data = new HashMap<>();
        data.put("ticket", ticket);
        data.put("message", "Support ticket created successfully. Ticket ID: " + ticket.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserTickets(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = supportTicketService.getUserTickets(
                userPrincipal.getId(), page, limit, status, priority);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTicketDetails(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        SupportTicket ticket = supportTicketService.getTicketDetails(
                userPrincipal.getId(), userPrincipal.getRole(), id);

        Map<String, Object> data = new HashMap<>();
        data.put("ticket", ticket);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
