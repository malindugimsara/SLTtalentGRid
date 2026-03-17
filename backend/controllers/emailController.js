import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import Intern from '../models/Intern.js';

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

        // UNSEEN (unread) emails witarak gannawa
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { bodies: [''], markSeen: true }; 

        const messages = await connection.search(searchCriteria, fetchOptions);
        let newApplications = [];

        for (let item of messages) {
            const all = item.parts.find(part => part.which === '');
            const id = item.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            
            const mail = await simpleParser(idHeader + all.body);
            
            // Extract sender name properly
            const senderName = mail.from && mail.from.value[0] ? mail.from.value[0].name || 'Unknown' : 'Unknown';
            const senderEmail = mail.from && mail.from.value[0] ? mail.from.value[0].address : 'Unknown';

            // Check if email already exists to prevent duplicates (optional but recommended)
            const existingIntern = await Intern.findOne({ senderEmail: senderEmail, subject: mail.subject });
            
            if (!existingIntern) {
                const newIntern = new Intern({
                    senderName: senderName,
                    senderEmail: senderEmail,
                    subject: mail.subject,
                    body: mail.text,
                    receivedDate: mail.date
                });

                await newIntern.save();
                newApplications.push(newIntern);
            }
        }

        connection.end();
        res.status(200).json({ 
            success: true, 
            message: `${newApplications.length} new applications fetched successfully!`, 
            data: newApplications 
        });

    } catch (error) {
        console.error("Error fetching emails: ", error);
        res.status(500).json({ success: false, message: 'Failed to fetch emails', error: error.message });
    }
};

export default {
    fetchEmails
};