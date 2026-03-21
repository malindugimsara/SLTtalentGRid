import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";

const NavBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [name, setName] = useState(localStorage.getItem("name") || "");
  

  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Detect changes to localStorage (like login/logout)
  useEffect(() => {
    const updateName = () => {
      setName(localStorage.getItem("name") || "");
    };

    window.addEventListener("storage", updateName);
    return () => window.removeEventListener("storage", updateName);
  }, []);

  const handleSignOut = () => {
    navigate("/");
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#004D99E6] backdrop-blur-md border-b border-[#E0E0E0] shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

        {/* LOGO */}
        <div>
            <img src="/logo.png" alt="logo" className="w-20 md:w-25 lg:w-28 bg-white rounded-full p-2" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-11 items-center absolute left-1/2 transform -translate-x-1/2">
          {[
            { label: "Home", route: "/home" },
            { label: "Get New Interns", route: "/get-new-interns" },
            { label: "Hire New Interns", route: "/hire-new-interns" },
            { label: "Shortlisted Interns", route: "/shortlisted-interns" },
            { label: "Hired Interns", route: "/hired-interns" },
          ].map((item) => (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`text-md font-medium pb-1 transition-all duration-200 ${
                path === item.route
                  ? "text-[#69f5a2] border-b-3 border-[#69f5a2]"
                  : "text-white hover:text-[#69f5a2] hover:border-b-2 hover:border-[#69f5a2]"
              }`}
            >
              {item.label}
            </button>
            
          ))}
        </nav>
        <div className="hidden md:flex w-full justify-end p-4">
            <button
                onClick={handleSignOut}
                className="flex items-center text-white  transition"
            >
                <span className="hover:text-lg">Sign Out</span>
                <FiLogOut className="ml-2 text-lg hover:text-xl" />
            </button>
        </div>

        {/* Sign Out + Mobile Menu */}
        <div className="flex items-center gap-4">
          
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-[#2C3E50] hover:text-[#D16BA5] transition"
          >
            {isMobileMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 bg-white/95 backdrop-blur-lg border-t border-[#E0E0E0] ${
          isMobileMenuOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <nav className="container mx-auto px-4 py-4 space-y-1">
          {[
            { label: "Home", route: "/home" },
            { label: "Get New Interns", route: "/get-new-interns" },
            { label: "Hire New Interns", route: "/hire-new-interns" },
            { label: "Shortlisted Interns", route: "/shortlisted-interns" },
            { label: "Hired Interns", route: "/hired-interns" },
          ].map((item) => (
            <button
              key={item.route}
              onClick={() => {
                navigate(item.route);
                closeMobileMenu();
              }}
              className={`block w-full text-left py-3 px-4 rounded-lg text-lg font-medium transition-all ${
                path === item.route
                  ? "text-[#00B4EB] bg-[#F8F9FA] border-l-4 border-[#008001]"
                  : "text-[#1E1E1E] hover:text-[#D16BA5] hover:bg-[#F8F9FA] hover:border-l-4 hover:border-[#D16BA5]"
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => {
              handleSignOut();
              closeMobileMenu();
            }}
            className="w-full flex items-center justify-center bg-[#00B4EB] hover:bg-[#F7C553] text-[#1E1E1E] py-3 px-4 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-1"
          >
            <FiLogOut className="mr-2 text-lg" /> Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
