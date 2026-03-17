export default function Footer() {
    return (
        <div>
            {/* Footer */}
            <footer className="bg-[#0B1C2C] text-gray-300 mt-10">

                {/* Top Section */}
                <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                    
                    {/* Column 1: Brand */}
                    <div>
                    <h2 className="text-2xl font-bold mb-3">
                        <span className="text-blue-500">SLT</span>
                        <span className="text-green-500">MOBITEL</span>
                    </h2>
                    <h4 className="text-lg font-semibold mb-3 text-white">
                        Intern Hiring System
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-400">
                        Streamlining the recruitment process to find the best young talent 
                        for Sri Lanka's National ICT Solutions Provider.
                    </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                    <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#dashboard" className="hover:text-white transition">Dashboard</a></li>
                        <li><a href="#applications" className="hover:text-white transition">All Applications</a></li>
                        <li><a href="#shortlisted" className="hover:text-white transition">Shortlisted Candidates</a></li>
                        <li><a href="#hired" className="hover:text-white transition">Hired Interns</a></li>
                    </ul>
                    </div>

                    {/* Column 3: Support */}
                    <div>
                    <h4 className="text-white font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#guidelines" className="hover:text-white transition">Hiring Guidelines</a></li>
                        <li><a href="#faq" className="hover:text-white transition">System FAQ</a></li>
                        <li><a href="#report" className="hover:text-white transition">Report an Issue</a></li>
                        <li><a href="#admin" className="hover:text-white transition">Admin Portal</a></li>
                    </ul>
                    </div>

                    {/* Column 4: Contact */}
                    <div>
                    <h4 className="text-white font-semibold mb-4">Contact HR</h4>
                    
                    <div className="space-y-3 text-sm text-gray-400">
                        <div className="flex items-start gap-2">
                        <span>📧</span>
                        <span>internships@sltmobitel.lk</span>
                        </div>

                        <div className="flex items-start gap-2">
                        <span>📞</span>
                        <span>+94 11 2 021 000</span>
                        </div>

                        <div className="flex items-start gap-2">
                        <span>🏢</span>
                        <span>
                            Lotus Road, Colombo 01,<br />
                            Sri Lanka
                        </span>
                        </div>
                    </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-400">
                    
                    <p>
                        © {new Date().getFullYear()} SLT Mobitel. All rights reserved.
                    </p>

                    <div className="flex items-center gap-3">
                        <a href="#privacy" className="hover:text-white transition">Privacy Policy</a>
                        <span>|</span>
                        <a href="#terms" className="hover:text-white transition">Terms of Service</a>
                    </div>

                    </div>
                </div>

            </footer>   

        </div>
    );
}