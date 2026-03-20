import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ShortlistedInterns = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    "Internship Confirmation and Reporting Instructions – SLT Digital Platforms Development Section"
  );
  const [emailBody, setEmailBody] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [defaultFileAttached, setDefaultFileAttached] = useState(true);
  const fileInputRef = useRef(null);

  // Backend URL (Vite Environment Variable Support)
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/emails`

  const api = axios.create({
    baseURL: API_BASE_URL,
  });

  // Default email template
  const defaultEmailBody = `Dear [Intern Name],

**Congratulations!**
You have been selected for a **six-month Software Internship** with the **SLT – Digital Platforms Development Section Refno :SLTDPDS-20250520-08**.
We are excited to welcome you to Sri Lanka Telecom. Please read the following instructions carefully to ensure a smooth onboarding process.

**Reporting Details:**
**Location:** SLT Head Office, Lotus Road, Colombo 01 
**Date:** [SELECTED_DATE] 
**Time:** 9:30 AM

**Documents to Bring (Compulsory for Registration):**
Please bring **all** of the following documents. **Incomplete documentation will not be accepted**, and you will be required to visit the following **Tuesday instead**.
1. **Printed copy of this email**
2. **Your latest CV**
3. **Internship request letter** from your university *(Addressed to: Engineer - Talent Development Section, Sri Lanka Telecom. Must specify a six-month internship period.)*
4. **Police Report**
5. **Signed Trainee Guidelines document**
6. **Photocopy of your National Identity Card (NIC)**

**Visitor Entry Pass**
To arrange your visitor entry pass, please send the following details **within today**:
* Full Name
* NIC Number
* Contact Number
* Laptop Serial Number
Please reply to this email with the required information.

**Important Notice**
You are **required to visit SLT at least once a week** during your internship. If you are unable to meet this commitment, we kindly request that you **do not proceed** with this internship opportunity.

**Trainee Guidelines**
Please read the Trainee Guidelines document thoroughly. If you agree with the terms and conditions, you may proceed with confirming your participation in the internship.

We look forward to having you on board and wish you a rewarding internship experience at SLT!

