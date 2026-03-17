import mongoose from "mongoose";

const internSchema = new mongoose.Schema({
    senderName: String,
    senderEmail: String,
    subject: String,
    body: String,
    receivedDate: Date,
    status: { type: String, default: 'Pending' } // Pending, Shortlisted, Hired
});

// module.exports = mongoose.model('Intern', internSchema);

// Create a model from the schema
const Intern = mongoose.model("Intern", internSchema) 
export default Intern;