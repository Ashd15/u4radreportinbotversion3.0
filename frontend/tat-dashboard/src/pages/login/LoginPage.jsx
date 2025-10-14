import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Scan, Activity, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import api from "../login/apilogin";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage or prefer-color-scheme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    } else {
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/login/", {
        username: email,
        password: password,
      });

      if (response.data.success) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            user: {
              first_name: response.data.first_name,
              last_name: response.data.last_name,
              username: response.data.username,
              group: response.data.group,
              user_id: response.data.user_id
            },
            dashboard: response.data.dashboard
          })
        );
        navigate(response.data.dashboard);
      } else {
        setError("Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  // Animated Particles Component
  const FloatingParticles = () => (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${
            isDarkMode ? "bg-red-500/30" : "bg-red-400/40"
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );

  // Theme-based styles
  const backgroundStyles = isDarkMode 
    ? "bg-gradient-to-br from-gray-900 via-black to-gray-800"
    : "bg-gradient-to-br from-blue-50 via-white to-gray-100";

  const cardStyles = isDarkMode 
    ? "bg-gray-900 border-gray-700 text-white"
    : "bg-white border-gray-200 text-gray-800";

  const inputStyles = isDarkMode
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-red-400 focus:ring-red-400";

  const errorStyles = isDarkMode
    ? "bg-red-900/50 border-red-800 text-red-300"
    : "bg-red-50 border-red-200 text-red-700";

  const footerTextStyles = isDarkMode
    ? "text-gray-400"
    : "text-gray-600";

  const subtitleStyles = isDarkMode
    ? "text-gray-400"
    : "text-gray-600";

  return (
    <div className={`flex items-center justify-center min-h-screen relative overflow-hidden transition-colors duration-500 ${backgroundStyles}`}>
      {/* Floating Particles */}
      <FloatingParticles />

      {/* Animated Gradient Overlay */}
      <motion.div
        className={`absolute inset-0 ${
          isDarkMode
            ? "bg-[radial-gradient(circle_at_50%_50%,_rgba(220,38,38,0.03),transparent_50%)]"
            : "bg-[radial-gradient(circle_at_50%_50%,_rgba(220,38,38,0.05),transparent_50%)]"
        }`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Theme-based Background Elements */}
      {isDarkMode ? (
        <>
          {/* Dark Mode Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black"></div>
          
          {/* Animated X-ray Scan Lines - Dark */}
          <motion.div
            className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"
            animate={{ y: [0, 64, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Pulsing Heartbeat Animation - Dark */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-red-500 rounded-full opacity-10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.05, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : (
        <>
          {/* Light Mode Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100 via-white to-gray-200"></div>
          
          {/* Animated Scan Lines - Light */}
          <motion.div
            className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"
            animate={{ y: [0, 64, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Pulsing Animation - Light */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-red-400 rounded-full opacity-20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.05, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {/* Medical Monitor Glow */}
      <motion.div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl ${
          isDarkMode 
            ? "bg-red-500 opacity-5" 
            : "bg-red-400 opacity-10"
        }`}
        animate={{ opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Theme Toggle Button */}
      <motion.button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-20 p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
          isDarkMode
            ? "bg-gray-800/80 border-gray-700 text-yellow-400 hover:bg-gray-700/80"
            : "bg-white/80 border-gray-300 text-gray-700 hover:bg-white"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </motion.button>

      {/* Cartoon Character Welcome */}
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className={`absolute right-10 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block ${
          isDarkMode ? "text-white" : "text-gray-800"
        }`}
      >
        {/* Speech Bubble */}
        <motion.div
          className={`relative mb-4 p-4 rounded-2xl max-w-xs ${
            isDarkMode 
              ? "bg-gray-800 border border-gray-700" 
              : "bg-white border border-gray-200 shadow-lg"
          }`}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <p className={`text-sm font-medium ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}>
            Welcome to <span className="text-red-500 font-bold">U4RAD</span> Reporting Platform! 👋
          </p>
          <p className={`text-xs mt-1 ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}>
            Ready to dive into your reports?
          </p>
          
          {/* Speech bubble tail */}
          <div className={`absolute -bottom-2 right-6 w-4 h-4 transform rotate-45 ${
            isDarkMode ? "bg-gray-800 border-r border-b border-gray-700" : "bg-white border-r border-b border-gray-200"
          }`}></div>
        </motion.div>

        {/* Cartoon Doctor Character */}
        

     
      </motion.div>

      {/* Login Card - Medical Monitor Style */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`relative z-10 border rounded-xl shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-md ${cardStyles}`}
        style={{
          boxShadow: isDarkMode 
            ? "0 0 40px rgba(220, 38, 38, 0.1), 0 0 80px rgba(220, 38, 38, 0.05)"
            : "0 0 40px rgba(220, 38, 38, 0.1), 0 0 60px rgba(220, 38, 38, 0.05)"
        }}
      >
        {/* Monitor Top Bar */}
       
       

        {/* Monitor Content */}
        <div className={`p-8 bg-gradient-to-b ${
          isDarkMode ? "from-gray-900 to-black" : "from-white to-gray-50"
        }`}>
          {/* Header with Medical Icons */}
          <motion.div 
            className="flex flex-col items-center mb-8"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                className={`p-3 rounded-lg mr-3 ${
                  isDarkMode ? "bg-red-600" : "bg-red-500"
                }`}
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                whileHover={{ scale: 1.2, rotate: 30 }}
              >
                <Scan className="text-white" size={24} />
              </motion.div>
              <motion.div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-800" : "bg-gray-200"
                }`}
                animate={{ 
                  rotate: [0, -15, 15, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                whileHover={{ scale: 1.2, rotate: -30 }}
              >
                <Activity className={isDarkMode ? "text-red-500" : "text-red-400"} size={24} />
              </motion.div>
            </div>
            
            <motion.img
              src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
              alt="U4RAD Logo"
              className={`h-12 mb-4 ${isDarkMode ? "filter brightness-0 invert" : ""}`}
              animate={{
                y: [0, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            <h2 className={`text-2xl font-bold text-center mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Reporting Platform! 
            </h2>
            <p className={`text-center text-sm ${subtitleStyles}`}>
              Secure Access to Radiology Reporting
            </p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <motion.div
              className="relative group"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.div 
                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Mail className={`group-focus-within:text-red-500 transition-colors ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`} size={20} />
              </motion.div>
              <input
                type="email"
                placeholder="Medical ID / Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 transition-all duration-300 ${inputStyles}`}
              />
              <motion.div
                className={`absolute inset-0 rounded-lg pointer-events-none ${
                  isDarkMode ? "bg-red-500/5" : "bg-red-400/10"
                }`}
                initial={{ opacity: 0 }}
                whileFocus={{ opacity: 1 }}
              />
            </motion.div>

            {/* Password Input */}
            <motion.div
              className="relative group"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.div 
                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                animate={{
                  rotate: [0, -5, 5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Lock className={`group-focus-within:text-red-500 transition-colors ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`} size={20} />
              </motion.div>
              <input
                type="password"
                placeholder="Access Code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 transition-all duration-300 ${inputStyles}`}
              />
              <motion.div
                className={`absolute inset-0 rounded-lg pointer-events-none ${
                  isDarkMode ? "bg-red-500/5" : "bg-red-400/10"
                }`}
                initial={{ opacity: 0 }}
                whileFocus={{ opacity: 1 }}
              />
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border rounded-lg p-3 ${errorStyles}`}
              >
                <p className="text-sm font-medium text-center">{error}</p>
              </motion.div>
            )}

            {/* Login Button */}
            <motion.button
              type="submit"
              className={`w-full text-white py-3 rounded-lg font-semibold shadow-lg transition-all relative overflow-hidden group ${
                isDarkMode
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              }`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: isDarkMode 
                  ? "0 10px 40px rgba(220, 38, 38, 0.4)" 
                  : "0 10px 40px rgba(220, 38, 38, 0.3)"
              }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={{
                  x: ["-200%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut",
                }}
              />
              
              {/* Pulse Effect */}
              <motion.div
                className="absolute inset-0 bg-white/10 rounded-lg"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <span className="relative z-10 flex items-center justify-center">
                <motion.span
                  animate={{
                    letterSpacing: ["0em", "0.05em", "0em"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  ACCESS SYSTEM
                </motion.span>
              </span>
            </motion.button>
          </form>

          {/* Footer Links */}
          <div className={`mt-8 pt-6 border-t ${
            isDarkMode ? "border-gray-800" : "border-gray-200"
          }`}>
            <div className={`text-center text-sm ${footerTextStyles}`}>
              <p className="mb-2">
                Forgot your credentials?{" "}
                <span className={`cursor-pointer transition-colors ${
                  isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-600"
                }`}>
                  Request reset
                </span>
              </p>
              <p className={`text-xs ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}>
                Authorized medical personnel only
              </p>
            </div>
          </div>
        </div>

        {/* Monitor Bottom Glow */}
        <div className={`h-1 bg-gradient-to-r from-transparent ${
          isDarkMode ? "via-red-500" : "via-red-400"
        } to-transparent opacity-30`}></div>
      </motion.div>

      {/* Floating Medical Elements */}
      <motion.div
        className={`absolute top-20 left-20 ${
          isDarkMode ? "text-white/5" : "text-gray-400/20"
        }`}
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        ⚕️
      </motion.div>
      <motion.div
        className={`absolute bottom-20 right-20 ${
          isDarkMode ? "text-white/5" : "text-gray-400/20"
        }`}
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        🩺
      </motion.div>
    </div>
  );
};

export default LoginPage;