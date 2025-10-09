import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, LogOut, RefreshCw, AlertCircle, Upload, X, Calendar, MapPin, User, Activity, Menu, Edit, Save, XCircle, Sun, Moon } from 'lucide-react';
import { 
  fetchECGPatients, 
  markPatientAsUrgent, 
  markPatientForNonReported,
  bulkUpdatePatients,
  uploadECGFiles,
  fetchLocations,
  fetchCardiologists,
  fetchECGStats,
  assignCardiologist,
  updateECGPatient
} from './Ecg_handler_dashboard';

const ECGDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [sortBy, setSortBy] = useState('latest');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const navigate = useNavigate();
  const [cardiologists, setCardiologists] = useState([]);
  const [uploadData, setUploadData] = useState({
    files: [],
    location: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    location: '',
    allocated: '',
    city: '',
    date: '',
    urgent_only: false
  });
  const [stats, setStats] = useState({
    "Current Uploaded": 0,
    "Current Reported": 0,
    "Unreported Cases": 0,
    "Unallocated Cases": 0,
    "Total Uploaded Cases": 0,
    "Rejected Cases": 0
  });

  useEffect(() => {
    loadMetadata();
    loadPatients();
    loadStats();
  }, [currentPage, sortBy, sortOrder, filters]);

  const loadMetadata = async () => {
    try {
      const [locationsData, cardiologistsData] = await Promise.all([
        fetchLocations(),
        fetchCardiologists()
      ]);
      setLocations(locationsData);
      setCardiologists(cardiologistsData);
    } catch (error) {
      console.error('Error loading metadata:', error);
      setLocations([]);
      setCardiologists([]);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await fetchECGStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      let ordering = '';
      const orderPrefix = sortOrder === 'desc' ? '-' : '';

      switch (sortBy) {
        case 'date':
          ordering = `${orderPrefix}Date`;
          break;
        case 'name':
          ordering = `${orderPrefix}PatientName`;
          break;
        case 'age':
          ordering = `${orderPrefix}Age`;
          break;
        case 'heart_rate':
          ordering = `${orderPrefix}HeartRate`;
          break;
        case 'patient_id':
          ordering = `${orderPrefix}PatientId`;
          break;
        case 'status':
          ordering = `${orderPrefix}isDone`;
          break;
        case 'urgent':
          ordering = `${orderPrefix}MarkAsUrgent`;
          break;
        default:
          ordering = '-Date';
      }

      const params = {
        page: currentPage,
        search: searchTerm,
        ordering: ordering,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== false)
        ),
      };

      const response = await fetchECGPatients(params);

      const rawData = response?.data || response;
      const patientList = Array.isArray(rawData)
        ? rawData
        : rawData?.patients || rawData?.results || rawData?.data || [];

      const totalPages =
        rawData?.num_pages ||
        rawData?.total_pages ||
        rawData?.pagination?.pages ||
        1;

      const totalPatients =
        rawData?.total ||
        rawData?.count ||
        rawData?.pagination?.total_items ||
        patientList.length;

      setPatients(patientList);
      setTotalPages(totalPages);
      setTotalPatients(totalPatients);

      await loadStats();
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadPatients();
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
      location: '',
      allocated: '',
      city: '',
      date_from: '',
      date_to: '',
      urgent_only: false
    });
    setCurrentPage(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(patients.map(p => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleEditPatient = (patient) => {
    setEditingPatient({
      id: patient.id,
      PatientName: patient.PatientName,
      PatientId: patient.PatientId,
      Age: patient.Age,
      HeartRate: patient.HeartRate
    });
    setShowEditModal(true);
  };

  const handleSavePatient = async () => {
    if (!editingPatient) return;

    if (!editingPatient.PatientName.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!editingPatient.PatientId.trim()) {
      setError('Patient ID is required.');
      return;
    }
    if (!editingPatient.Age || editingPatient.Age < 0 || editingPatient.Age > 150) {
      setError('Please enter a valid age (0-150).');
      return;
    }
    if (!editingPatient.HeartRate || editingPatient.HeartRate < 30 || editingPatient.HeartRate > 300) {
      setError('Please enter a valid heart rate (30-300 bpm).');
      return;
    }

    try {
      const updatedPatient = await updateECGPatient(editingPatient.id, {
        PatientName: editingPatient.PatientName.trim(),
        PatientId: editingPatient.PatientId.trim(),
        age: parseInt(editingPatient.Age),
        HeartRate: parseInt(editingPatient.HeartRate)
      });

      setPatients(prev => prev.map(p => 
        p.id === editingPatient.id ? { ...p, ...updatedPatient } : p
      ));
      setShowEditModal(false);
      setEditingPatient(null);
      setError(null);
    } catch (error) {
      console.error('Error updating patient:', error);
      setError('Failed to update patient information.');
    }
  };

  const handleMarkAsUrgent = async (patientId, isUrgent) => {
    try {
      await markPatientAsUrgent(patientId, isUrgent);
      await loadPatients();
    } catch (error) {
      console.error('Error updating urgent status:', error);
      setError('Failed to update urgent status.');
    }
  };

  const handleMarkForNonReported = async (patientId, isNonReported) => {
    try {
      await markPatientForNonReported(patientId, isNonReported);
      await loadPatients();
    } catch (error) {
      console.error('Error updating non-reported status:', error);
      setError('Failed to update non-reported status.');
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadData(prev => ({
      ...prev,
      files: files
    }));
  };

  const handleUpload = async () => {
    if (!uploadData.files.length || !uploadData.location) {
      alert('Please select files and a location!');
      return;
    }

    try {
      const response = await uploadECGFiles(uploadData.files, uploadData.location);

      if (response.success) {
        alert('Files uploaded successfully!');
        setShowUploadModal(false);
        setUploadData({ files: [], location: '' });
        loadPatients();
      } else {
        const errorMsg = response.error || 'Unknown error';
        alert('Upload failed: ' + errorMsg);

        if (response.missing_id) console.warn('Missing IDs:', response.missing_id);
        if (response.processing_error) console.warn('Processing errors:', response.processing_error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred while uploading files.');
    }
  };

  const handleAssignCardiologist = async (cardiologistId) => {
    try {
      if (selectedRows.length === 0) {
        setError('Please select at least one patient.');
        return;
      }

      const cardiologist = cardiologists.find(c => c.id === cardiologistId);
      if (!cardiologist) {
        setError('Invalid cardiologist selected.');
        return;
      }

      const anyAllocated = selectedRows.some(id => {
        const patient = patients.find(p => p.id === id);
        return patient && patient.Allocated;
      });
      const action = anyAllocated ? 'replace' : 'assign';

      const patientIdsToAssign = selectedRows.map(id => patients.find(p => p.id === id).id);

      const data = await assignCardiologist(patientIdsToAssign, cardiologist.email, action);

      if (data.success) {
        const updatedPatients = patients.map(p => {
          if (data.updated_patients.includes(p.id)) {
            return { ...p, Allocated: cardiologist.name };
          }
          return p;
        });
        setPatients(updatedPatients);
        setShowAssignModal(false);
        setSelectedRows([]);
      } else {
        setError(data.error || 'Failed to assign cardiologist.');
      }
    } catch (error) {
      console.error('Error assigning cardiologist:', error);
      setError(`Failed to assign cardiologist. ${error.message}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRows.length === 0) {
      alert('Please select at least one patient.');
      return;
    }

    try {
      if (action === 'assign_cardiologist' || action === 'replace_cardiologist') {
        setShowAssignModal(true);
        return;
      }

      const updateData = {};
      if (action === 'mark_urgent') updateData.MarkAsUrgent = true;
      if (action === 'unmark_urgent') updateData.MarkAsUrgent = false;

      await bulkUpdatePatients(selectedRows, updateData);
      setSelectedRows([]);
      await loadPatients();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleExport = () => {
    navigate('/ecg-pdf-dashboard');
  };

  const filteredPatients = patients.filter(patient => {
    if (searchTerm &&
        !patient.PatientName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !patient.PatientId?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (filters.status) {
      if (filters.status === 'reported' && !patient.isDone) return false;
      if (filters.status === 'non-reportable' && !patient.MarkForNonReported) return false;
      if (filters.status === 'unreported' && (patient.isDone || patient.MarkForNonReported)) return false;
    }

    if (filters.location && patient.Location !== filters.location) return false;
    if (filters.city && patient.City !== filters.city) return false;
    if (filters.allocated && patient.Allocated !== filters.allocated) return false;
    if (filters.date && patient.Date !== filters.date) return false;
    if (filters.urgent_only && !patient.MarkAsUrgent) return false;

    return true;
  });



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button 
                className="md:hidden p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>

              {/* Add Logo here */}
              <img
                src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
                alt="U4rad"
                className="h-10 p-1 bg-transparent dark:bg-white rounded"   // Tailwind way instead of inline style
              />

              <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                ECG Dashboard
              </h1>
            </div>

            
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-80 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                onClick={handleSearch}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors flex items-center bg-white dark:bg-gray-700"
              >
                <Search className="w-4 h-4 mr-2 text-gray-700 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-white">Search</span>
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center transition-colors ${
                  showFilters 
                    ? 'bg-red-600 border-red-700 text-white' 
                    : 'border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
              <button 
                onClick={handleExport}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-300 transition-colors bg-white dark:bg-gray-700"
              >
                <Download className="w-4 h-4 text-gray-900 dark:text-white" />
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600" />
                )}
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900 dark:bg-gray-700 text-white hover:bg-black dark:hover:bg-gray-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            
            {/* Mobile Upload Button */}
            <button 
              onClick={() => setShowUploadModal(true)}
              className="md:hidden px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex space-x-2 mt-3">
              <button 
                onClick={handleSearch}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors flex items-center justify-center bg-white dark:bg-gray-700"
              >
                <Search className="w-4 h-4 mr-2 text-gray-700 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-white">Search</span>
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 py-2 border rounded-lg flex items-center justify-center transition-colors ${
                  showFilters 
                    ? 'bg-red-600 border-red-700 text-white' 
                    : 'border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
            <div className="flex flex-col space-y-2">
              <button 
                onClick={handleExport}
                className="flex items-center px-3 py-2 text-gray-900 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-3 text-gray-700 dark:text-gray-300" />
                Download Reports
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 mr-3 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 mr-3 text-gray-600" />
                )}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-white bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 rounded-lg transition-colors justify-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-4 sm:px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              
              {/* Single Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  <Calendar className="w-4 h-4 inline mr-1 text-red-600" />
                  Date
                </label>
                <input
                  type="date"
                  value={filters.date || ''}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  <Activity className="w-4 h-4 inline mr-1 text-red-600" />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="reported">Reported</option>
                  <option value="unreported">Unreported</option>
                  <option value="non-reportable">Non-reportable</option>
                </select>
              </div>

              {/* Cardiologist Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  <User className="w-4 h-4 inline mr-1 text-red-600" />
                  Cardiologist
                </label>
                <select
                  value={filters.allocated}
                  onChange={(e) => handleFilterChange('allocated', e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Cardiologists</option>
                  {cardiologists.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  <MapPin className="w-4 h-4 inline mr-1 text-red-600" />
                  City
                </label>
                <select
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Cities</option>
                  {[...new Set(locations.map(loc => loc.city__name))].map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  <MapPin className="w-4 h-4 inline mr-1 text-red-600" />
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Urgent Checkbox + Clear */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="urgent-only"
                  checked={filters.urgent_only}
                  onChange={(e) => handleFilterChange('urgent_only', e.target.checked)}
                  className="mr-2 focus:ring-red-600 text-red-600"
                />
                <label htmlFor="urgent-only" className="text-sm text-gray-900 dark:text-white">
                  Show urgent cases only
                </label>
              </div>
              <button 
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
          <span className="text-red-800 dark:text-red-200 flex-grow">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Section */}
      <div className="mx-4 sm:mx-6 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Current Uploaded */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats["Current Uploaded"]}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current Uploaded</div>
          </div>
          
          {/* Current Reported */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats["Current Reported"]}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current Reported</div>
          </div>
          
          {/* Unreported Cases */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats["Unreported Cases"]}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Unreported Cases</div>
          </div>
          
          {/* Unallocated Cases */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats["Unallocated Cases"]}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Unallocated Cases</div>
          </div>
          
          {/* Total Uploaded Cases */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats["Total Uploaded Cases"]}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Uploaded</div>
          </div>
          
          {/* Rejected Cases */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats["Rejected Cases"]}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Rejected Cases</div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-red-800 dark:text-red-200 font-medium">
              {selectedRows.length} patient(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleBulkAction('assign_cardiologist')}
                className="px-3 py-1 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded hover:bg-black dark:hover:bg-gray-600 transition-colors"
              >
                Assign Cardiologist
              </button>
              <button 
                onClick={() => handleBulkAction('replace_cardiologist')}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Replace Cardiologist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Table Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-900 dark:text-white">
                  Showing {filteredPatients.length} of {totalPatients} results
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="block sm:hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600 dark:text-red-400" />
                Loading patients...
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No patients found
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(patient.id)}
                          onChange={() => handleSelectRow(patient.id)}
                          className="mt-1 focus:ring-red-600 text-red-600 dark:text-red-400"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{patient.PatientName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">ID: {patient.PatientId}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Edit Patient"
                          onClick={() => handleEditPatient(patient)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Age:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">{patient.Age}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Gender:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">{patient.Gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Heart Rate:</span>
                        <span className={`ml-1 font-medium ${
                          parseInt(patient.HeartRate) < 60 || parseInt(patient.HeartRate) > 100 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {patient.HeartRate} bpm
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Date:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">{patient.Date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={patient.MarkAsUrgent}
                            onChange={(e) => handleMarkAsUrgent(patient.id, e.target.checked)}
                            className="mr-1 focus:ring-red-600"
                            style={{accentColor: '#dc2626'}}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Urgent</span>
                        </div>
                        
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          patient.isDone 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : patient.MarkForNonReported
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {patient.isDone ? 'Reported' : patient.MarkForNonReported ? 'Non-Reportable' : 'Unreported'}
                        </span>
                      </div>

                      <div className="text-right">
                        {patient.Allocated ? (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">{patient.Allocated}</span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Not Assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedRows.length === patients.length && patients.length > 0}
                      className="focus:ring-red-600 text-red-600 dark:text-red-400"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Patient ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Heart Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Allocated To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Urgent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Non-Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="14" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-red-600 dark:text-red-400" />
                        Loading patients...
                      </div>
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No patients found
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(patient.id)}
                          onChange={() => handleSelectRow(patient.id)}
                          className="focus:ring-red-600 text-red-600 dark:text-red-400"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                        {patient.PatientId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {patient.PatientName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {patient.Age}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {patient.Gender}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <span className={`${
                          parseInt(patient.HeartRate) < 60 || parseInt(patient.HeartRate) > 100 
                            ? 'text-red-600 dark:text-red-400 font-semibold' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {patient.HeartRate} bpm
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {patient.Date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {patient.Allocated ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">{patient.Allocated}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {patient.City}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {patient.Location}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={patient.MarkAsUrgent}
                            onChange={(e) => handleMarkAsUrgent(patient.id, e.target.checked)}
                            className="focus:ring-red-600"
                            style={{accentColor: '#dc2626'}}
                          />
                          {patient.MarkAsUrgent && (
                            <span className="ml-2 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={patient.MarkForNonReported}
                          onChange={(e) => handleMarkForNonReported(patient.id, e.target.checked)}
                          className="focus:ring-red-600 text-red-600 dark:text-red-400"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            patient.isDone
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : patient.MarkForNonReported
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {patient.isDone
                            ? 'Reported'
                            : patient.MarkForNonReported
                            ? 'Non-Reportable'
                            : 'Unreported'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Edit Patient"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-900 dark:text-white">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalPatients)} of {totalPatients} results
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
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
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded transition-colors ${
                          currentPage === page
                            ? 'bg-red-600 text-white border-red-700'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return <span key={page} className="text-gray-500 dark:text-gray-400">...</span>;
                  }
                  return null;
                })}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && editingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-red-600 text-white rounded-t-lg">
              <h3 className="text-lg font-semibold flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Edit Patient Information
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPatient(null);
                  setError(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Patient Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={editingPatient.PatientName}
                  onChange={(e) => setEditingPatient(prev => ({ ...prev, PatientName: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter patient name"
                />
              </div>

              {/* Patient ID */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Patient ID *
                </label>
                <input
                  type="text"
                  value={editingPatient.PatientId}
                  onChange={(e) => setEditingPatient(prev => ({ ...prev, PatientId: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter patient ID"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={editingPatient.Age}
                  onChange={(e) => setEditingPatient(prev => ({ ...prev, Age: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter age"
                />
              </div>

              {/* Heart Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Heart Rate (bpm) *
                </label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={editingPatient.HeartRate}
                  onChange={(e) => setEditingPatient(prev => ({ ...prev, HeartRate: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter heart rate"
                />
              </div>

              {/* Validation Note */}
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                * All fields are required. Age should be 0-150, Heart Rate should be 30-300 bpm.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 dark:bg-gray-700 rounded-b-lg">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPatient(null);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors flex items-center bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSavePatient}
                disabled={
                  !editingPatient?.PatientName?.trim() || 
                  !editingPatient?.PatientId?.trim() || 
                  !editingPatient?.Age || 
                  !editingPatient?.HeartRate ||
                  editingPatient.Age < 0 || editingPatient.Age > 150 ||
                  editingPatient.HeartRate < 30 || editingPatient.HeartRate > 300
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-red-600 text-white rounded-t-lg">
              <h3 className="text-lg font-semibold flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload ECG Files
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ files: [], location: '' });
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">

              {/* File Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Select ECG Files:
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files);
                    setUploadData(prev => ({ ...prev, files: selectedFiles }));
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {uploadData.files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Selected files:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {uploadData.files.map((file, index) => (
                        <div
                          key={index}
                          className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded mb-1"
                        >
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Select Location:
                </label>
                <select
                  value={uploadData.location}
                  onChange={(e) =>
                    setUploadData(prev => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 dark:bg-gray-700 rounded-b-lg">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ files: [], location: '' });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadData.files.length === 0 || !uploadData.location}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Cardiologist Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-900 text-white rounded-t-lg">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="w-5 h-5 mr-2" />
                {selectedRows.some(id => {
                  const patient = patients.find(p => p.id === id);
                  return patient && patient.Allocated;
                }) ? 'Assign/Replace Cardiologist' : 'Assign Cardiologist to Selected Patients'}
              </h3>
              <button 
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRows([]);
                }}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Selected Patients Info */}
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Selected Patients ({selectedRows.length}):
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedRows.map((patientId) => {
                      const patient = patients.find(p => p.id === patientId);
                      return patient ? (
                        <div key={patientId} className="text-sm bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                          <div className="font-medium text-gray-900 dark:text-white">{patient.PatientName}</div>
                          <div className="text-gray-600 dark:text-gray-400">ID: {patient.PatientId}</div>
                          {patient.Allocated && (
                            <div className="text-red-600 dark:text-red-400 text-xs">
                              Currently: {patient.Allocated}
                            </div>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* Cardiologist Selection */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Select Cardiologist:</h4>
                <div className="space-y-2">
                  {cardiologists.length > 0 ? (
                    cardiologists.map((doctor) => (
                      <div 
                        key={doctor.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 cursor-pointer transition-all duration-200 group"
                        onClick={() => handleAssignCardiologist(doctor.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center group-hover:bg-black transition-colors">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{doctor.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.specialization}</p>
                            </div>
                          </div>
                          <div className="text-red-600 dark:text-red-400 text-sm font-medium group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                            Assign to {selectedRows.length} patient{selectedRows.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No cardiologists available. Please contact support.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t bg-gray-50 dark:bg-gray-700 rounded-b-lg">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRows([]);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ECGDashboard;