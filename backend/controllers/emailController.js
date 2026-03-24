import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import Intern from '../models/Intern.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

dotenv.config();

// Create __dirname in ES Modules 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
const extractField = (regex, text) => {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
};

const extractArray = (regex, text) => {
    const match = text.match(regex);
    if (match) {
        try {
            return JSON.parse(match[1].replace(/'/g, '"'));
        } catch (e) {
            return [match[1].trim()];
        }
    }
    return [];
};

// 1. PDF eken Text eka ganna helper function
const extractTextFromPDF = async (pdfBuffer) => {
    try {
        if (!pdfBuffer) return "";
        const data = await pdfParse(pdfBuffer);
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        return "";
    }
};


const extractInternDataWithAI = async (emailText, cvText) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing in .env file!");
            return null;
        }


        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const prompt = `
        You are an expert HR assistant. Read the following Email Text and CV Text sent by an internship applicant.
        Extract the required information and return ONLY a valid JSON object. Do not add markdown tags like \`\`\`json.
        If a specific detail is not found, set its value to null.

        Required JSON Structure:
        {
            "institute": "University name (e.g., SLIIT, NSBM, UoM)",
            "degree": "Degree program name",
            "academicYear": "e.g., 1st year, 2nd year, 3rd year, 4th year",
            "internshipPeriod": "Number of months (string, e.g., '6')",
            "workingMode": "Work from home OR Work from office OR Hybrid",
            "role": "Expected job role (string, e.g., 'Software Engineer')",
            "startingDate": "YYYY-MM-DD format",
            "skills": ["skill1", "skill2", "skill3"]
        }

        Email Text:
        """${emailText}"""

        CV Text:
        """${cvText}"""
        `;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Google API Direct Error:", data);
            return null;
        }

        let responseText = data.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(responseText);

    } catch (error) {
        console.error("AI Extraction Direct API Error:", error);
        return null; 
    }
};

// 3. Main Fetch Emails Function
export const fetchEmails = async (req, res) => {
    const config = {
        imap: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_APP_PASSWORD,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            authTimeout: 30000,
            connTimeout: 30000,
            tlsOptions: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { bodies: [''], markSeen: true }; 

        const messages = await connection.search(searchCriteria, fetchOptions);
        let newApplications = [];

        for (let item of messages) {
            const all = item.parts.find(part => part.which === '');
            const id = item.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            
            const mail = await simpleParser(idHeader + all.body);
            const bodyText = mail.text || '';
            
            const fallbackName = mail.from && mail.from.value[0] ? mail.from.value[0].name || 'Unknown' : 'Unknown';
            const fallbackEmail = mail.from && mail.from.value[0] ? mail.from.value[0].address : 'Unknown';

            const existingIntern = await Intern.findOne({ email: fallbackEmail, subject: mail.subject });
            
            if (!existingIntern) {
                let cvLink = '';
                let cvExtractedText = '';

                if (mail.attachments && mail.attachments.length > 0) {
                    const pdfAttachment = mail.attachments.find(att => att.contentType === 'application/pdf' || att.filename.endsWith('.pdf'));
                    
                    if (pdfAttachment) {
                        const fileName = `${Date.now()}_${pdfAttachment.filename.replace(/\s+/g, '_')}`;
                        
                        const { data: uploadData, error: uploadError } = await supabase
                            .storage
                            .from('images')
                            .upload(fileName, pdfAttachment.content, {
                                contentType: 'application/pdf',
                                upsert: false
                            });

                        if (uploadError) {
                            console.error("Supabase upload error:", uploadError.message);
                        } else {
                            const { data: publicUrlData } = supabase
                                .storage
                                .from('images')
                                .getPublicUrl(fileName);
                            cvLink = publicUrlData.publicUrl; 
                        }

                        cvExtractedText = await extractTextFromPDF(pdfAttachment.content);
                    }
                }

                const aiData = await extractInternDataWithAI(bodyText, cvExtractedText);

                const newIntern = new Intern({
                    senderName: aiData?.name || fallbackName, 
                    senderEmail: fallbackEmail,
                    subject: mail.subject,
                    body: bodyText,
                    cv_link: cvLink,
                    cv_extracted_text: cvExtractedText,
                    
                    university: aiData?.institute || "N/A",
                    degree: aiData?.degree || "N/A",
                    current_year: aiData?.academicYear || "N/A",
                    internship_period: aiData?.internshipPeriod || null,
                    working_mode: aiData?.workingMode ? [aiData.workingMode] : [],
                    expected_role: aiData?.role ? [aiData.role] : [],
                    starting_date: aiData?.startingDate || null,
                    skills: aiData?.skills || [],
                    
                    status: 'Pending',
                    receivedDate: mail.date || new Date()
                });

                await newIntern.save();
                newApplications.push(newIntern);
            }
        }

        connection.end();
        res.status(200).json({ 
            success: true, 
            message: `${newApplications.length} new applications fetched, AI processed, and saved!`, 
            data: newApplications 
        });

    } catch (error) {
        console.error("Error fetching emails: ", error);
        res.status(500).json({ success: false, message: 'Failed to fetch emails', error: error.message });
    }
};

