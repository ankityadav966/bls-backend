import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { upload } from '../middleware/upload.middleware';
import { UserRole } from '../constants';

const router = Router();

router.use(authenticate);

router.post('/upload', (req, res, next) => {
  upload.any()(req, res, (err: any) => {
    if (err) return next(err);
    if (Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
}, DocumentController.uploadDocument);
router.get('/', DocumentController.getDocuments);
router.get('/:id/download', DocumentController.downloadDocument);
router.patch('/:id/review', authorize(UserRole.ADMIN, UserRole.STAFF), DocumentController.reviewDocument);

export default router;
