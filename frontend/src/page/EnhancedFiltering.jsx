import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const RankedCV = () => {
  const location = useLocation();
  const { filteredInterns } = location.state || { filteredInterns: [] };

  const [inputText, setInputText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [interns, setInterns] = useState([]);
  const [showContainer, setShowContainer] = useState(false);
  const [loading, setLoading] = useState(false);

  // API Configuration (Vite environment variables)
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/emails`

  const api = axios.create({
    baseURL: API_BASE_URL,
  });

  // Fetch Ranked CVs from AI endpoint
  const fetchRankedCVs = async () => {
    if (!inputText.trim()) {
      setErrorMessage("Please enter a job role or description to search.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      // ⚠️ Note: You need to implement this /rank_cvs endpoint in Node.js
      const { data } = await api.post("/rank_cvs", {
        prompt: inputText,
        filteredInterns,
      });

      if (data.ranked_cvs && data.ranked_cvs.length > 0) {
        setInterns(data.ranked_cvs);
        setShowContainer(true);
      } else {
        setErrorMessage(data.message || "No matching interns found for this description.");
        setInterns([]);
      }
    } catch (err) {
      console.error("Error fetching ranked CVs:", err.response?.data || err.message);
      setErrorMessage("Error fetching ranked CVs. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // Update Status to Shortlisted
  const handleHire = async (intern) => {
    try {
      // Using the new MERN backend endpoint
      const internId = intern._id || intern.cvId; // Fallback based on backend response
      await api.put(`/update-status/${internId}`, { status: 'Shortlisted' });
      
      alert(`${intern.name || "Candidate"} has been shortlisted.`);
      setInterns(interns.filter(i => (i._id || i.cvId) !== internId));
    } catch (err) {
      console.error("Error shortlisting intern:", err.response?.data || err.message);
      alert("Failed to shortlist candidate.");
    }
  };

  // Update Status to Rejected
  const handleRemove = async (intern) => {
    try {
      const internId = intern._id || intern.cvId;
      await api.put(`/update-status/${internId}`, { status: 'Rejected' });
      
      alert(`${intern.name || "Candidate"} has been rejected.`);
      setInterns(interns.filter(i => (i._id || i.cvId) !== internId));
    } catch (err) {
      console.error("Error removing intern:", err.response?.data || err.message);
      alert("Failed to remove candidate.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col ">
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================= */}
        {/* Search Input Area (Animates up when results show) */}
        {/* ========================================= */}
        <div className={`w-full flex flex-col items-center transition-all duration-700 ease-in-out ${showContainer ? 'pt-8 pb-8' : 'pt-32 pb-32 '}`}>
          
          {!showContainer && (
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ">
              <span className="text-5xl mb-4 block">✨</span>
              <h1 className="text-4xl font-extrabold text-[#004d99] mb-3">AI Enhanced CV Filtering</h1>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Describe the exact candidate you are looking for. Our AI will analyze the extracted text from all resumes and rank the best matches.
              </p>
            </div>
          )}

          <div className="w-full max-w-3xl relative z-10 mt-15">
            <div className="relative flex items-center shadow-lg rounded-full overflow-hidden border-2 border-blue-100 bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all">
              <div className="pl-6 text-2xl opacity-50 ">🔍</div>
              <input
                type="text"
                placeholder="e.g. 'I need someone strong in React, Node.js and AWS...'"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchRankedCVs()}
                className="w-full py-5 px-4 text-lg text-gray-700 bg-transparent outline-none placeholder-gray-400"
              />
              <button
                onClick={fetchRankedCVs}
                disabled={loading}
                className="mx-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-[#004d99] hover:from-blue-700 hover:to-[#003366] text-white font-bold rounded-full shadow-md transition-transform transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing...</>
                ) : "Rank CVs"}
              </button>
            </div>
            
            {errorMessage && (
              <div className="absolute -bottom-8 left-0 right-0 text-center text-red-500 font-medium animate-in fade-in zoom-in">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* ========================================= */}
        {/* Results Container */}
        {/* ========================================= */}
        {showContainer && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-10 duration-700 pb-12">
            <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Top Matches <span className="text-blue-600 ml-2">({interns.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {interns.map((intern, index) => {
                // Handle skills mapping properly depending on backend return format
                const allSkills = intern.skills ? 
                  (Array.isArray(intern.skills) ? intern.skills : Object.values(intern.skills).flat()) 
                  : [];
                
                // Determine roles
                const roles = intern.expected_role || intern.possibleJobRoles;
                const rolesArray = Array.isArray(roles) ? roles : (typeof roles === 'string' ? [roles] : []);

                // Determine working mode
                const mode = intern.working_mode || intern.workingMode;
                const modeString = Array.isArray(mode) ? mode.join(", ") : (typeof mode === 'string' ? mode : "N/A");

                return (
                  <div key={index} className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-2 relative group">
                    
                    {/* Rank Badge Header */}
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-3 text-center flex justify-between items-center px-6">
                      <span className="text-white font-black text-lg drop-shadow-md">
                        🏆 Rank #{intern.rank || index + 1}
                      </span>
                      {intern.cv_link || intern.cvLink ? (
                        <a 
                          href={intern.cv_link || intern.cvLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors"
                        >
                          View CV
                        </a>
                      ) : null}
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-[#004d99] mb-4 line-clamp-1">
                        {intern.name || intern.senderName || "Unknown Candidate"}
                      </h3>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="line-clamp-1"><strong className="text-gray-800 w-20 inline-block">Course:</strong> {intern.degree || intern.education || "N/A"}</p>
                        <p className="line-clamp-1"><strong className="text-gray-800 w-20 inline-block">Institute:</strong> {intern.university || intern.institute || "N/A"}</p>
                        <p className="truncate"><strong className="text-gray-800 w-20 inline-block">Email:</strong> {intern.email || intern.senderEmail || "N/A"}</p>
                        <p><strong className="text-gray-800 w-20 inline-block">Phone:</strong> {intern.contact_no || intern.contactNo || "N/A"}</p>
                        <p><strong className="text-gray-800 w-20 inline-block">Period:</strong> {intern.internship_period || intern.internshipPeriod || "N/A"} months</p>
                        <p><strong className="text-gray-800 w-20 inline-block">Mode:</strong> {modeString}</p>
                        {rolesArray.length > 0 && (
                          <p className="line-clamp-1"><strong className="text-gray-800 w-20 inline-block">Roles:</strong> {rolesArray.join(", ")}</p>
                        )}
                      </div>

                      {/* Skills Tags */}
                      {allSkills && allSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-auto mb-6">
                          {allSkills.slice(0, 5).map((skill, skillIndex) => (
                            <span key={skillIndex} className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-md font-semibold border border-amber-100">
                              {skill}
                            </span>
                          ))}
                          {allSkills.length > 5 && (
                            <span className="text-xs text-gray-500 font-medium py-1">+{allSkills.length - 5} more</span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => handleRemove(intern)}
                          className="flex justify-center items-center gap-2 py-2.5 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleHire(intern)}
                          className="flex justify-center items-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                          Shortlist
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankedCV;