import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
// import ClearOldInternsButton from "../components/ClearOldInterns/ClearOldInternsButton";

const HireNewInterns = () => {
  // State for filter form data
  const [formData, setFormData] = useState({
    institute: "",
    degree: "",
    academicYear: "All",
    internshipPeriod: "",
    workingMode: "",
    role: "",
    startingDate: "",
    skills: [],
  });

  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Configure API Base URL (Vite Environment Variable Support)
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/emails`;

  const api = axios.create({
    baseURL: API_BASE_URL,
  });
  
  // Handle standard input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle multi-select changes for skills
  const handleSkillsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setFormData({ ...formData, skills: selectedOptions });
  };

  // Fetch all interns on component mount
  useEffect(() => {
    fetchInterns();
  }, []);

  // Sync filtered interns when main interns list updates
  useEffect(() => {
    setFilteredInterns(interns);
  }, [interns]);

  // Fetch data from Express/MongoDB Backend
  const fetchInterns = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/all");
      if (response.data.success && Array.isArray(response.data.data)) {
        // Filter out those who are already hired or rejected if needed, 
        // but for now we load everyone as per your original logic
        setInterns(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching interns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic execution
  const handleSubmit = (e) => {
    e.preventDefault();
    const results = interns.filter((intern) => {
      const matchesInstitute =
        formData.institute === "" ||
        (intern.university && intern.university.toLowerCase().includes(formData.institute.toLowerCase()));
        
      const matchesDegree =
        formData.degree === "" ||
        (intern.degree && intern.degree.toLowerCase().includes(formData.degree.toLowerCase()));
        
      const matchesYear =
        formData.academicYear === "All" ||
        formData.academicYear === "" ||
        intern.current_year === formData.academicYear;
        
      const matchesPeriod =
        formData.internshipPeriod === "" ||
        intern.internship_period === formData.internshipPeriod;
        
      const matchesMode =
        formData.workingMode === "" || 
        (intern.working_mode && intern.working_mode.includes(formData.workingMode));
        
      const matchesRole =
        formData.role === "" || 
        (intern.expected_role && intern.expected_role.includes(formData.role));
        
      const matchesDate =
        formData.startingDate === "" ||
        (intern.starting_date && new Date(intern.starting_date) <= new Date(formData.startingDate));
        
      // Skill matching logic (Checks inside the skills object/JSON)
      const matchesSkills =
        formData.skills.length === 0 ||
        (intern.skills && formData.skills.some((skill) =>
          Object.values(intern.skills).flat().some(
            (val) => typeof val === 'string' && val.toLowerCase().includes(skill.toLowerCase())
          )
        ));

      return (
        matchesInstitute && matchesDegree && matchesYear && matchesPeriod &&
        matchesMode && matchesRole && matchesDate && matchesSkills
      );
    });

    setFilteredInterns(results);
  };

  // Update Status to 'Shortlisted'
  const handleHire = async (intern) => {
    try {
      await api.put(`/update-status/${intern._id}`, { status: 'Shortlisted' });
      toast.success(`${intern.name || intern.senderName} has been shortlisted.`);
      
      // Remove from UI after taking action
      const updatedInterns = interns.filter((i) => i._id !== intern._id);
      setInterns(updatedInterns);
      setFilteredInterns(filteredInterns.filter((i) => i._id !== intern._id));
    } catch (error) {
      console.error("Error shortlisting intern:", error);
      toast.error("Failed to shortlist candidate.");
    }
  };

  // Update Status to 'Rejected'
  const handleRemove = async (intern) => {
    if (window.confirm(`Are you sure you want to reject ${intern.name || intern.senderName}?`)) {
      try {
        await api.put(`/update-status/${intern._id}`, { status: 'Rejected' });
        toast.success(`${intern.name || intern.senderName} has been rejected.`);
        
        // Remove from UI after taking action
        const updatedInterns = interns.filter((i) => i._id !== intern._id);
        setInterns(updatedInterns);
        setFilteredInterns(filteredInterns.filter((i) => i._id !== intern._id));
      } catch (error) {
        console.error("Error removing intern:", error);
        toast.error("Failed to remove candidate.");
      }
    }
  };

  // Enhanced AI Filtering Navigation
  const handleEnhancedFiltering = () => {
    // Sort by date before navigating
    const sortedByStartingDate = [...filteredInterns].sort((a, b) => {
      return new Date(b.starting_date) - new Date(a.starting_date);
    });
    
    navigate("/enhanced-filtering", { state: { filteredInterns: sortedByStartingDate } });
  };

  // Check if at least one filter is applied to enable submit button
  const isFilterApplied = () => {
    return (
      formData.institute !== "" || formData.degree !== "" ||
      formData.academicYear !== "All" || formData.internshipPeriod !== "" ||
      formData.workingMode !== "" || formData.role !== "" ||
      formData.startingDate !== "" || formData.skills.length > 0
    );
  };

  // Sort filtered interns by latest starting date (descending)
  const sortedFilteredInterns = [...filteredInterns].sort(
    (a, b) => new Date(b.starting_date) - new Date(a.starting_date)
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12 mt-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#004d99] tracking-tight">
            Filter & Hire Interns
          </h1>
          {/* <ClearOldInternsButton onCleared={fetchInterns} /> */}
        </div>

        {/* Filter Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Educational Institute */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Educational Institute:</label>
              <input
                type="text"
                name="institute"
                value={formData.institute}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. SLIIT, NSBM"
              />
            </div>

            {/* Degree/Course */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Degree/Course:</label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. Software Engineering"
              />
            </div>

            {/* Academic Year */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Current Academic Year:</label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="All">All</option>
                <option value="1st year">1st Year</option>
                <option value="2nd year">2nd Year</option>
                <option value="3rd year">3rd Year</option>
                <option value="4th year">4th Year</option>
              </select>
            </div>

            {/* Internship Period */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Internship Period (months):</label>
              <select
                name="internshipPeriod"
                value={formData.internshipPeriod}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select</option>
                {Array.from({ length: 9 }, (_, i) => i + 3).map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Working Mode */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Working Mode:</label>
              <select
                name="workingMode"
                value={formData.workingMode}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select</option>
                <option value="Work from home">Work from Home</option>
                <option value="Work from office">Work from Office</option>
                <option value="Hybrid (office & home)">Hybrid</option>
              </select>
            </div>

            {/* Role */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Expected Role:</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleInputChange} 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Software Developer (FullStack)">FullStack Developer</option>
                <option value="Software Developer (Backend)">Backend Developer</option>
                <option value="Software Developer (Frontend)">Frontend Developer</option>
                <option value="Software QA Engineer">QA Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Business Analyst">Business Analyst</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                {/* Add other roles as needed */}
              </select>
            </div>

            {/* Starting Date */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Starting Date (On or before):</label>
              <input
                type="date"
                name="startingDate"
                value={formData.startingDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Skills (Multi-select) */}
            <div className="flex flex-col gap-2 lg:col-span-2">
              <label className="text-sm font-bold text-gray-700">Skills (Hold Ctrl/Cmd to select multiple):</label>
              <select
                name="skills"
                multiple
                value={formData.skills}
                onChange={handleSkillsChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-28"
              >
                <option value=".Net">.Net</option>
                <option value="C#">C#</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="React">React</option>
                <option value="Node">Node.js</option>
                <option value="Flutter">Flutter</option>
                <option value="Docker">Docker</option>
                <option value="Kubernetes">Kubernetes</option>
                <option value="TensorFlow">TensorFlow</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex flex-col md:flex-row gap-4 justify-end border-t border-gray-100 pt-6">
            <button
              type="button"
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 w-full md:w-auto"
              onClick={handleEnhancedFiltering}
            >
              ✨ Enhanced AI Filtering
            </button>
            <button
              type="submit"
              disabled={!isFilterApplied()}
              className={`px-8 py-3 font-bold rounded-lg shadow-md transition-all transform w-full md:w-auto ${
                !isFilterApplied() 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-[#004d99] hover:from-blue-700 hover:to-[#003366] text-white hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              Apply Filters
            </button>
          </div>
        </form>

        {/* Results Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#004d99] mb-6 border-b border-gray-100 pb-4">
            Filtered Candidates <span className="text-gray-500 text-lg font-medium ml-2">({filteredInterns.length})</span>
          </h2>
          
          {isLoading ? (
             <div className="flex justify-center items-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004d99]"></div>
             </div>
          ) : filteredInterns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {sortedFilteredInterns.map((intern) => (
                <div key={intern._id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                  
                  {/* CV Thumbnail Link */}
                  <a
                    href={intern.cv_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gradient-to-br from-blue-500 to-[#004d99] h-32 relative flex items-center justify-center text-white text-xl font-bold uppercase tracking-widest overflow-hidden group-hover:opacity-90 transition-opacity"
                  >
                    <span className="z-10 group-hover:scale-110 transition-transform">📄 View CV</span>
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </a>

                  {/* Intern Details */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-1">{intern.name || intern.senderName}</h3>
                    <p className="text-sm font-medium text-blue-600 mb-4 line-clamp-1">{intern.degree || "Course N/A"} • {intern.university || "Uni N/A"}</p>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-6 bg-white p-4 rounded-lg border border-gray-100">
                      <p><strong className="text-gray-800 w-24 inline-block">Year:</strong> {intern.current_year || "N/A"}</p>
                      <p className="truncate"><strong className="text-gray-800 w-24 inline-block">Email:</strong> {intern.email || "N/A"}</p>
                      <p><strong className="text-gray-800 w-24 inline-block">Phone:</strong> {intern.contact_no || "N/A"}</p>
                      <p><strong className="text-gray-800 w-24 inline-block">Start Date:</strong> {intern.starting_date || "N/A"}</p>
                      <p><strong className="text-gray-800 w-24 inline-block">Duration:</strong> {intern.internship_period ? `${intern.internship_period} Months` : "N/A"}</p>
                      <p><strong className="text-gray-800 w-24 inline-block">Mode:</strong> {intern.working_mode?.join(", ") || "N/A"}</p>
                      <p className="line-clamp-1"><strong className="text-gray-800 w-24 inline-block">Role:</strong> {intern.expected_role?.join(", ") || "N/A"}</p>
                    </div>

                    {/* Skills Badges */}
                    <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                      {intern.skills && typeof intern.skills === 'object' ? (
                        Object.values(intern.skills).flat().slice(0, 5).map((skill, i) => (
                          <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-md font-semibold border border-blue-200">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No skills extracted</span>
                      )}
                      {intern.skills && Object.values(intern.skills).flat().length > 5 && (
                        <span className="text-xs text-gray-500 font-medium py-1">+{Object.values(intern.skills).flat().length - 5} more</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button 
                        className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold py-2 rounded-lg transition-colors"
                        onClick={() => handleRemove(intern)}
                      >
                        Reject
                      </button>
                      <button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        onClick={() => handleHire(intern)}
                      >
                        Shortlist
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <span className="text-5xl opacity-50 mb-4 block">🔍</span>
              <p className="text-lg text-gray-600 font-medium">No interns match the selected filtering criteria.</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting or clearing your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HireNewInterns;