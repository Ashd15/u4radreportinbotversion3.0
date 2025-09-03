import React from 'react';

const Header = ({ onSidebarToggle }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottom: '1px solid #ddd',
    background: '#fff',
  }}>
    <img
      src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
      alt="U4rad Logo"
      style={{ height: 40 }}
    />
    <div onClick={onSidebarToggle} style={{ display: 'flex', gap: 10, cursor: 'pointer' }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Good Afternoon, Dr. Akash</h2>
      <img src="https://via.placeholder.com/40" alt="Profile" style={{ width: 40, borderRadius: '50%' }} />
    </div>
  </div>
);

export default Header;
