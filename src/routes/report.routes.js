import { Router } from 'express';
import multer from 'multer';
import { extractReport, normalizeReport, summarizeReport, processReport } from '../controllers/report.controller.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/extract', upload.single('file'), extractReport);
router.post('/normalize', normalizeReport);
router.post('/summarize', summarizeReport);
router.post('/process', upload.single('file'), processReport);

export default router;
