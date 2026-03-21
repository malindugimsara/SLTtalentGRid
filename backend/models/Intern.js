import mongoose from "mongoose";

const internSchema = new mongoose.Schema({
    
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    subject: { type: String },
    body: { type: String },
    receivedDate: { type: Date, default: Date.now },
    
    
    degree: { type: String },
    university: { type: String },
    current_year: { type: String },
    internship_period: { type: String },
    working_mode: [{ type: String }], // Array e.g., ['Online', 'Hybrid']
    expected_role: [{ type: String }],
    starting_date: { type: String },
    contact_no: { type: String },
    skills: { type: mongoose.Schema.Types.Mixed }, 
    statement: { type: String },
    
    
    cv_link: { type: String },
    cv_extracted_text: { type: String }, 

    
    status: { 
        type: String, 
        default: 'Pending',
        enum: ['Pending', 'Shortlisted', 'Hired', 'Rejected'] 
    },

  
    deadline_date: { type: Date },
    start_date: { type: Date },
    end_date: { type: Date },
    is_verified: { type: Boolean, default: false },
    is_accepted: { type: Boolean, default: false },
    email_subject: { type: String },
    email_body: { type: String }

}, { timestamps: true });

const Intern = mongoose.model("Intern", internSchema);
export default Intern;