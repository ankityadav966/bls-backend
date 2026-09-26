import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env';
import { uploadFileToCloudinary } from '../src/config/cloudinary';
import { DocumentModel } from '../src/models/Document.model';
import { logger } from '../src/utils/logger';

async function migrate() {
  try {
    logger.info('[Migration] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('[Migration] MongoDB Connected.');

    const uploadDir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(uploadDir)) {
      logger.info('[Migration] Uploads dir does not exist.');
      return;
    }

    const files = fs.readdirSync(uploadDir).filter(f => f !== '.gitkeep');
    logger.info(`[Migration] Found ${files.length} local files in ${uploadDir}`);

    const urlMapping: Record<string, string> = {};

    for (const filename of files) {
      const fullPath = path.join(uploadDir, filename);
      logger.info(`[Migration] Uploading ${filename} to Cloudinary under folder ${env.CLOUDINARY_FOLDER}...`);
      try {
        const res = await uploadFileToCloudinary(fullPath, 'uploads', false);
        urlMapping[`/uploads/${filename}`] = res.secureUrl;
        logger.info(`[Migration] Uploaded ${filename} -> ${res.secureUrl}`);
      } catch (err: any) {
        logger.error(`[Migration] Error uploading ${filename}:`, err.message);
      }
    }

    // Now update MongoDB documents that reference /uploads/
    const docs = await DocumentModel.find({ filePath: { $regex: '^/uploads/' } });
    logger.info(`[Migration] Found ${docs.length} documents referencing local /uploads/ paths`);

    for (const doc of docs) {
      const matchedUrl = urlMapping[doc.filePath];
      if (matchedUrl) {
        doc.filePath = matchedUrl;
        await doc.save();
        logger.info(`[Migration] Updated Document ${doc.documentId} with Cloudinary URL: ${matchedUrl}`);
      } else {
        // Fallback: upload if file is still there
        const filename = path.basename(doc.filePath);
        const fullPath = path.join(uploadDir, filename);
        if (fs.existsSync(fullPath)) {
          const res = await uploadFileToCloudinary(fullPath, 'uploads', false);
          doc.filePath = res.secureUrl;
          await doc.save();
          logger.info(`[Migration] Uploaded & Updated Document ${doc.documentId} -> ${res.secureUrl}`);
        }
      }
    }

    logger.info('[Migration] Cloudinary Migration Completed Successfully!');
  } catch (error) {
    logger.error('[Migration] Failed:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('[Migration] Disconnected from DB.');
  }
}

migrate();
