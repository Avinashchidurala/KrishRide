package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.EmergencyContact;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.EmergencyContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency-contacts")
public class EmergencyContactController {

    @Autowired
    private EmergencyContactService emergencyContactService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getContacts(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        List<EmergencyContact> contacts = emergencyContactService.getContacts(userPrincipal.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("contacts", contacts);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> addContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> body) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        String name = (String) body.get("name");
        String mobile = (String) body.get("mobile");
        String relationship = (String) body.get("relationship");
        Boolean isPrimary = (Boolean) body.get("isPrimary");

        EmergencyContact contact = emergencyContactService.addContact(
                userPrincipal.getId(), name, mobile, relationship, isPrimary);

        Map<String, Object> data = new HashMap<>();
        data.put("contact", contact);
        data.put("message", "Emergency contact added successfully");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        String name = (String) body.get("name");
        String mobile = (String) body.get("mobile");
        String relationship = (String) body.get("relationship");
        Boolean isPrimary = (Boolean) body.get("isPrimary");

        EmergencyContact contact = emergencyContactService.updateContact(
                userPrincipal.getId(), id, name, mobile, relationship, isPrimary);

        Map<String, Object> data = new HashMap<>();
        data.put("contact", contact);
        data.put("message", "Emergency contact updated successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        emergencyContactService.deleteContact(userPrincipal.getId(), id);
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Emergency contact deleted successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
