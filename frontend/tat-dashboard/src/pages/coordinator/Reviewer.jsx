import React, { useState } from 'react';
import { Download, Sun, Moon, Search } from 'lucide-react';

export default function Reviewer() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedRadiologist, setSelectedRadiologist] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});

  const reports = [
    {
      id: 'SM82AUG25',
      name: 'MR RAGHUVEER THAKRAN',
      testDate: '21-08-2025',
      reportDate: 'Sept. 30, 2025',
      status: 'Ready to Go',
      assignedTo: 'Dr. pooja kale patil',
      checkImage: 'Reported',
      historyFiles: 'No History Files'
    }
  ];

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

  return (
    <div className={`min-h-screen ${bgClass} ${textPrimary} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${borderColor} shadow-md`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span className="text-red-500">XRAI</span> Reporting
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
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
              Total XRAY Reports: <span className="text-red-500">1</span>
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
            <span className={`${textSecondary} text-sm`}>Page of</span>
          </div>
          <div className="flex items-center gap-3">
            <label className={`${textSecondary} text-sm font-medium`}>Assign Radiologist:</label>
            <select
              value={selectedRadiologist}
              onChange={(e) => setSelectedRadiologist(e.target.value)}
              className={`px-3 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${textPrimary}`}
            >
              <option value="">--Select Radiologist--</option>
              <option value="dr-pooja">Dr. Pooja Kale Patil</option>
              <option value="dr-sharma">Dr. Sharma</option>
              <option value="dr-patel">Dr. Patel</option>
            </select>
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
              Assign Radiologist
            </button>
            <button className={`px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} rounded-lg font-medium transition-colors`}>
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
                  <th className="px-4 py-3 text-left font-semibold text-sm">Reassign to Doctor</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Check Image</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
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
                    <td className="px-4 py-4">{report.name}</td>
                    <td className="px-4 py-4">{report.testDate}</td>
                    <td className="px-4 py-4">{report.reportDate}</td>
                    <td className="px-4 py-4">
                      <button className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black rounded font-medium text-sm transition-colors">
                        View Report 1
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm">{report.historyFiles}</td>
                    <td className="px-4 py-4">
                      <span className="px-3 py-1 bg-red-500 text-white rounded font-medium text-sm">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{report.assignedTo}</span>
                        <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-medium text-sm transition-colors">
                          Reassign
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-3 py-1 bg-yellow-500 text-black rounded font-medium text-sm">
                        {report.checkImage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}