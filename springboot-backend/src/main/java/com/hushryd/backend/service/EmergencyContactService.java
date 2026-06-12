package com.hushryd.backend.service;

import com.hushryd.backend.entity.EmergencyContact;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.repository.EmergencyContactRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EmergencyContactService {

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    public List<EmergencyContact> getContacts(String userId) {
        return emergencyContactRepository.findByUserId(userId);
    }

    @Transactional
    public EmergencyContact addContact(String userId, String name, String mobile, String relationship, Boolean isPrimaryRequest) {
        if (name == null || name.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Name is required");
        }
        if (mobile == null || mobile.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Mobile number is required");
        }

        String cleanMobile = mobile.replaceAll("\\D", "");
        if (cleanMobile.length() < 10) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid mobile number");
        }
        String formattedMobile = cleanMobile.length() == 10 ? "+91" + cleanMobile : mobile;

        Optional<EmergencyContact> existing = emergencyContactRepository.findByUserIdAndMobile(userId, formattedMobile);
        if (existing.isPresent()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Emergency contact with this mobile number already exists");
        }

        List<EmergencyContact> existingContacts = emergencyContactRepository.findByUserId(userId);
        boolean isPrimary = existingContacts.isEmpty() || Boolean.TRUE.equals(isPrimaryRequest);

        if (isPrimary) {
            // Unset other primary contacts
            for (EmergencyContact contact : existingContacts) {
                if (Boolean.TRUE.equals(contact.getIsPrimary())) {
                    contact.setIsPrimary(false);
                    emergencyContactRepository.save(contact);
                }
            }
        }

        EmergencyContact contact = EmergencyContact.builder()
                .userId(userId)
                .name(name.trim())
                .mobile(formattedMobile)
                .relationship(relationship)
                .isPrimary(isPrimary)
                .build();

        return emergencyContactRepository.save(contact);
    }

    @Transactional
    public EmergencyContact updateContact(String userId, String contactId, String name, String mobile, String relationship, Boolean isPrimaryRequest) {
        EmergencyContact contact = emergencyContactRepository.findById(contactId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Emergency contact not found"));

        if (!contact.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Unauthorized");
        }

        if (mobile != null) {
            String cleanMobile = mobile.replaceAll("\\D", "");
            if (cleanMobile.length() < 10) {
                throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid mobile number");
            }
            String formattedMobile = cleanMobile.length() == 10 ? "+91" + cleanMobile : mobile;

            Optional<EmergencyContact> existing = emergencyContactRepository.findByUserIdAndMobile(userId, formattedMobile);
            if (existing.isPresent() && !existing.get().getId().equals(contactId)) {
                throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Emergency contact with this mobile number already exists");
            }
            contact.setMobile(formattedMobile);
        }

        if (name != null) {
            contact.setName(name.trim());
        }
        if (relationship != null) {
            contact.setRelationship(relationship);
        }

        if (Boolean.TRUE.equals(isPrimaryRequest)) {
            List<EmergencyContact> existingContacts = emergencyContactRepository.findByUserId(userId);
            for (EmergencyContact ec : existingContacts) {
                if (!ec.getId().equals(contactId) && Boolean.TRUE.equals(ec.getIsPrimary())) {
                    ec.setIsPrimary(false);
                    emergencyContactRepository.save(ec);
                }
            }
            contact.setIsPrimary(true);
        }

        return emergencyContactRepository.save(contact);
    }

    @Transactional
    public void deleteContact(String userId, String contactId) {
        EmergencyContact contact = emergencyContactRepository.findById(contactId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Emergency contact not found"));

        if (!contact.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Unauthorized");
        }

        emergencyContactRepository.delete(contact);
    }
}
