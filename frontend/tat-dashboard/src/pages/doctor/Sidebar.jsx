import React, { useState, useEffect } from 'react';
import { fetchPersonalInfo } from './apiConnector'; // adjust path if needed

const Sidebar = ({ onClose }) => {
  const [openSection, setOpenSection] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await fetchPersonalInfo();
        setUserInfo(response.data);
      } catch (error) {
        console.error('Error fetching personal info:', error);
      }
    };
    getUserInfo();
  }, []);

  if (!userInfo) return <div style={{ padding: 20, color: '#fff' }}>Loading...</div>;

  const sections = [
    {
      title: 'About Me',
      content: userInfo.about_me
    },
    {
      title: 'Case Summary',
      content: `Cases Completed: ${userInfo.total_reported}\nPending Reports: ${userInfo.pending_reports || 0}`
    },
    {
      title: 'Payment Summary',
      content: 'Total Earnings: ₹1,25,000\nLast Payment: ₹25,000\nNext Payment Due: 5 Aug 2025'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '320px',
      height: '100%',
      background: '#1e1e1e',
      zIndex: 100,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      overflowY: 'auto'
    }}>
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          alignSelf: 'flex-end',
          background: '#f44336',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '5px 12px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        ✕
      </button>

      {/* Profile */}
      <div style={{
        background: '#2a2a2a',
        borderRadius: 15,
        padding: 20,
        textAlign: 'center'
      }}>
        <img
          // src={userInfo.uploadpicture || 'https://via.placeholder.com/80'}
          src="https://thumbs.dreamstime.com/z/portrait-confident-young-doctor-white-background-smiling-31417037.jpg"
          alt="Doctor"
          style={{
            borderRadius: '50%',
            border: '3px solid #f44336'
          }}
        />
        <h3 style={{ color: '#fff' }}>{userInfo.user.first_name} {userInfo.user.last_name}</h3>
        <p style={{ color: '#aaa' }}>{userInfo.title}</p>
        <p style={{ color: '#777' }}>{userInfo.hospital}</p>
      </div>

      {/* Collapsible Sections */}
      {sections.map((sec, i) => (
        <div
          key={i}
          style={{
            background: '#2a2a2a',
            borderRadius: 15,
            padding: 15,
            color: '#ddd',
            cursor: 'pointer'
          }}
        >
          <h4
            onClick={() => toggleSection(i)}
            style={{
              color: '#f44336',
              margin: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            {sec.title}
            <span style={{ color: '#fff', fontSize: '14px' }}>
              {openSection === i ? '▲' : '▼'}
            </span>
          </h4>

          {openSection === i && (
            <div style={{
              marginTop: 8,
              whiteSpace: 'pre-wrap',
              color: '#bbb',
              fontSize: '14px'
            }}>
              {sec.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
