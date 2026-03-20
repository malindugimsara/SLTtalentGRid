import { useState } from "react";
import toast from "react-hot-toast";
import {useLocation, useNavigate } from "react-router-dom";
import { VscLoading } from "react-icons/vsc";

export default function LoginPage() {
  const location = useLocation();
  const initialEmail = location.state?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const navigate = useNavigate();
  const [modalIsOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  function handleLogin() {
    
    // ✅ HARD-CODED CHECK
    if (email === "digitalplatforms@slt.lk" && password === "digitalplatform@456") {
      setShowSpinner(true);
      navigate("/home"); // Go to home page
      toast.success("Login successful!");
    } else {
      setShowSpinner(false);
      toast.error("Invalid email or password");
    }

  }
  
  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-[#F8F9FA]">
      {/* Left Side - Logo Section */}
      <div className="w-full lg:w-1/2 min-h-[25vh] lg:min-h-[40vh] lg:h-screen flex lg:flex-col items-center justify-center gap-4">
        <img src="/logo_loginPage.png" alt="logo" className="w-40 md:w-60 lg:w-140 lg:h-70 ml-5" />
        <h1 className="text-3xl lg:text-5xl mt-5 font-bold text-[#2C3E50]">Intern Hiring System</h1>
        
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex justify-center items-center px-4 py-6 lg:py-0">
        <div className="w-full h-[480px] max-w-[450px] bg-white shadow-lg rounded-2xl flex flex-col justify-center items-center p-10 relative border border-[#E0E0E0]">
          
          {/* Loading Overlay */}
          {showSpinner && (
            <div className="absolute inset-0 bg-[#2C3E50]/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
              <div className="text-center">
                <VscLoading className="text-white text-4xl animate-spin mx-auto mb-3" />
                <p className="text-white text-sm">Signing you in...</p>
              </div>
            </div>
          )}

          <div className="w-full text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50] mb-2">Welcome back!</h1>
            <p className="text-[#2C3E50]/70 text-sm">Please sign in to continue</p>
          </div>

          <div className="w-full space-y-4">
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              value={email}
              placeholder="Email"
              className="w-full h-11 px-4 bg-[#F8F9FA] border border-[#E0E0E0] rounded-lg text-sm text-[#2C3E50] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#48CAE4] transition-all"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              value={password}
              placeholder="Password"
              className="w-full h-11 px-4 bg-[#F8F9FA] border border-[#E0E0E0] rounded-lg text-sm text-[#2C3E50] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D16BA5] transition-all"
            />
          </div>
          <div className="w-full space-y-4">
            <button
              onClick={handleLogin}
              className="w-full h-11 mt-5 bg-gradient-to-r from-[#00B4EB] to-[#008001] hover:from-[#0885ac] hover:to-[#035f04] text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
