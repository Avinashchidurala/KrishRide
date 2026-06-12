import api from './api';

export interface UploadResponse {
  url: string;
  key: string;
  message?: string;
}

export const uploadApi = {
  /**
   * Upload a file to S3 using the backend upload endpoint
   * @param file - File to upload
   * @param documentType - Type of document (aadhar, pan, driving_license, selfie, vehicle_photo, etc.)
   * @param folder - Optional folder path in S3
   * @returns Upload response with URL and key
   */
  uploadFile: async (file: File, documentType: string, folder?: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post<UploadResponse>('/upload/kyc-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Upload multiple files to S3 (for vehicle photos)
   * @param files - Array of files to upload
   * @param photoType - Type of photo (inside or outside)
   * @returns Array of uploaded URLs
   */
  uploadVehiclePhotos: async (files: File[], photoType: 'inside' | 'outside'): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('photos', file);
    });
    formData.append('photoType', photoType);

    const response = await api.post<{ urls: string[]; message: string }>('/upload/vehicle-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.urls;
  },

  /**
   * Get a presigned URL for direct S3 upload (client-side upload)
   * @param fileName - Name of the file
   * @param fileType - MIME type of the file
   * @param folder - Optional folder path in S3
   * @returns Presigned URL and key
   */
  getPresignedUrl: async (
    fileName: string,
    fileType: string,
    folder?: string
  ): Promise<{ presignedUrl: string; key: string; url: string }> => {
    const response = await api.post<{ presignedUrl: string; key: string; url: string }>('/upload/presigned-url', {
      fileName,
      fileType,
      folder,
    });

    return response.data;
  },

  /**
   * Extract S3 key from a full S3 URL
   * @param url - Full S3 URL or key
   * @returns S3 key
   */
  extractS3Key: (url: string): string | null => {
    if (!url) {
      console.warn('extractS3Key: No URL provided');
      return null;
    }
    
    // If it's already a key (no http/https), return as is
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.log('extractS3Key: URL is already a key:', url);
      return url;
    }

    // Extract key from full URL
    try {
      console.log('extractS3Key: Processing URL:', url);
      
      // Handle standard S3 URLs: https://bucket.s3.region.amazonaws.com/key
      // Also handle: https://bucket.s3-region.amazonaws.com/key
      if (url.includes('amazonaws.com/')) {
        const parts = url.split('amazonaws.com/');
        if (parts.length > 1) {
          const key = decodeURIComponent(parts[1].split('?')[0]); // Remove query parameters and decode
          console.log('extractS3Key: Extracted key from amazonaws.com URL:', key);
          return key;
        }
      }
      
      // Handle s3:// URLs
      if (url.startsWith('s3://')) {
        const key = url.replace('s3://', '').split('/').slice(1).join('/');
        console.log('extractS3Key: Extracted key from s3:// URL:', key);
        return key;
      }

      // Handle bucket.s3.region.amazonaws.com or bucket.s3-region.amazonaws.com format
      if (url.includes('s3.') || url.includes('s3-')) {
        try {
          const urlObj = new URL(url);
          const key = decodeURIComponent(urlObj.pathname.substring(1)); // Remove leading slash and decode
          if (key) {
          console.log('extractS3Key: Extracted key from s3. URL:', key);
          return key;
          }
        } catch (urlError) {
          // If URL parsing fails, try manual extraction
          const match = url.match(/s3[.-][^/]+\/(.+)/);
          if (match && match[1]) {
            const key = decodeURIComponent(match[1].split('?')[0]);
            console.log('extractS3Key: Extracted key using regex:', key);
            return key;
          }
        }
      }

      // Try to extract from any URL that might contain a path
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        if (pathname && pathname.length > 1) {
          const key = decodeURIComponent(pathname.substring(1).split('?')[0]);
          console.log('extractS3Key: Extracted key from pathname:', key);
          return key;
        }
      } catch (urlError) {
        console.warn('extractS3Key: Failed to parse URL:', urlError);
      }

      console.warn('extractS3Key: Could not extract key from URL:', url);
      return null;
    } catch (error) {
      console.error('extractS3Key: Error extracting S3 key:', error);
      return null;
    }
  },

  /**
   * Get a presigned URL for viewing a document from S3
   * @param urlOrKey - Full S3 URL or S3 key of the document
   * @returns Presigned URL for viewing the document
   */
  getViewDocumentUrl: async (urlOrKey: string): Promise<{ url: string; expiresIn?: number }> => {
    console.log('getViewDocumentUrl: Input:', urlOrKey);
    
    // Extract key from full URL if needed
    const documentKey = uploadApi.extractS3Key(urlOrKey) || urlOrKey;

    if (!documentKey) {
      console.error('getViewDocumentUrl: Could not extract key from:', urlOrKey);
      throw new Error('Invalid document URL or key. Please check if the document exists.');
    }

    console.log('getViewDocumentUrl: Using key:', documentKey);

    try {
      const response = await api.post<{ url: string; expiresIn: number }>('/upload/view-document-url', {
        key: documentKey,
      });

      console.log('getViewDocumentUrl: Presigned URL generated successfully');
      return { url: response.data.url, expiresIn: response.data.expiresIn };
    } catch (error: any) {
      console.error('getViewDocumentUrl: Error generating presigned URL:', error);
      console.error('getViewDocumentUrl: Error response:', error.response?.data);
      throw error;
    }
  },
};

