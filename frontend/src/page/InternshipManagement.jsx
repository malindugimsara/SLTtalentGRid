import React, { useState } from 'react';
import axios from 'axios';
import './InternshipManagement.css'; // Import the external CSS

const InternshipManagement = () => {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastFetched, setLastFetched] = useState(null); // Fix for 'Invalid Date'

    const handleFetchEmails = async () => {
        setLoading(true);
        try {
            // Backend URL eka (localhost:5000 oyage backend port eka kiyala hithanawa)
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/emails/fetch`);
            
            if(response.data.success) {
                // Aluth data array ekata dapu eka pennanna
                setInterns(prevInterns => [...response.data.data, ...prevInterns]);
                
                // Last fetched time eka update karanawa
                const now = new Date();
                setLastFetched(now.toLocaleString());
                
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Error fetching emails:", error);
            alert("Error fetching new emails. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ims-page-container ">
            {/* Header Section */}
            <header className="ims-header">
                <div className="ims-header-logo">
                    <h2>Intern Hiring System</h2>
                </div>
                <nav className="ims-header-nav">
                    <a href="#home">Home</a>
                    <a href="#get-interns">Get New Interns</a>
                    <a href="#hire">Hire New Interns</a>
                    <a href="#shortlisted">Shortlisted Interns</a>
                    <a href="#hired">Hired Interns</a>
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="ims-main-content">
                {/* Hero Banner */}
                <div className="ims-hero">
                    <h1>Internship Management System</h1>
                    <p>Manage and track potential interns</p>
                </div>

                {/* Action Bar */}
                <div className="ims-action-bar">
                    <button 
                        className="ims-fetch-btn" 
                        onClick={handleFetchEmails} 
                        disabled={loading}
                    >
                        {/* Refresh Icon (SVG) */}
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                        </svg>
                        {loading ? 'Fetching...' : 'Fetch New Emails'}
                    </button>
                    <span className="ims-last-fetched">
                        ⏱️ Last Fetched: {lastFetched ? lastFetched : 'Not fetched yet'}
                    </span>
                </div>

                {/* Content Area (Dynamic) */}
                {interns.length === 0 ? (
                    /* Empty State UI */
                    <div className="ims-empty-state">
                        <div className="ims-empty-icon">📥</div>
                        <h3>No Intern Data Available</h3>
                        <p>Click the "Fetch Emails" button to retrieve intern applications.</p>
                    </div>
                ) : (
                    /* Intern Cards Grid */
                    <div className="ims-intern-grid">
                        {interns.map((intern, index) => (
                            <div key={index} className="ims-intern-card">
                                <h4>{intern.senderName}</h4>
                                <p><strong>Email:</strong> {intern.senderEmail}</p>
                                <p><strong>Subject:</strong> {intern.subject}</p>
                                <span className="ims-status-badge">{intern.status || 'Pending'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer Section */}
            <footer className="ims-footer">
                <div className="ims-footer-section">
                    <h2>Intern Hiring System</h2>
                </div>
                <div style={{ display: 'flex', gap: '60px' }}>
                    <div className="ims-footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#home">Home</a></li>
                            <li><a href="#get">Get Interns</a></li>
                            <li><a href="#hire">Hire Interns</a></li>
                        </ul>
                    </div>
                    <div className="ims-footer-section">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#help">Help Center</a></li>
                            <li><a href="#contact">Contact Us</a></li>
                            <li><a href="#faq">FAQ</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
            <div className="ims-footer-bottom">
                &copy; {new Date().getFullYear()} Intern Hiring System. All rights reserved.
            </div>
        </div>
    );
};

export default InternshipManagement;