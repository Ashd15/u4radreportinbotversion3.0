import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Calendar, MapPin, FileText, ChevronLeft, ChevronRight, ArrowLeft, Menu, Sun, Moon } from 'lucide-react';
import { fetchECGPDFReports, downloadECGPDFReport, viewECGPDFReport } from '../../api/apiConnector';
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

  const fetchReports = async (params = {}) => {
    setLoading(true);
    try {
      const response = await fetchECGPDFReports(params);
      if (response.success && response.data.success) {
        setReports(response.data.pdfs);
        setPagination(response.data.pagination);
        setAvailableFilters({
          testDates: response.data.Test_Date || [],
          reportDates: response.data.Report_Date || [],
          locations: response.data.Location || []
        });
      } else {
        console.error('Failed to fetch reports:', response.error);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
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
    viewECGPDFReport(report.pdf_file);
  };

  const handleDownloadReport = async (report) => {
    const result = await downloadECGPDFReport(report.id, report.patient_name);
    if (!result.success) {
      alert(`Download failed: ${result.error}`);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/ecg-dashboard');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 bg-white dark:bg-gray-700"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 mt-4 transition-colors duration-200">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 mr-3 text-yellow-400" />
                  ) : (
                    <Moon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                  )}
                  <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                type="button"
                onClick={handleSearch}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-colors duration-200 flex items-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </button>
              <button
                type="button"
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
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">
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
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">
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
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">
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
                    type="button"
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

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-red-300 dark:hover:border-red-600 hover:shadow-md transition-all duration-300 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
                    {report.patient_name}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-500 mr-2">Test:</span>
                      <span className="text-gray-900 dark:text-white transition-colors duration-200">{report.test_date}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <FileText className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-500 mr-2">Report:</span>
                      <span className="text-gray-900 dark:text-white transition-colors duration-200">{report.report_date}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-500 mr-2">Location:</span>
                      <span className="text-gray-900 dark:text-white transition-colors duration-200">{report.location}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full transition-colors duration-200">
                  #{report.id}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewReport(report)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => handleDownloadReport(report)}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors duration-200 text-sm font-medium bg-white dark:bg-gray-700"
                >
                  <Download className="mr-1 h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                Page {pagination.current_page} of {pagination.total_pages}
                ({pagination.total_items} total items)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={!pagination.has_previous}
                  className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                {/* Page numbers */}
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
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {reports.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4 transition-colors duration-200" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2 transition-colors duration-200">
              No Reports Found
            </h3>
            <p className="text-gray-400 dark:text-gray-500 transition-colors duration-200">
              Try adjusting your search criteria or filters.
            </p>
            <button
              onClick={() => fetchReports()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
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