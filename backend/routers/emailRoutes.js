import express from 'express';
import { fetchEmails } from '../controllers/emailController.js';

const emailrouter = express.Router();

emailrouter.get('/fetch', fetchEmails);

export default emailrouter;