export const getAllInterns = async (req, res) => {
    try {
        const interns = await Intern.find().sort({ receivedDate: -1 });
        res.status(200).json({ success: true, count: interns.length, data: interns });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch interns from Database', error: error.message });
    }
};

export const updateInternStatus = async (req, res) => {
    try {
        const internId = req.params.id; 
        const { status } = req.body;    
        const validStatuses = ['Pending', 'Shortlisted', 'Hired', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }
        const updatedIntern = await Intern.findByIdAndUpdate(internId, { status: status }, { new: true });
        if (!updatedIntern) return res.status(404).json({ success: false, message: 'Intern not found' });
        res.status(200).json({ success: true, message: `Intern status successfully updated to ${status}`, data: updatedIntern });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

export const hireIntern = async (req, res) => {
    try {
        const internId = req.params.id;
        const { deadline_date, email_subject, email_body, use_default_attachment } = req.body;
        const uploadedFile = req.file; 

        const intern = await Intern.findById(internId);
        if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

        const internEmail = intern.email || intern.senderEmail;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
        });

        let htmlBody = email_body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'); 
        const fullHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${htmlBody}</div>`;

        let emailAttachments = [];
        if (uploadedFile) {
            emailAttachments.push({ filename: uploadedFile.originalname, content: uploadedFile.buffer });
        } else if (use_default_attachment === 'true') {
            const defaultFilePath = path.join(__dirname, '../attachments/Trainee_Guidelines.pdf');
            if (fs.existsSync(defaultFilePath)) {
                emailAttachments.push({ filename: 'Trainee_Guidelines.pdf', path: defaultFilePath });
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: internEmail,
            subject: email_subject,
            text: email_body, 
            html: fullHtml,  
            attachments: emailAttachments
        };

        await transporter.sendMail(mailOptions);
        
        intern.status = 'Hired';
        intern.deadline_date = new Date(deadline_date);
        intern.email_subject = email_subject;
        intern.email_body = email_body;
        intern.is_verified = false;
        intern.is_accepted = false;
        await intern.save();

        res.status(200).json({ success: true, message: `Hiring email sent to ${intern.name || intern.senderName} successfully!` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to complete hiring process', error: error.message });
    }
};

export const getHiredInterns = async (req, res) => {
    try {
        const { status, date } = req.query;
        let query = { status: 'Hired' };
        if (status === 'pending') query.is_accepted = false;
        else if (status === 'active') {
            query.is_accepted = true;
            if (date) query.start_date = date;
        }
        const hiredInterns = await Intern.find(query).sort({ updatedAt: -1 });
        res.status(200).json({ success: true, hired_interns: hiredInterns });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyIntern = async (req, res) => {
    try {
        const internId = req.params.id;
        const { is_verified } = req.body;
        const intern = await Intern.findByIdAndUpdate(internId, { is_verified: is_verified }, { new: true });
        if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
        res.status(200).json({ success: true, message: 'Intern verified successfully', intern });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const acceptIntern = async (req, res) => {
    try {
        const internId = req.params.id;
        const { start_date } = req.body;
        const intern = await Intern.findById(internId);
        if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

        let months = 6;
        if (intern.internship_period) {
            const match = intern.internship_period.match(/\d+/);
            if (match) months = parseInt(match[0]);
        }

        const endDate = new Date(start_date);
        endDate.setMonth(endDate.getMonth() + months);
        const end_date_str = endDate.toISOString().split('T')[0];

        intern.is_accepted = true;
        intern.start_date = start_date;
        intern.end_date = end_date_str;
        await intern.save();

        res.status(200).json({ success: true, message: 'Intern accepted successfully', start_date, end_date: end_date_str, intern });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default { 
    fetchEmails,
    getAllInterns, 
    updateInternStatus,
    hireIntern,
    getHiredInterns, 
    verifyIntern,    
    acceptIntern
 };