import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from './env';
import { logger } from '../utils/logger';
import fs from 'fs';

// Initialize Cloudinary Configuration
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

logger.info(`[Cloudinary] Configured for cloud: ${env.CLOUDINARY_CLOUD_NAME}, default folder: ${env.CLOUDINARY_FOLDER}`);

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  originalFilename?: string;
}

/**
 * Upload a local file to Cloudinary and optionally clean up the local file
 */
export const uploadFileToCloudinary = async (
  filePath: string,
  subfolder: string = '',
  cleanUpLocal: boolean = true
): Promise<CloudinaryUploadResult> => {
  try {
    const targetFolder = subfolder
      ? `${env.CLOUDINARY_FOLDER}/${subfolder}`
      : env.CLOUDINARY_FOLDER;

    let result: UploadApiResponse;
    try {
      result = await cloudinary.uploader.upload(filePath, {
        folder: targetFolder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      });
    } catch (_autoErr) {
      result = await cloudinary.uploader.upload(filePath, {
        folder: targetFolder,
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
      });
    }

    if (cleanUpLocal && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        logger.warn('[Cloudinary] Could not remove temp file after upload:', unlinkErr);
      }
    }

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      originalFilename: result.original_filename,
    };
  } catch (error: any) {
    logger.error('[Cloudinary] Upload failed:', error);
    throw error;
  }
};

/**
 * Upload buffer directly to Cloudinary using upload_stream
 */
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  filename: string,
  subfolder: string = ''
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const targetFolder = subfolder
      ? `${env.CLOUDINARY_FOLDER}/${subfolder}`
      : env.CLOUDINARY_FOLDER;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        resource_type: 'auto',
        filename_override: filename,
        use_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          logger.error('[Cloudinary] Stream upload failed:', error);
          return reject(error);
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          originalFilename: result.original_filename,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

export { cloudinary };
