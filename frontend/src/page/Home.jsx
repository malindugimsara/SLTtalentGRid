import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col min-h-screen mt-10 bg-gray-200">
      
      {/* Landing Section */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 md:py-16 bg-cover bg-center relative">
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-white/85"></div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl w-full text-center px-2 sm:px-5">
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-4 md:mb-5">
            Welcome to the Intern Hiring System
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-3xl mx-auto mb-8 md:mb-10 px-2">
            Streamline your recruitment process and find the perfect interns for your organization.
          </p>

          {/* Feature Cards */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 mb-10 md:mb-12 mt-10 md:mt-20">
            
            {/* Card 1 */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-sm transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">🔍</div>
              <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-2 md:mb-3">
                Find Candidates
              </h3>
              <p className="text-gray-600 text-sm">
                Search through our database of qualified intern candidates.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-sm transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">📝</div>
              <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-2 md:mb-3">
                Manage Applications
              </h3>
              <p className="text-gray-600 text-sm">
                Track and manage all intern applications in one place.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-sm transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">🤝</div>
              <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-2 md:mb-3">
                Streamline Hiring
              </h3>
              <p className="text-gray-600 text-sm">
                Simplify the entire hiring process from start to finish.
              </p>
            </div>

          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5 w-full max-w-md mx-auto">
            
            <button
              onClick={() => handleNavigation("/get-new-interns")}
              className="w-full sm:w-auto px-6 md:px-8 py-3 bg-blue-600 text-white text-sm md:text-base font-semibold rounded-md transition duration-300 hover:bg-blue-800 hover:-translate-y-1 shadow-md"
            >
              Get New Interns
            </button>

            <button
              onClick={() => handleNavigation("/hire-new-interns")}
              className="w-full sm:w-auto px-6 md:px-8 py-3 border-2 border-blue-600 text-blue-600 text-sm md:text-base font-semibold rounded-md transition duration-300 hover:bg-blue-50 hover:-translate-y-1 shadow-sm"
            >
              Hire New Interns
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;