// TODO: Update with proper file validation and progress tracking
import axios from '../api/axios';
import { API_ENDPOINTS, FILE_UPLOAD } from '../constants';

const uploadService = {
  // Upload Single File
  uploadSingle: async (file, onProgress = null) => {
    try {
      // Validate file size
      if (file.size > FILE_UPLOAD.MAX_SIZE) {
        throw new Error(`File size exceeds ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB limit`);
      }

      // Validate file type
      if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(API_ENDPOINTS.UPLOAD_SINGLE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload Multiple Files
  uploadMultiple: async (files, onProgress = null) => {
    try {
      // Validate number of files
      if (files.length > FILE_UPLOAD.MAX_FILES) {
        throw new Error(`Maximum ${FILE_UPLOAD.MAX_FILES} files allowed`);
      }

      // Validate each file
      for (const file of files) {
        if (file.size > FILE_UPLOAD.MAX_SIZE) {
          throw new Error(`File ${file.name} exceeds size limit`);
        }
        if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
          throw new Error(`File ${file.name} has invalid type`);
        }
      }

      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(API_ENDPOINTS.UPLOAD_MULTIPLE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  // Upload Profile Image
  uploadProfileImage: async (file, onProgress = null) => {
    try {
      if (file.size > FILE_UPLOAD.MAX_SIZE) {
        throw new Error('Profile image size exceeds limit');
      }

      if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid image format');
      }

      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post('/api/upload/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },

  // Upload Complaint Evidence
  uploadComplaintEvidence: async (files, complaintId, onProgress = null) => {
    try {
      if (files.length > FILE_UPLOAD.MAX_FILES) {
        throw new Error(`Maximum ${FILE_UPLOAD.MAX_FILES} files allowed`);
      }

      const formData = new FormData();
      files.forEach(file => {
        formData.append('evidence', file);
      });
      formData.append('complaintId', complaintId);

      const response = await axios.post('/api/upload/evidence', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  },

  // Delete File
  deleteFile: async (fileUrl) => {
    try {
      const response = await axios.delete('/api/upload/delete', {
        data: { fileUrl }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Validate File
  validateFile: (file) => {
    const errors = [];

    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      errors.push(`File size exceeds ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB limit`);
    }

    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
      errors.push('Invalid file type. Only images are allowed.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get File Preview URL
  getPreviewUrl: (file) => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return file;
  }
};

export default uploadService;