



import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../login/apilogin';

const Header = ({ onSidebarToggle }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"))?.user;
  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 18) return "Good Afternoon";
    else return "Good Evening";
  };

  const handleLogout = async () => {
  try {
    await api.post("logout/");   // ✅ call Django logout API
    localStorage.removeItem("user");
    navigate("/");
  } catch (err) {
    console.error("Logout failed:", err.response ? err.response.data : err);
  }
};


  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid #ddd', background: '#fff' }}>
      <img
        src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
        alt="U4rad"
        style={{ height: 40 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <div
          onClick={onSidebarToggle}
          style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'center' }}
        >
          <h2 style={{ fontSize: 18, margin: 0 }}>
            {getGreeting()}, Dr. {firstName} {lastName}
          </h2>
          <img src="https://thumbs.dreamstime.com/z/portrait-confident-young-doctor-white-background-smiling-31417037.jpg" 
          
          alt="Profile" style={{ width: 40, borderRadius: '50%' }} />
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#e53e3e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#c53030')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#e53e3e')}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;
