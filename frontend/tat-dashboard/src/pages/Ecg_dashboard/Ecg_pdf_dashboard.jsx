import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Calendar, MapPin, FileText, ChevronLeft, ChevronRight, ArrowLeft, Menu, Sun, Moon, AlertCircle } from 'lucide-react';
import { fetchECGPDFReports, downloadECGPDFReport, viewECGPDFReport } from './Ecg_handler_dashboard';
import { useNavigate } from 'react-router-dom';

const ECGPDFDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({});
  const [availableFilters, setAvailableFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  // Filter states
  const [selectedTestDate, setSelectedTestDate] = useState('');
  const [selectedReportDate, setSelectedReportDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode !== null) {
      setIsDarkMode(JSON.parse(savedMode));
    } else {
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply dark mode class to document root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (filters = {}) => {
  setLoading(true);
  setError(null);

  try {
    // Build params object safely
    const params = {
      search: filters.search || searchTerm || undefined,
      test_date: filters.test_date || selectedTestDate || undefined,
      report_date: filters.report_date || selectedReportDate || undefined,
      location: filters.location || selectedLocation || undefined,
      page: filters.page || 1,
    };

    console.log('Fetching reports with params:', params);

    // Pass params object directly to Axios; no query string manually
    const response = await fetchECGPDFReports(params);
    console.log('Full API Response:', response);

    // Determine actual data structure
    let actualData = null;

    if (response?.data?.pdfs) {
      // Case: data contains pdfs
      actualData = response.data;
    } else if (response?.pdfs) {
      // Case: pdfs directly in response
      actualData = response;
    } else if (response?.data?.success && response?.data?.data?.pdfs) {
      // Case: nested success/data structure
      actualData = response.data.data;
    }

    // Populate state if pdfs exist
    if (actualData?.pdfs) {
      setReports(actualData.pdfs || []);
      setPagination(actualData.pagination || {});
      setAvailableFilters({
        testDates: actualData.Test_Date || actualData.testDates || [],
        reportDates: actualData.Report_Date || actualData.reportDates || [],
        locations: actualData.Location || actualData.locations || [],
      });
      setSelectedReports(new Set());
    } else {
      console.error('No pdfs found in response:', response);
      setError('No reports data found');
      setReports([]);
      setPagination({});
      setAvailableFilters({});
    }
  } catch (err) {
    console.error('Error fetching reports:', err);
    setError(err.message || 'An error occurred while fetching reports');
    setReports([]);
    setPagination({});
    setAvailableFilters({});
  } finally {
    setLoading(false);
  }
};

  const handleSearch = () => {
    const searchParams = {
      search: searchTerm,
      test_date: selectedTestDate,
      report_date: selectedReportDate,
      location: selectedLocation,
      page: 1
    };
    fetchReports(searchParams);
  };

  const handlePageChange = (page) => {
    const searchParams = {
      search: searchTerm,
      test_date: selectedTestDate,
      report_date: selectedReportDate,
      location: selectedLocation,
      page: page
    };
    fetchReports(searchParams);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTestDate('');
    setSelectedReportDate('');
    setSelectedLocation('');
    fetchReports({ page: 1 });
  };

  const handleViewReport = (report) => {
    if (report.pdf_file) {
      viewECGPDFReport(report.pdf_file);
    } else {
      alert('PDF file not available');
    }
  };

  const handleDownloadReport = async (report) => {
    const result = await downloadECGPDFReport(report.id, report.patient_name);
    if (!result.success) {
      alert(`Download failed: ${result.error}`);
    }
  };

  // NEW: Bulk download functionality
  const handleBulkDownload = async () => {
    if (selectedReports.size === 0) {
      alert('Please select at least one report to download');
      return;
    }

    setDownloadingBulk(true);
    
    try {
      const selectedReportIds = Array.from(selectedReports);
      const selectedReportObjects = reports.filter(report => 
        selectedReportIds.includes(report.id)
      );

      // Download each report sequentially
      for (let i = 0; i < selectedReportObjects.length; i++) {
        const report = selectedReportObjects[i];
        console.log(`Downloading report ${i + 1}/${selectedReportObjects.length}:`, report.patient_name);
        
        const result = await downloadECGPDFReport(report.id, report.patient_name);
        if (!result.success) {
          console.error(`Failed to download ${report.patient_name}:`, result.error);
        }
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      alert(`Successfully processed ${selectedReportObjects.length} reports`);
    } catch (error) {
      console.error('Error in bulk download:', error);
      alert('Some downloads failed. Please check the console for details.');
    } finally {
      setDownloadingBulk(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/ecg-dashboard');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      const allIds = reports.map(report => report.id);
      setSelectedReports(new Set(allIds));
    }
  };

  const toggleSelectReport = (reportId) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const isAllSelected = reports.length > 0 && selectedReports.size === reports.length;
  const isIndeterminate = selectedReports.size > 0 && selectedReports.size < reports.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading ECG PDF Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button 
                className="md:hidden p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
              <button
                onClick={handleBackToDashboard}
                className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white flex items-center transition-colors duration-200">
                  <FileText className="mr-3 h-6 w-6 text-red-600 dark:text-red-400" />
                  ECG PDF Reports
                </h1>
                <p className="text-red-600 dark:text-red-400 mt-1 text-sm transition-colors duration-200">
                  Total Reports: {pagination.total_items || 0}
                </p>
              </div>
            </div>
            
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Bulk Download Button */}
              {selectedReports.size > 0 && (
                <button
                  onClick={handleBulkDownload}
                  disabled={downloadingBulk}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors duration-200 shadow-sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingBulk ? 'Downloading...' : `Download Selected (${selectedReports.size})`}
                </button>
              )}
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 bg-white dark:bg-gray-700"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 mt-4 transition-colors duration-200">
              {/* Mobile Bulk Download Button */}
              {selectedReports.size > 0 && (
                <button
                  onClick={handleBulkDownload}
                  disabled={downloadingBulk}
                  className="flex items-center w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors duration-200 mb-3 justify-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingBulk ? 'Downloading...' : `Download Selected (${selectedReports.size})`}
                </button>
              )}
              
              <button
                onClick={toggleDarkMode}
                className="flex items-center w-full px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 mr-3 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 mr-3 text-gray-600" />
                )}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-300 font-medium">Error Loading Reports</p>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
              <button
                onClick={() => fetchReports()}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6 transition-colors duration-300">
          <div className="space-y-4">
            {/* Desktop Search */}
            <div className="hidden md:flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors duration-200 flex items-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center transition-colors duration-200 ${
                  showFilters 
                    ? 'bg-red-600 border-red-700 text-white' 
                    : 'border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex space-x-2 mt-3">
                <button 
                  onClick={handleSearch}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors duration-200 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 py-2 border rounded-lg flex items-center justify-center transition-colors duration-200 ${
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

            {/* Filters */}
            {showFilters && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 transition-colors duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      <Calendar className="w-4 h-4 inline mr-1 text-red-600 dark:text-red-400" />
                      Test Date
                    </label>
                    <select
                      value={selectedTestDate}
                      onChange={(e) => setSelectedTestDate(e.target.value)}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Test Dates</option>
                      {availableFilters.testDates?.map((date) => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      <FileText className="w-4 h-4 inline mr-1 text-red-600 dark:text-red-400" />
                      Report Date
                    </label>
                    <select
                      value={selectedReportDate}
                      onChange={(e) => setSelectedReportDate(e.target.value)}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Report Dates</option>
                      {availableFilters.reportDates?.map((date) => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      <MapPin className="w-4 h-4 inline mr-1 text-red-600 dark:text-red-400" />
                      Location
                    </label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Locations</option>
                      {availableFilters.locations?.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reports Table */}
        {reports.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden mb-8 transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={input => {
                            if (input) {
                              input.indeterminate = isIndeterminate;
                            }
                          }}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        />
                        <span className="ml-2">Select All</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Test Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Report Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr 
                      key={report.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedReports.has(report.id)}
                          onChange={() => toggleSelectReport(report.id)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.patient_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
                          {report.test_date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
                          {report.report_date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
                          {report.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.current_page} of {pagination.total_pages}
                ({pagination.total_items} total items)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={!pagination.has_previous}
                  className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.current_page - 2) + i;
                    if (pageNum <= pagination.total_pages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                            pageNum === pagination.current_page
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={!pagination.has_next}
                  className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {reports.length === 0 && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              No Reports Found
            </h3>
            <p className="text-gray-400 dark:text-gray-500 mb-4">
              Try adjusting your search criteria or filters.
            </p>
            <button
              onClick={() => fetchReports()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ECGPDFDashboard;