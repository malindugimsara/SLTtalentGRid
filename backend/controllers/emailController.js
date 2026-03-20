import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import Intern from '../models/Intern.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules wala __dirname hadaganna me lines deka oni wenawa
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from "dotenv";
dotenv.config();

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

export const fetchEmails = async (req, res) => {
    const config = {
        imap: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_APP_PASSWORD,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
            authTimeout: 3000
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['ALL'];
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

            // check duplicate  
            const existingIntern = await Intern.findOne({ email: fallbackEmail, subject: mail.subject });
            
            if (!existingIntern) {
                let cvLink = '';
                let cvExtractedText = '';

                // check attachment 
                if (mail.attachments && mail.attachments.length > 0) {
                    const pdfAttachment = mail.attachments.find(att => att.contentType === 'application/pdf' || att.filename.endsWith('.pdf'));
                    
                    if (pdfAttachment) {
                        const fileName = `${Date.now()}_${pdfAttachment.filename.replace(/\s+/g, '_')}`;
                        
                        // 1. Upload Supabase Storage 
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
                            // 2. get the Public URL 
                            const { data: publicUrlData } = supabase
                                .storage
                                .from('images')
                                .getPublicUrl(fileName);

                            cvLink = publicUrlData.publicUrl; 
                        }

                        // 3. extract the text in PDF instead AI
                        try {
                            const pdfData = await pdfParse(pdfAttachment.content);
                            cvExtractedText = pdfData.text;
                        } catch (err) {
                            console.error("PDF extraction error:", err);
                        }
                    }
                }

                const extractedData = {
                    name: extractField(/Name:\s*(.*)/i, bodyText) || fallbackName,
                    email: extractField(/Email:\s*(.*)/i, bodyText) || fallbackEmail,
                    degree: extractField(/Course:\s*(.*)/i, bodyText),
                    university: extractField(/Institute:\s*(.*)/i, bodyText),
                    current_year: extractField(/Current Year:\s*(.*)/i, bodyText),
                    internship_period: extractField(/Internship Period:\s*(.*)/i, bodyText),
                    working_mode: extractArray(/Working Mode:\s*(\[.*\])/i, bodyText),
                    expected_role: extractArray(/Expected Role:\s*(\[.*\])/i, bodyText),
                    starting_date: extractField(/Starting Date:\s*(.*)/i, bodyText),
                    contact_no: extractField(/Contact No:\s*(.*)/i, bodyText),
                    statement: extractField(/Statement:\s*(.*)/i, bodyText),
                };

                const newIntern = new Intern({
                    senderName: fallbackName,
                    senderEmail: fallbackEmail,
                    subject: mail.subject,
                    body: bodyText,
                    receivedDate: mail.date || new Date(),
                    cv_link: cvLink, 
                    cv_extracted_text: cvExtractedText,
                    ...extractedData
                });

                await newIntern.save();
                newApplications.push(newIntern);
            }
        }

        connection.end();
        res.status(200).json({ 
            success: true, 
            message: `${newApplications.length} new applications fetched and files saved to Supabase!`, 
            data: newApplications 
        });

    } catch (error) {
        console.error("Error fetching emails: ", error);
        res.status(500).json({ success: false, message: 'Failed to fetch emails', error: error.message });
    }
};

// 1. get the all interns 
export const getAllInterns = async (req, res) => {
    try {
        
        const interns = await Intern.find().sort({ receivedDate: -1 });
        
        res.status(200).json({ 
            success: true, 
            count: interns.length,
            data: interns 
        });
    } catch (error) {
        console.error("Error fetching interns from DB: ", error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch interns from Database', 
            error: error.message 
        });
    }
};