Best Regards,
**Gayal Jayawardana** Digital Platform Development Section 
SLTMobitel`;

  // Calculate default date (next Tuesday)
  const getDefaultDate = () => {
    const today = new Date();
    const daysUntilNextTuesday = (9 - today.getDay()) % 7; 
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilNextTuesday);
    return nextTuesday.toISOString().split('T')[0];
  };

  // Fetch Shortlisted Interns on load
  useEffect(() => {
    fetchShortlistedInterns();
  }, []);

  // Update modal content when opened
  useEffect(() => {
    if (showEmailModal && selectedIntern) {
      setSelectedDate(getDefaultDate());
      const formattedBody = defaultEmailBody
        .replace("[Intern Name]", selectedIntern.name || selectedIntern.senderName)
        .replace("[SELECTED_DATE]", new Date(getDefaultDate()).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }));
      setEmailBody(formattedBody);
    }
  }, [showEmailModal, selectedIntern]);

  // Update date in email body when date picker changes
  useEffect(() => {
    if (selectedDate && emailBody.includes("[SELECTED_DATE]")) {
      const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      setEmailBody(prev => prev.replace("[SELECTED_DATE]", formattedDate));
    }
  }, [selectedDate]);

  // Fetch data from backend
  const fetchShortlistedInterns = async () => {
    setLoading(true);
    try {
      // Fetch all interns, then filter only the 'Shortlisted' ones
      const response = await api.get("/all");
      if (response.data.success) {
        const shortlisted = response.data.data.filter(intern => intern.status === 'Shortlisted');
        setInterns(shortlisted);
      }
    } catch (error) {
      console.error("Error fetching shortlisted interns:", error);
      setError("Failed to load shortlisted interns. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Change status back to Pending for all shortlisted
  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to remove all candidates from the shortlist?")) return;
    
    try {
      setActionLoading(true);
      // We loop through all current interns and set status back to 'Pending'
      await Promise.all(
        interns.map(intern => api.put(`/update-status/${intern._id}`, { status: 'Pending' }))
      );
      setInterns([]);
      toast.success("All shortlisted interns have been moved back to Pending.");
    } catch (error) {
      console.error("Error clearing shortlisted interns:", error);
      toast.error("Failed to clear shortlisted interns.");
    } finally {
      setActionLoading(false);
    }
  };

  // Change status back to Pending for one intern
  const handleDeleteIntern = async (internId) => {
    if (!window.confirm("Are you sure you want to remove this intern from the shortlist?")) return;

    try {
      await api.put(`/update-status/${internId}`, { status: 'Pending' });
      setInterns(interns.filter(intern => intern._id !== internId));
    } catch (error) {
      console.error("Error removing intern from shortlist:", error);
      toast.error("Failed to remove intern from shortlist.");
    }
  };

  // Modal Handlers
  const openEmailModal = (intern) => {
    setSelectedIntern(intern);
    setShowEmailModal(true);
    setDefaultFileAttached(true);
    setSelectedFile(null);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setSelectedIntern(null);
    setEmailSubject("Internship Confirmation and Reporting Instructions – SLT Digital Platforms Development Section");
    setEmailBody("");
    setSelectedFile(null);
    setDefaultFileAttached(true);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (newDate) {
      const formattedDate = new Date(newDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      setEmailBody(prev => {
        if (prev.includes("[SELECTED_DATE]")) return prev.replace("[SELECTED_DATE]", formattedDate);
        const dateRegex = /\*\*Date:\*\* ([^*\n]+)/;
        return prev.replace(dateRegex, `**Date:** ${formattedDate}`);
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setDefaultFileAttached(false);
    }
  };

  const toggleDefaultFile = () => {
    setDefaultFileAttached(!defaultFileAttached);
    if (defaultFileAttached) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  // Execute Hiring Process
  const handleHireIntern = async () => {
    if (!selectedIntern || !selectedDate) return;
    
    if (!window.confirm(`Are you sure you want to hire ${selectedIntern.name || selectedIntern.senderName}? An email will be sent.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('deadline_date', selectedDate);
      formData.append('email_subject', emailSubject);
      formData.append('email_body', emailBody);
      
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      } else if (defaultFileAttached) {
        formData.append('use_default_attachment', 'true');
      }
      
      // Call the backend route to handle hiring and email sending
      const response = await api.post(`/hire/${selectedIntern._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message || "Intern hired successfully!");
      setInterns(interns.filter(i => i._id !== selectedIntern._id));
      closeEmailModal();
      
    } catch (error) {
      console.error("Error hiring intern:", error);
      toast.error(`Failed to hire intern: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Sort by starting date
  const sortedInterns = [...interns].sort((a, b) => new Date(b.starting_date) - new Date(a.starting_date));

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12 flex flex-col">      
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#004d99] mb-2 tracking-tight">
              Shortlisted Candidates
            </h1>
            <p className="text-gray-500 text-lg">Candidates selected for final review and hiring</p>
          </div>
          {interns.length > 0 && (
            <button 
              onClick={handleClearAll}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear All
            </button>
          )}
        </div>
        
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004d99] mb-4"></div>
             <p className="text-gray-500 font-medium">Loading shortlisted candidates...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mx-auto max-w-2xl">
            <p className="text-red-700 font-medium text-center">{error}</p>
          </div>
        ) : interns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 text-center px-4">
            <span className="text-6xl mb-6 opacity-50 block">⭐</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Shortlisted Candidates Yet</h2>
            <p className="text-gray-500 max-w-md">Go to the 'Hire New Interns' page to review applications and shortlist candidates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedInterns.map((intern) => {
              const allSkills = intern.skills ? Object.values(intern.skills).flat() : [];
              
              return (
                <div key={intern._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-1">
                  
                  {/* Card Header (Green for Shortlisted) */}
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-center">
                    {intern.cv_link ? (
                      <a href={intern.cv_link} target="_blank" rel="noopener noreferrer" className="text-white font-bold tracking-wider uppercase text-sm hover:underline flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        View Original CV
                      </a>
                    ) : (
                      <span className="text-white font-bold tracking-wider uppercase text-sm">Shortlisted Candidate</span>
                    )}
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-[#004d99] mb-4 line-clamp-1">{intern.name || intern.senderName}</h3>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="line-clamp-1"><strong className="text-gray-800 w-24 inline-block">Education:</strong> {intern.degree || "N/A"}</p>
                      <p className="line-clamp-1"><strong className="text-gray-800 w-24 inline-block">University:</strong> {intern.university || "N/A"}</p>
                      <p><strong className="text-gray-800 w-24 inline-block">Contact:</strong> {intern.contact_no || "N/A"}</p>
                      <p className="truncate"><strong className="text-gray-800 w-24 inline-block">Email:</strong> {intern.email || intern.senderEmail}</p>
                      <p><strong className="text-gray-800 w-24 inline-block">Start Date:</strong> {intern.starting_date || "N/A"}</p>
                      <p><strong className="text-gray-800 w-24 inline-block">Duration:</strong> {intern.internship_period ? `${intern.internship_period} months` : "N/A"}</p>
                      <p><strong className="text-gray-800 w-24 inline-block">Mode:</strong> {intern.working_mode?.join(", ") || "N/A"}</p>
                      <p className="line-clamp-1"><strong className="text-gray-800 w-24 inline-block">Roles:</strong> {intern.expected_role?.join(", ") || "N/A"}</p>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mt-auto mb-6">
                      {allSkills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-semibold border border-blue-100">
                          {skill}
                        </span>
                      ))}
                      {allSkills.length > 5 && <span className="text-xs text-gray-500 font-medium py-1">+{allSkills.length - 5} more</span>}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => handleDeleteIntern(intern._id)}
                        className="flex justify-center items-center gap-2 py-2.5 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                      <button 
                        onClick={() => openEmailModal(intern)}
                        className="flex justify-center items-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-[#004d99] hover:from-blue-700 hover:to-[#003366] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
                      >
                        Proceed to Hire
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* EMAIL CUSTOMIZATION MODAL */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6" onClick={closeEmailModal}>
            <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#004d99]">Hire Intern: {selectedIntern?.name || selectedIntern?.senderName}</h2>
                  <p className="text-sm text-gray-500 mt-1">Configure confirmation email and onboarding details</p>
                </div>
                <button onClick={closeEmailModal} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Date Picker */}
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Reporting Date</h3>
                  <p className="text-sm text-gray-600 mb-3">Select the date when the intern should report to the office:</p>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Email Configuration */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Email Subject</h3>
                    <input 
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Email Body</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Use **text** for bold</span>
                    </div>
                    <textarea 
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={14}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed bg-gray-50"
                    />
                  </div>
                </div>

                {/* Attachments */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Attachments</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={defaultFileAttached} 
                        onChange={toggleDefaultFile}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Attach default Trainee Guidelines document</span>
                    </label>
                    
                    <div className={`p-4 rounded-lg border border-dashed transition-colors ${defaultFileAttached ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-white border-blue-300'}`}>
                      <p className="text-sm font-medium text-gray-700 mb-2">Or upload a custom document:</p>
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        disabled={defaultFileAttached}
                        ref={fileInputRef}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed"
                      />
                      {selectedFile && !defaultFileAttached && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          {selectedFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
                <button 
                  onClick={closeEmailModal}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleHireIntern}
                  disabled={!selectedDate || !emailSubject || !emailBody || actionLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {actionLoading ? (
                    <><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending Email...</>
                  ) : (
                    <>Send Email & Hire ✉️</>
                  )}
                </button>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortlistedInterns;