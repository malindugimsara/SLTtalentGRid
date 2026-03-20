import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const GetNewInterns = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [selectedIntern, setSelectedIntern] = useState(null);

  const handleFetchEmails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/emails/fetch`
      );

      if (response.data.success) {
        setInterns((prev) => [...response.data.data, ...prev]);

        const now = new Date();
        setLastFetched(now.toLocaleString());

        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast.error("Error fetching new emails.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans mt-15">
      {/* MAIN */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-10">

        {/* HERO */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center p-10 rounded-xl shadow-lg mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Internship Management System
          </h1>
          <p className="text-sm opacity-90">
            Manage and track potential interns
          </p>
        </div>

        {/* ACTION BAR */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleFetchEmails}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold shadow-md transition
            ${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            🔄 {loading ? "Fetching..." : "Fetch New Emails"}
          </button>

          <span className="text-sm text-gray-500 font-medium">
            ⏱️ Last Fetched:{" "}
            {lastFetched ? lastFetched : "Not fetched yet"}
          </span>
        </div>

        {/* CONTENT */}
        {interns.length === 0 ? (
          <div className="bg-white rounded-xl p-14 text-center shadow">
            <div className="text-5xl mb-4">📥</div>
            <h3 className="text-xl font-semibold mb-2">
              No Intern Data Available
            </h3>
            <p className="text-gray-500 text-sm">
              Click the "Fetch Emails" button to retrieve intern applications.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {interns.map((intern, index) => (
              <div
                key={index}
                onClick={() => setSelectedIntern(intern)}
                 className="bg-white p-5 rounded-lg shadow border-l-4 border-blue-600 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition"
              >
                <h4 className="text-lg font-semibold mb-2">
                  {intern.senderName}
                </h4>

                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {intern.senderEmail}
                </p>

                <p className="text-sm text-gray-700">
                  <strong>Subject:</strong> {intern.subject}
                </p>

                <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold bg-gray-200 rounded-full">
                  {intern.status || "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ==== MODAL OVERLAY (Tailwind) ==== */}
            {selectedIntern && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setSelectedIntern(null)}>
                    <div 
                        className="bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#0b3c68] m-0">Application Details</h3>
                            <button 
                                className="text-gray-400 hover:text-red-500 text-3xl leading-none transition-colors" 
                                onClick={() => setSelectedIntern(null)}
                            >
                                &times;
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-600">
                                <p className="mb-1 text-sm"><strong className="text-gray-800">Applicant:</strong> {selectedIntern.senderName}</p>
                                <p className="mb-1 text-sm"><strong className="text-gray-800">Email:</strong> {selectedIntern.senderEmail}</p>
                                <p className="mb-1 text-sm"><strong className="text-gray-800">Subject:</strong> {selectedIntern.subject}</p>
                                <p className="mb-0 text-sm"><strong className="text-gray-800">Received:</strong> {new Date(selectedIntern.receivedDate).toLocaleString()}</p>
                            </div>
                            
                            <h4 className="text-[#0b3c68] font-bold mb-3">Cover Letter / Message:</h4>
                            {/* whitespace-pre-wrap thiyena nisa email eke thiyena paragraphs hariyata pennanawa */}
                            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200 leading-relaxed">
                                {selectedIntern.body || "No message content provided."}
                            </div>
                        </div>
                    </div>
                </div>
            )}
    </div>
  );
};

export default GetNewInterns;