// 2. update from intern status  (Shortlist / Reject / Hired)
export const updateInternStatus = async (req, res) => {
    try {
        const internId = req.params.id; 
        const { status } = req.body;    

        const validStatuses = ['Pending', 'Shortlisted', 'Hired', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const updatedIntern = await Intern.findByIdAndUpdate(
            internId, 
            { status: status }, 
            { new: true }
        );

        if (!updatedIntern) {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        res.status(200).json({ 
            success: true, 
            message: `Intern status successfully updated to ${status}`, 
            data: updatedIntern 
        });
    } catch (error) {
        console.error("Error updating status: ", error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update status', 
            error: error.message 
        });
    }
};

// Aluth Function Eka: Email yawala intern wa Hired karana eka
export const hireIntern = async (req, res) => {
    try {
        const internId = req.params.id;
        const { deadline_date, email_subject, email_body, use_default_attachment } = req.body;
        const uploadedFile = req.file; // Multer eken ena file eka

        // 1. Database eken intern wa hoyagannawa
        const intern = await Intern.findById(internId);
        if (!intern) {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        const internEmail = intern.email || intern.senderEmail;

        // 2. Nodemailer Transporter eka hadanawa (Gmail wenuwen)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password eka .env eke thiyenna oni
            }
        });

        // 3. Frontend eken ena Markdown (**bold**) HTML walata convert karanawa
        let htmlBody = email_body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        htmlBody = htmlBody.replace(/\n/g, '<br>'); // Line breaks HTML <br> karanawa

        const fullHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            ${htmlBody}
        </div>
        `;

        // 4. Attachments set karanawa
        let emailAttachments = [];

        if (uploadedFile) {
            // User upload karapu aluth file eka thiyenawa nam
            emailAttachments.push({
                filename: uploadedFile.originalname,
                content: uploadedFile.buffer // Memory eke thiyena file data eka kelinma yawanawa
            });
        } else if (use_default_attachment === 'true') {
            // Default file eka yawanawa nam
            const defaultFilePath = path.join(__dirname, '../attachments/Trainee_Guidelines.pdf');
            if (fs.existsSync(defaultFilePath)) {
                emailAttachments.push({
                    filename: 'Trainee_Guidelines.pdf',
                    path: defaultFilePath
                });
            } else {
                console.warn("Default attachment file not found at:", defaultFilePath);
            }
        }

        // 5. Email eka yawanawa
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: internEmail,
            subject: email_subject,
            text: email_body, // Fallback plain text
            html: fullHtml,   // Format karapu HTML text eka
            attachments: emailAttachments
        };

        await transporter.sendMail(mailOptions);
        console.log(`Hiring email sent successfully to ${internEmail}`);

        // 6. Database eke intern ge status eka saha details update karanawa
        intern.status = 'Hired';
        intern.deadline_date = new Date(deadline_date);
        intern.email_subject = email_subject;
        intern.email_body = email_body;
        intern.is_verified = false;
        intern.is_accepted = false;
        
        await intern.save();

        res.status(200).json({ 
            success: true, 
            message: `Hiring email sent to ${intern.name} successfully!` 
        });

    } catch (error) {
        console.error("Error in hireIntern process:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to complete hiring process', 
            error: error.message 
        });
    }
};

// ==========================================
// HIRED INTERNS MANAGEMENT FUNCTIONS
// ==========================================

// 1. Hired interns lawa ganna (Pending hari Active hari)
export const getHiredInterns = async (req, res) => {
    try {
        const { status, date } = req.query;
        
        // Base query: Status eka 'Hired' wenna oni
        let query = { status: 'Hired' };

        if (status === 'pending') {
            // Pending kiyanne thama accept karala nathi aya
            query.is_accepted = false;
        } else if (status === 'active') {
            // Active kiyanne accept karapu aya
            query.is_accepted = true;
            
            // Date filter ekak ewala thiyenawa nam eka check karanawa
            if (date) {
                query.start_date = date;
            }
        }

        const hiredInterns = await Intern.find(query).sort({ updatedAt: -1 });

        res.status(200).json({ 
            success: true, 
            hired_interns: hiredInterns 
        });
    } catch (error) {
        console.error("Error fetching hired interns:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Documents verify karanna
export const verifyIntern = async (req, res) => {
    try {
        const internId = req.params.id;
        const { is_verified } = req.body;

        const intern = await Intern.findByIdAndUpdate(
            internId,
            { is_verified: is_verified },
            { new: true }
        );

        if (!intern) {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        res.status(200).json({ success: true, message: 'Intern verified successfully', intern });
    } catch (error) {
        console.error("Error verifying intern:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Start date eka set karala Accept karanna
export const acceptIntern = async (req, res) => {
    try {
        const internId = req.params.id;
        const { start_date } = req.body;

        const intern = await Intern.findById(internId);
        if (!intern) {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        // Internship period eka ("6 months" wage) kiyawala End Date eka auto hadanawa
        let months = 6; // Default to 6
        if (intern.internship_period) {
            const match = intern.internship_period.match(/\d+/);
            if (match) months = parseInt(match[0]);
        }

        const endDate = new Date(start_date);
        endDate.setMonth(endDate.getMonth() + months);
        const end_date_str = endDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

        // Database eka update karanawa
        intern.is_accepted = true;
        intern.start_date = start_date;
        intern.end_date = end_date_str;

        await intern.save();

        res.status(200).json({ 
            success: true, 
            message: 'Intern accepted successfully',
            start_date: start_date,
            end_date: end_date_str, 
            intern 
        });
    } catch (error) {
        console.error("Error accepting intern:", error);
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