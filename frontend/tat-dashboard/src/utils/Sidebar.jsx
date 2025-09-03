import React, { useState } from 'react';

const Sidebar = ({ onClose, reportedCases, pendingCases }) => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const sections = [
    {
      title: 'About Me',
      content: 'Expert in CT, MRI, and X-Ray reporting. Dedicated to precision and patient care.'
    },
    {
      title: 'Case Summary',
      content: `Cases Completed: ${reportedCases}\nPending Reports: ${pendingCases}`
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
          src="https://via.placeholder.com/80"
          alt="Doctor"
          style={{
            borderRadius: '50%',
            border: '3px solid #f44336'
          }}
        />
        <h3 style={{ color: '#fff' }}>Dr. Akash</h3>
        <p style={{ color: '#aaa' }}>Senior Radiologist</p>
        <p style={{ color: '#777' }}>U4rad Hospital</p>
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

          {/* Content (only shown when expanded) */}
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
