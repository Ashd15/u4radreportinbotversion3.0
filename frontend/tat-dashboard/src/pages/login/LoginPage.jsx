// // // LoginPage.jsx
// // import React, { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import api from "../login/apilogin";

// // const LoginPage = () => {
// //   const navigate = useNavigate();
// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [error, setError] = useState("");

// //   const handleLogin = async (e) => {
// //     e.preventDefault();
// //     setError("");

// //     try {
// //       const response = await api.post("/login/", {
// //         username: email,
// //         password: password,
// //       });

// //       if (response.data.success) {
// //         localStorage.setItem("user", JSON.stringify(response.data));
// //         navigate(response.data.dashboard);
// //       } else {
// //         setError("Login failed");
// //       }
// //     } catch (err) {
// //       setError(err.response?.data?.error || "Something went wrong");
// //     }
// //   };

// //   return (
// //     <div className="flex items-center justify-center min-h-screen bg-gray-100">
// //       <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
// //         <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
// //         <form onSubmit={handleLogin} className="space-y-4">
// //           <input
// //             type="email"
// //             placeholder="Email"
// //             value={email}
// //             onChange={(e) => setEmail(e.target.value)}
// //             className="w-full p-3 border rounded"
// //           />
// //           <input
// //             type="password"
// //             placeholder="Password"
// //             value={password}
// //             onChange={(e) => setPassword(e.target.value)}
// //             className="w-full p-3 border rounded"
// //           />
// //           {error && <p className="text-red-500">{error}</p>}
// //           <button
// //             type="submit"
// //             className="w-full bg-blue-500 text-white p-3 rounded"
// //           >
// //             Login
// //           </button>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // };

// // export default LoginPage;



// // LoginPage.jsx

// // LoginPage.jsx

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Mail, Lock } from "lucide-react";
// import { motion } from "framer-motion";
// import api from "../login/apilogin";

// const LoginPage = () => {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const response = await api.post("/login/", {
//         username: email,
//         password: password,
//       });

//       if (response.data.success) {
//         localStorage.setItem("user", JSON.stringify(response.data));
//         navigate(response.data.dashboard);
//       } else {
//         setError("Login failed");
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || "Something went wrong");
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
//       {/* Animated Background Shapes */}
//       <motion.div
//         className="absolute top-0 left-0 w-72 h-72 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
//         animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
//         transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
//       />
//       <motion.div
//         className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
//         animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
//         transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
//       />

//       {/* Login Card */}
//       <motion.div
//         initial={{ opacity: 0, y: -50 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//         className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-md"
//       >
//         {/* Logo */}
//         <motion.div
//           className="flex justify-center mb-6"
//           whileHover={{ scale: 1.1 }}
//         >
//           <img
//             src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
//             alt="U4RAD Logo"
//             className="h-16 transition-transform duration-500"
//           />
//         </motion.div>

//         <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
//           Welcome to <span className="text-red-600">U4RAD</span>
//         </h2>

//         <form onSubmit={handleLogin} className="space-y-5">
//           {/* Email Input */}
//           <motion.div
//             className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-red-500 bg-white/60"
//             whileFocus={{ scale: 1.02 }}
//           >
//             <Mail className="text-gray-500 mr-2" size={20} />
//             <input
//               type="email"
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full outline-none bg-transparent placeholder-gray-400"
//             />
//           </motion.div>

//           {/* Password Input */}
//           <motion.div
//             className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-red-500 bg-white/60"
//             whileFocus={{ scale: 1.02 }}
//           >
//             <Lock className="text-gray-500 mr-2" size={20} />
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full outline-none bg-transparent placeholder-gray-400"
//             />
//           </motion.div>

//           {/* Error message */}
//           {error && (
//             <p className="text-red-500 text-sm font-medium text-center">
//               {error}
//             </p>
//           )}

//           {/* Submit Button */}
//           <motion.button
//             type="submit"
//             className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold shadow-md transition-all"
//             whileHover={{ scale: 1.03 }}
//             whileTap={{ scale: 0.97 }}
//           >
//             Login
//           </motion.button>
//         </form>

//         {/* Extra Links */}
//         <div className="mt-6 text-center text-sm text-gray-500">
//           <p>
//             Forgot your password?{" "}
//             <span className="text-red-600 hover:underline cursor-pointer">
//               Reset here
//             </span>
//           </p>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default LoginPage;





import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import api from "../login/apilogin";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/login/", {
        username: email,
        password: password,
      });

      if (response.data.success) {
        // Store user info in localStorage
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <motion.div
        className="absolute top-0 left-0 w-72 h-72 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Logo */}
        <motion.div className="flex justify-center mb-6" whileHover={{ scale: 1.1 }}>
          <img
            src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
            alt="U4RAD Logo"
            className="h-16 transition-transform duration-500"
          />
        </motion.div>

        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Welcome to <span className="text-red-600">U4RAD Reporting Platform</span>
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <motion.div
            className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-red-500 bg-white/60"
            whileFocus={{ scale: 1.02 }}
          >
            <Mail className="text-gray-500 mr-2" size={20} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full outline-none bg-transparent placeholder-gray-400"
            />
          </motion.div>

          {/* Password Input */}
          <motion.div
            className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-red-500 bg-white/60"
            whileFocus={{ scale: 1.02 }}
          >
            <Lock className="text-gray-500 mr-2" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full outline-none bg-transparent placeholder-gray-400"
            />
          </motion.div>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm font-medium text-center">{error}</p>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold shadow-md transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Login
          </motion.button>
        </form>

        {/* Extra Links */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Forgot your password?{" "}
            <span className="text-red-600 hover:underline cursor-pointer">
              Reset here
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
