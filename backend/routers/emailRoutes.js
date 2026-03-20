import express from 'express';
import multer from 'multer';
import { acceptIntern, fetchEmails, getAllInterns, getHiredInterns, hireIntern, updateInternStatus, verifyIntern } from '../controllers/emailController.js';
import { rankCVs } from '../controllers/aiController.js';

const emailrouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

emailrouter.get('/fetch', fetchEmails);
emailrouter.get('/all', getAllInterns);
emailrouter.put('/update-status/:id', updateInternStatus);
emailrouter.post('/hire/:id', upload.single('attachment'), hireIntern);
emailrouter.get('/hired-interns', getHiredInterns);
emailrouter.post('/hired-interns/:id/verify', verifyIntern);
emailrouter.post('/hired-interns/:id/accept', acceptIntern);
emailrouter.post('/rank_cvs', rankCVs);
export default emailrouter;