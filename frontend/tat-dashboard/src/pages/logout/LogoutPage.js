import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../login/apilogin";

const LogoutPage = () => {
  const navigate = useNavigate();

  // useEffect(() => {
  //   const logoutUser = async () => {
  //     try {
  //       // Use GET request for logout
  //       // await api.post("logout/");

  //       // Clear local storage
  //       // localStorage.removeItem("user");

  //       // Redirect to login
  //       navigate("/");
  //     } catch (err) {
  //       console.error("Logout failed:", err.response ? err.response.data : err);
  //     }
  //   };

  //   logoutUser();
  // }, [navigate]);


  useEffect(() => {
  const logoutUser = async () => {
    try {
      await api.post("logout/");   // ✅ ensure backend logout is called
      localStorage.removeItem("user");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err.response ? err.response.data : err);
    }
  };

  logoutUser();
}, [navigate]);


  return (
    <div className="flex items-center justify-center min-h-screen text-xl">
      Logging out...
    </div>
  );
};

export default LogoutPage;

