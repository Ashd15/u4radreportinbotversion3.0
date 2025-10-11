import React, { useState, useEffect } from 'react';
import { Download, Sun, Moon, Search } from 'lucide-react';
import apiHandlers from './reviewer_handeler'; // Adjust the path as needed

export default function Reviewer() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedRadiologist, setSelectedRadiologist] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [radiologists, setRadiologists] = useState([]);

  // Get logged-in user info from localStorage (set during login)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedData = JSON.parse(storedUser);
        if (parsedData.user) {
          setCurrentUser(parsedData.user);
        } else {
          console.error('Invalid user data structure');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error parsing user info:', error);
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  // Fetch radiologists and patients on component mount
  useEffect(() => {
    fetchRadiologists();
    fetchPatients();
  }, []);

  const fetchRadiologists = async () => {
    try {
      const data = await apiHandlers.fetchRadiologists();
      setRadiologists(data);
    } catch (err) {
      console.error('Error fetching radiologists:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await apiHandlers.fetchPatients();
      
      const transformedReports = data.map(patient => ({
        id: patient.patient_id,
        dbId: patient.id,
        name: patient.patient_name,
        age: patient.age,
        gender: patient.gender,
        testDate: new Date(patient.recived_on_db).toLocaleDateString('en-GB'),
        reportDate: patient.marked_done_at ? new Date(patient.marked_done_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        status: 'Ready to Go',
        assignedTo: patient.radiologists.length > 0 ? patient.radiologists.join(', ') : 'Unassigned',
        checkImage: patient.notes === "True" ? 'Reported' : 'Pending',
        historyFiles: patient.history_files.length > 0 ? `${patient.history_files.length} files` : 'No History Files',
        reports: patient.patient_reports
      }));

      setReports(transformedReports);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const releasePatient = async (dbId, patientName) => {
    if (!currentUser || !currentUser.username) {
      alert('User information not found. Please login again.');
      return;
    }

    try {
      const result = await apiHandlers.releasePatient(dbId, currentUser.username);
      
      if (result.success) {
        alert(`Patient ${patientName} released successfully!`);
        setReports(prevReports => prevReports.filter(report => report.dbId !== dbId));
      }
    } catch (err) {
      alert(`Error releasing patient: ${err.message}`);
      console.error('Error releasing patient:', err);
    }
  };

  const assignRadiologist = async () => {
    if (!selectedRadiologist) {
      alert('Please select a radiologist first');
      return;
    }

    const selectedPatients = Object.keys(selectedRows).filter(id => selectedRows[id]);
    
    if (selectedPatients.length === 0) {
      alert('Please select at least one patient');
      return;
    }

    try {
      for (const patientId of selectedPatients) {
        const report = reports.find(r => r.id === patientId);
        if (report) {
          await apiHandlers.assignRadiologist(report.dbId, parseInt(selectedRadiologist));
        }
      }

      alert('Radiologist assigned successfully to selected patients!');
      setSelectedRows({});
      setSelectAll(false);
      setSelectedRadiologist('');
      fetchPatients();
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Error assigning radiologist:', err);
    }
  };

  const replaceRadiologist = async () => {
    if (!selectedRadiologist) {
      alert('Please select a radiologist first');
      return;
    }

    const selectedPatients = Object.keys(selectedRows).filter(id => selectedRows[id]);
    
    if (selectedPatients.length === 0) {
      alert('Please select at least one patient');
      return;
    }

    try {
      for (const patientId of selectedPatients) {
        const report = reports.find(r => r.id === patientId);
        if (report) {
          await apiHandlers.replaceRadiologist(report.dbId, parseInt(selectedRadiologist));
        }
      }

      alert('Radiologist replaced successfully for selected patients!');
      setSelectedRows({});
      setSelectAll(false);
      setSelectedRadiologist('');
      fetchPatients();
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Error replacing radiologist:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/';
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedRows = {};
    reports.forEach(report => {
      newSelectedRows[report.id] = newSelectAll;
    });
    setSelectedRows(newSelectedRows);
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700' : 'bg-white';
  const inputBorder = darkMode ? 'border-gray-600' : 'border-gray-300';

  const filteredReports = reports.filter(report => 
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.testDate.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} ${textPrimary} flex items-center justify-center`}>
        <div className="text-xl">Loading patients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} ${textPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-xl text-red-500 mb-4">Error: {error}</div>
          <button 
            onClick={fetchPatients}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} ${textPrimary} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${borderColor} shadow-md`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
              alt="U4rad"
              className={`h-10 p-1 rounded ${darkMode ? 'bg-white' : 'bg-transparent'}`}
            />
            <h1 className={`text-lg sm:text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Reviewer
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <span className={`${textSecondary} text-sm`}>
                Welcome, {currentUser.first_name} {currentUser.last_name}
              </span>
            )}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 ${cardBg} rounded-lg border ${borderColor} font-medium`}>
              Total XRAY Reports: <span className="text-red-500">{filteredReports.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Search for names/IDs/Test Date"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${textPrimary} w-80`}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" />
              Download
            </button>
            <span className={textSecondary}>Good afternoon</span>
          </div>
        </div>

        {/* Filters */}
        <div className={`${cardBg} border ${borderColor} rounded-lg p-4 mb-4`}>
          <div className="mb-4">
            <span className={`${textSecondary} text-sm`}>
              Selected Patients: <span className="text-red-500">{Object.values(selectedRows).filter(Boolean).length}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className={`${textSecondary} text-sm font-medium`}>Assign Radiologist:</label>
            <select
              value={selectedRadiologist}
              onChange={(e) => setSelectedRadiologist(e.target.value)}
              className={`px-3 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${textPrimary}`}
            >
              <option value="">--Select Radiologist--</option>
              {radiologists.map(rad => (
                <option key={rad.id} value={rad.id}>
                  {rad.first_name} {rad.last_name} ({rad.email})
                </option>
              ))}
            </select>
            <button 
              onClick={assignRadiologist}
              disabled={!selectedRadiologist || Object.values(selectedRows).filter(Boolean).length === 0}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Radiologist
            </button>
            <button 
              onClick={replaceRadiologist}
              disabled={!selectedRadiologist || Object.values(selectedRows).filter(Boolean).length === 0}
              className={`px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Replace Radiologist
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden shadow-lg`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${borderColor}`}>
                <tr>
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-500 rounded focus:ring-2 focus:ring-red-500"
                      />
                      <span className="font-semibold text-sm">Select All</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Patient ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      Test Date
                      <button className={`px-2 py-1 text-xs ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}>
                        All
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Report Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Actions</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">History Files</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Mark As Correct</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Assigned Doctor</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Check Image</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                      No patients found
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className={`border-b ${borderColor} hover:${darkMode ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows[report.id] || false}
                          onChange={() => handleRowSelect(report.id)}
                          className="w-4 h-4 text-red-500 rounded focus:ring-2 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-4 py-4 font-medium">{report.id}</td>
                      <td className="px-4 py-4">
                        <div>
                          <div>{report.name}</div>
                          <div className="text-xs text-gray-500">{report.age} yrs, {report.gender}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{report.testDate}</td>
                      <td className="px-4 py-4">{report.reportDate}</td>
                      <td className="px-4 py-4">
                        <button className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black rounded font-medium text-sm transition-colors">
                          View Report 1
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm">{report.historyFiles}</td>
                      <td className="px-4 py-4">
                        <button 
                          onClick={() => releasePatient(report.dbId, report.name)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-medium text-sm transition-colors"
                        >
                          {report.status}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm">{report.assignedTo}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 bg-yellow-500 text-black rounded font-medium text-sm">
                          {report.checkImage}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}