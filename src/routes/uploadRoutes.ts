import { Router } from 'express';
import {
    generateUploadUrl,
    saveFile,
    getFiles,
    deleteFile
} from '../controllers/uploadController';
import { validateRequest, rateLimiter } from '../middleware';
import {
    generateSignedUrlSchema,
    saveFileRecordSchema
} from '../middleware/schemas';

const router = Router();

router.use(rateLimiter());

// 1. Generate signed URL for Cloudinary upload
router.post('/generate-upload-url', validateRequest(generateSignedUrlSchema), generateUploadUrl);

// 2. Save file record after successful upload
router.post('/save-file', validateRequest(saveFileRecordSchema), saveFile);

// 3. Get user's files with optional filters
router.get('/files', getFiles);

// 4. Delete file from both Cloudinary and database
router.delete('/files/:id', deleteFile);

export default router;