import React from 'react';

const CaseSummaryCard = ({ label, value, active, onClick }) => (
  <div onClick={onClick} style={{
    flex: '1 1 150px',
    background: active ? '#f44336' : '#fff',
    color: active ? 'white' : 'black',
    borderRadius: 5,
    padding: 5,
    textAlign: 'center',
    cursor: 'pointer',
    boxShadow: '0 0 5px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: 13, fontWeight: 'bold' }}>{value}</div>
    <div>{label}</div>
  </div>
);

export default CaseSummaryCard;
