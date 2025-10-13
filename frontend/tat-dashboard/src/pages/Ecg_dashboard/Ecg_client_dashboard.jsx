// src/components/ECGPatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, X, Upload, Filter, ChevronLeft, ChevronRight, LogOut, Edit, Activity, Calendar, MapPin, User, Download, AlertCircle, RefreshCw, Moon, Sun, Eye } from 'lucide-react';
import { fetchPatients, addPatient, fetchECGClient } from './Ecg_handler_dashboard';

const ECGPatientDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [ecgClient, setEcgClient] = useState(null);
  const [userData, setUserData] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    gender: '',
    date: ''
  });

  // Form state - updated to match API parameters
  const [formData, setFormData] = useState({
    PatientId: '',
    PatientName: '',
    age: '',
    gender: 'Male',
    HeartRate: '',
    TestDate: '',
    ReportDate: ''
  });

  // Stats state
  const [stats, setStats] = useState({
    totalPatients: 0,
    reportedCases: 0,
    unreportedCases: 0
  });

  // Load user data and patients on component mount
  useEffect(() => {
    loadUserData();
    loadPatients();
    loadECGClient();
  }, []);

  // Load patients when search, page, or filters change
  useEffect(() => {
    loadPatients();
  }, [searchQuery, currentPage, filters]);

  // Update stats when patients change
  useEffect(() => {
    fetchStats();
  }, [patients]);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load user data from localStorage
  const loadUserData = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load user data");
    }
  };

  const loadPatients = async () => {
    setLoading(true);
    try {
      const params = {
        q: searchQuery,
        page: currentPage,
        ...filters
      };
      
      const response = await fetchPatients(params);
      
      if (response.success) {
        // Use the patients array directly from response
        setPatients(response.patients || []);
        setTotalPages(response.total_pages || 1);
        setTotalPatients(response.patients?.length || 0);
        setError('');
      } else {
        setError(response.error || 'Failed to load patients');
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          setTimeout(() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Error loading patients:", err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadECGClient = async () => {
    try {
      const clientData = await fetchECGClient();
      if (clientData.success) {
        // Extract client information from the response
        setEcgClient(clientData.client);
        setError('');
      } else {
        setError(clientData.message || 'Failed to load ECG client data');
        
        // If authentication failed, redirect to login
        if (clientData.requiresLogin || clientData.status === 401 || clientData.status === 403) {
          setTimeout(() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Error in loadECGClient:", err);
      setError('Error loading ECG client information');
    }
  };

  const fetchStats = () => {
    // Calculate stats from actual patient data using the new structure
    const total = patients.length;
    const reported = patients.filter(p => p.status === true).length;
    const unreported = patients.filter(p => p.status === false || !p.status).length;

    setStats({
      totalPatients: total,
      reportedCases: reported,
      unreportedCases: unreported
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      gender: '',
      date: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.PatientId || !formData.PatientName) {
      setError('Patient ID and Name are required');
      return;
    }

    setLoading(true);
    try {
      const response = await addPatient(formData);
      
      if (response.success) {
        setShowAddModal(false);
        setFormData({
          PatientId: '',
          PatientName: '',
          age: '',
          gender: 'Male',
          HeartRate: '',
          TestDate: '',
          ReportDate: ''
        });
        loadPatients();
        setError('');
      } else {
        setError(response.error || 'Failed to add patient');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // View ECG image
  const viewECGImage = (imagePath) => {
    if (imagePath) {
      // Construct full URL if needed
      const fullImageUrl = imagePath.startsWith('http') ? imagePath : `http://localhost:8000${imagePath}`;
      window.open(fullImageUrl, '_blank');
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!userData?.user) return 'User';
    const { first_name, last_name, username } = userData.user;
    return first_name && last_name ? `${first_name} ${last_name}` : username;
  };

  // Get status badge style - updated for new data structure
  const getStatusBadge = (patient) => {
    if (patient.status === true) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  };

  // Get status text - updated for new data structure
  const getStatusText = (patient) => {
    if (patient.status === true) return 'Reported';
    return 'Pending';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Left side: Logo + Title */}
            <div className="flex items-center gap-3">
              <img
                src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
                alt="U4rad"
                className="h-10 p-1 bg-transparent dark:bg-white rounded"
              />
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  ECG Patient Dashboard
                </h1>
                {ecgClient && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {ecgClient.location || ecgClient.username || 'ECG Client Portal'}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: User Info + Controls */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              {userData && (
                <div className="text-right">
                  <p className="text-sm font-medium text-black dark:text-white">
                    Welcome, {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {userData.user?.group || 'User'}
                  </p>
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Section - Updated to remove urgent cases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalPatients}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Patients</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.reportedCases}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Reported Cases</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.unreportedCases}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending Cases</div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="mb-6">
          <div className="flex gap-4 items-center mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Patient ID or Name..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 dark:focus:ring-red-500 dark:focus:border-red-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${
                showFilters 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400' 
                  : 'border-gray-300 dark:border-gray-600 text-black dark:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filter
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Patient
            </button>
            <button 
              onClick={loadPatients}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-black dark:text-white flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    <Activity className="w-4 h-4 inline mr-1" />
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                  >
                    <option value="">All Status</option>
                    <option value="reported">Reported</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Gender
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Test Date
                  </label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Patients Table - Updated to match API response structure */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600 dark:bg-red-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Patient ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Heart Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Test Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Report Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    ECG Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        Loading patients...
                      </div>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No patients found matching your criteria
                    </td>
                  </tr>
                ) : (
                  patients.map((patient, index) => (
                    <tr key={`${patient.PatientId}-${index}`} className="hover:bg-red-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-sm text-black dark:text-white font-medium">
                        {patient.PatientId}
                      </td>
                      <td className="px-6 py-4 text-sm text-black dark:text-white">
                        {patient.PatientName}
                      </td>
                      <td className="px-6 py-4 text-sm text-black dark:text-white">
                        {patient.age || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-black dark:text-white">
                        {patient.gender || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-black dark:text-white">
                        <span className={`${
                          patient.HeartRate && (parseInt(patient.HeartRate) < 60 || parseInt(patient.HeartRate) > 100) 
                            ? 'text-red-600 dark:text-red-400 font-semibold' 
                            : 'text-black dark:text-white'
                        }`}>
                          {patient.HeartRate || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-black dark:text-white">
                        {patient.TestDate || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-black dark:text-white">
                        {patient.ReportDate || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(patient)}`}>
                          {getStatusText(patient)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {patient.Image ? (
                          <button
                            onClick={() => viewECGImage(patient.Image)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View ECG
                          </button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">No ECG</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalPatients)} of {totalPatients} results
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-black dark:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 border rounded ${
                        currentPage === page
                          ? 'bg-red-600 dark:bg-red-700 text-white border-red-600 dark:border-red-700'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-black dark:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2)
                ) {
                  return <span key={page} className="text-gray-500 dark:text-gray-400 px-2">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-black dark:text-white"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-red-600 dark:bg-red-700 text-white rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add New Patient Record
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">Patient ID:</label>
                <input
                  type="text"
                  name="PatientId"
                  value={formData.PatientId}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">Patient Name:</label>
                <input
                  type="text"
                  name="PatientName"
                  value={formData.PatientName}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">Age:</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">Gender:</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">Heart Rate:</label>
                <input
                  type="text"
                  name="HeartRate"
                  value={formData.HeartRate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">Test Date:</label>
                <input
                  type="date"
                  name="TestDate"
                  value={formData.TestDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">Report Date:</label>
                <input
                  type="date"
                  name="ReportDate"
                  value={formData.ReportDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Patient Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ECGPatientDashboard;