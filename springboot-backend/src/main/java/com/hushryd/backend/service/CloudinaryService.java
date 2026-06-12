package com.hushryd.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.Map;
import java.util.Base64;

@Service
public class CloudinaryService {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    /**
     * Uploads a base64 encoded image/document to Cloudinary.
     * 
     * @param base64Data The base64 data string (can include the "data:image/..." prefix).
     * @param folderName The target folder in Cloudinary.
     * @param fileName The public ID filename (extension will be stripped).
     * @return The secure URL of the uploaded asset.
     */
    public String uploadBase64(String base64Data, String folderName, String fileName) throws IOException {
        String cleanBase64 = base64Data;
        if (base64Data.contains(",")) {
            cleanBase64 = base64Data.split(",")[1];
        }

        byte[] bytes = Base64.getDecoder().decode(cleanBase64.trim());

        String publicId = fileName;
        if (fileName.contains(".")) {
            publicId = fileName.substring(0, fileName.lastIndexOf('.'));
        }

        Map<?, ?> params = ObjectUtils.asMap(
                "folder", folderName,
                "public_id", publicId,
                "overwrite", true,
                "resource_type", "auto"
        );

        Map<?, ?> uploadResult = cloudinary.uploader().upload(bytes, params);
        return (String) uploadResult.get("secure_url");
    }
}
