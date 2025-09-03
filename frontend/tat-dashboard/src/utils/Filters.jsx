import React from 'react';

const Filters = ({ searchTerm, setSearchTerm, selectedModality, setSelectedModality, selectedDate, setSelectedDate }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search patients..."
      style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
    />

    <select value={selectedModality} onChange={(e) => setSelectedModality(e.target.value)} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}>
      <option value="All">All Modalities</option>
      <option value="CT">CT</option>
      <option value="DX">DX</option>
      <option value="MRI">MRI</option>
      <option value="USG">USG</option>
    </select>

    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      style={{ padding: '10px 15px', border: '1px solid #ccc', borderRadius: 8 }}
    />
  </div>
);

export default Filters;
