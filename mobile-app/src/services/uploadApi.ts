import api from './api';
import * as FileSystem from 'expo-file-system/legacy';

export interface UploadResponse {
  url: string;
  key: string;
  message?: string;
}

export const uploadApi = {
  /**
   * Upload a base64 image to S3
   * @param imageUri - File URI from ImagePicker
   * @param documentType - Type of document (aadhar, pan, driving_license, selfie, etc.)
   * @param fileName - Optional file name
   * @returns Upload response with URL and key
   */
  uploadBase64Image: async (
    imageUri: string,
    documentType: string,
    fileName?: string
  ): Promise<UploadResponse> => {
    // Read the file as base64
    let base64Data: string;
    
    if (imageUri.startsWith('file://') || imageUri.startsWith('/')) {
      // Read file as base64 using Expo FileSystem Legacy API
      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists) {
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          // Determine content type from file extension or default to jpeg
          const extension = imageUri.split('.').pop()?.toLowerCase();
          let mimeType = 'image/jpeg';
          if (extension === 'png') mimeType = 'image/png';
          else if (extension === 'webp') mimeType = 'image/webp';

          base64Data = `data:${mimeType};base64,${base64}`;
        } else {
          throw new Error('File does not exist');
        }
      } catch (error: any) {
        console.error('Error reading file:', error);
        throw new Error(`Failed to read image file: ${error.message}`);
      }
    } else {
      // Already a base64 data URI
      base64Data = imageUri;
    }

    const response = await api.post<UploadResponse>('/upload/base64-image', {
      base64: base64Data,
      documentType,
      fileName: fileName || `${documentType}-${Date.now()}.jpg`,
    });

    return response.data;
  },
};

