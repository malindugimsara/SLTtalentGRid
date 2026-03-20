import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const HiredInterns = () => {
  // State for pending and active interns
  const [pendingInterns, setPendingInterns] = useState([]);
  const [activeInterns, setActiveInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for search and filters
  const [pendingSearchTerm, setPendingSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  
  // State for modals
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [startDate, setStartDate] = useState("");
  
  // Fetch data on mount
  useEffect(() => {
    fetchHiredInterns();
  }, []);
  
  // API Configuration (Vite environment variables)
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/emails`;

  const api = axios.create({
    baseURL: API_BASE_URL,
  });

  // Fetch interns based on status
  const fetchHiredInterns = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch pending interns
      const pendingResponse = await api.get("/hired-interns", {
        params: { status: "pending" }
      });
      setPendingInterns(pendingResponse.data.hired_interns || []);
      
      // Fetch active interns
      const activeResponse = await api.get("/hired-interns", {
        params: { status: "active" }
      });
      setActiveInterns(activeResponse.data.hired_interns || []);
      
    } catch (error) {
      console.error("Error fetching hired interns:", error);
      setError("Failed to load hired interns. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Verify Documents
  const handleVerifyIntern = async (intern) => {
    try {
      await api.post(`/hired-interns/${intern._id}/verify`, {
        is_verified: true
      });
      
      // Update local state to reflect verification
      const updatedInterns = pendingInterns.map(i => 
        i._id === intern._id ? { ...i, is_verified: true } : i
      );
      setPendingInterns(updatedInterns);
      toast.success(`${intern.name || intern.senderName}'s documents have been verified.`);
      
    } catch (error) {
      console.error("Error verifying intern:", error);
      toast.error(`Failed to verify intern: ${error.message}`);
    }
  };

  // Modal Handlers
  const openStartDateModal = (intern) => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setSelectedIntern(intern);
    setShowStartDateModal(true);
  };

  const closeStartDateModal = () => {
    setShowStartDateModal(false);
    setSelectedIntern(null);
  };

  // Accept Intern & Set Start Date
  const handleAcceptIntern = async () => {
    if (!selectedIntern || !startDate) return;
    
    try {
      const response = await api.post(`/hired-interns/${selectedIntern._id}/accept`, {
        start_date: startDate
      });
      
      const data = response.data;
      
      // Remove intern from pending list
      const updatedPendingInterns = pendingInterns.filter(i => i._id !== selectedIntern._id);
      setPendingInterns(updatedPendingInterns);
      
      // Add intern to active list
      const acceptedIntern = {
        ...selectedIntern,
        is_accepted: true,
        start_date: startDate,
        end_date: data.end_date
      };
      
      setActiveInterns([...activeInterns, acceptedIntern]);
      toast.success(`${selectedIntern.name || selectedIntern.senderName} has been accepted to start on ${startDate}.`);
      closeStartDateModal();
      
    } catch (error) {
      console.error("Error accepting intern:", error);
      toast.error(`Failed to accept intern: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Search & Filter Handlers
  const handleDateFilter = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (date) {
      try {
        setLoading(true);
        const response = await api.get("/hired-interns", {
          params: { status: "active", date: date }
        });
        setActiveInterns(response.data.hired_interns || []);
      } catch (error) {
        console.error("Error filtering by date:", error);
        setError("Failed to filter interns by date.");
      } finally {
        setLoading(false);
      }
    } else {
      fetchHiredInterns();
    }
  };

  // Local filtering based on search inputs
  const filteredPendingInterns = pendingSearchTerm 
    ? pendingInterns.filter(intern => 
        (intern.name || intern.senderName || "").toLowerCase().includes(pendingSearchTerm.toLowerCase())
      )
    : pendingInterns;
  
  const filteredActiveInterns = activeSearchTerm 
    ? activeInterns.filter(intern => 
        (intern.name || intern.senderName || "").toLowerCase().includes(activeSearchTerm.toLowerCase())
      )
    : activeInterns;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12 flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        
        {/* Page Header */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#004d99] mb-2 tracking-tight">
            Hired Interns Management
          </h1>
          <p className="text-gray-500 text-lg">Verify documents, set start dates, and track active interns</p>
        </div>
        
        {loading && pendingInterns.length === 0 && activeInterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004d99] mb-4"></div>
             <p className="text-gray-500 font-medium">Loading intern data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mx-auto max-w-2xl mb-8">
            <p className="text-red-700 font-medium text-center">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Pending Document Verification Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Section Header */}
              <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-amber-500">⏳</span> Pending Document Verification
                </h2>
                <div className="relative w-full md:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search pending interns..."
                    value={pendingSearchTerm}
                    onChange={(e) => setPendingSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                  />
                </div>
              </div>
              
              {/* Pending Table */}
              {filteredPendingInterns.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p className="text-lg">No pending interns found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">University & Course</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Deadline</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPendingInterns.map((intern) => (
                        <tr key={intern._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800">{intern.name || intern.senderName}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{intern.degree || "N/A"}</div>
                            <div className="text-xs text-gray-500">{intern.university || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div>{intern.contact_no || "N/A"}</div>
                            <div className="text-xs text-blue-600 truncate w-32" title={intern.email}>{intern.email || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">{intern.document_deadline || "N/A"}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              intern.is_verified 
                                ? "bg-green-100 text-green-800 border border-green-200" 
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}>
                              {intern.is_verified ? "Verified" : "Awaiting Docs"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {!intern.is_verified ? (
                              <button 
                                onClick={() => handleVerifyIntern(intern)}
                                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-all"
                              >
                                Verify Documents
                              </button>
                            ) : (
                              <button 
                                onClick={() => openStartDateModal(intern)}
                                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                Set Start Date
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Active Interns Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Section Header */}
              <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-green-500">✅</span> Active Interns
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search active interns..."
                        value={activeSearchTerm}
                        onChange={(e) => setActiveSearchTerm(e.target.value)} // 👈 Meka danna
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleDateFilter}
                      className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1"
                    />
                    {selectedDate && (
                      <button 
                        onClick={() => { setSelectedDate(""); fetchHiredInterns(); }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Active Table */}
              {filteredActiveInterns.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p className="text-lg">No active interns found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">University</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Period</th>
                        <th className="px-6 py-4 bg-green-50/50">Start Date</th>
                        <th className="px-6 py-4 bg-red-50/50">End Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredActiveInterns.map((intern) => (
                        <tr key={intern._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800">{intern.name || intern.senderName}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{intern.degree || "N/A"}</div>
                            <div className="text-xs text-gray-500">{intern.university || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div>{intern.contact_no || "N/A"}</div>
                            <div className="text-xs text-blue-600 truncate w-32" title={intern.email}>{intern.email || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 font-medium">{intern.internship_period ? `${intern.internship_period} months` : "N/A"}</td>
                          <td className="px-6 py-4 font-bold text-green-700">{intern.start_date || "N/A"}</td>
                          <td className="px-6 py-4 font-bold text-red-600">{intern.end_date || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* ========================================================= */}
      {/* START DATE MODAL (Tailwind) */}
      {/* ========================================================= */}
      {showStartDateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4" onClick={closeStartDateModal}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-extrabold text-[#004d99]">Set Start Date</h2>
              <p className="text-sm text-gray-500 mt-1">
                Confirm the onboarding date for <span className="font-bold text-gray-800">{selectedIntern?.name || selectedIntern?.senderName}</span>
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Select Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
              />
              <p className="text-xs text-gray-500 mt-3">
                *The end date will be calculated automatically based on the intern's requested duration ({selectedIntern?.internship_period || "N/A"} months).
              </p>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={closeStartDateModal}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAcceptIntern}
                disabled={!startDate}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                Confirm & Accept <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default HiredInterns;