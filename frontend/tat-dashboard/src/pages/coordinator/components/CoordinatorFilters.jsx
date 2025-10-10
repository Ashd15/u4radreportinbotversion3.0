import React, { useState } from 'react';

const CoordinatorFilters = ({
  darkMode,
  filters,
  handleFilterChange,
  searchTerm,
  setSearchTerm,
  bodyParts,
  getUniqueOptions,
  viewMode,
  setViewMode,
  showInstitutionDropdown,
  setShowInstitutionDropdown,
  patients
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
        <div className={`sticky z-40 p-2 rounded-xl shadow-lg border mb-6 backdrop-blur-sm ${
      darkMode 
        ? 'bg-gray-800/95 border-gray-700' 
        : 'bg-white/95 border-gray-100'
    }`}
    style={{ top: '80px' }}>
      {/* Search Input */}
      <div className="mb-2">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, ID, or institution..."
            className={`w-full px-4 py-3 pl-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300'
            }`}
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { key: 'bodyPart', label: 'Body Parts', options: bodyParts.map(part => ({ value: part.name, label: part.name })) },
          { key: 'allocated', label: 'Allocation Status', options: [{ value: 'Assigned', label: 'Assigned' }, { value: 'Unassigned', label: 'Unassigned' }] },
          { key: 'status', label: 'Status', options: [{ value: 'Pending', label: 'Pending' }, { value: 'Completed', label: 'Completed' }] },
          { key: 'modality', label: 'Modalities', options: getUniqueOptions('modality').map(opt => ({ value: opt, label: opt })) }
        ].map(filter => (
          <select
            key={filter.key}
            value={filters[filter.key]}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className={`px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-xs ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="">All {filter.label}</option>
            {filter.options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ))}

        <button
          onClick={() => {
            handleFilterChange('bodyPart', '');
            handleFilterChange('allocated', '');
            handleFilterChange('clinicalHistory', '');
            handleFilterChange('status', '');
            handleFilterChange('modality', '');
            handleFilterChange('institution', '');
            handleFilterChange('studyDate', '');
            setSearchTerm('');
          }}
          className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 shadow-lg text-sm"
        >
          Clear All
        </button>

        <div className="flex items-center gap-1">
          {/* View Toggle */}
          <div className={`flex rounded-lg p-1 ${
            darkMode ? 'bg-gray-600' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white shadow-md'
                  : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white shadow-md'
                  : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔳 Grid
            </button>
          </div>
        
          {/* Study Date Filter */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filters.studyDate
                  ? 'bg-blue-500 text-white shadow-md'
                  : darkMode 
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>📅</span>
              <span className="text-xs">
                {filters.studyDate ? filters.studyDate : ""}
              </span>
            </button>
            
            {showDatePicker && (
              <div className={`absolute top-full right-0 mt-2 z-50 p-3 rounded-lg shadow-xl border ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`} style={{ minWidth: '200px' }}>
                <input
                  type="date"
                  value={filters.studyDate}
                  onChange={(e) => {
                    handleFilterChange('studyDate', e.target.value);
                    setShowDatePicker(false);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'border-gray-300'
                  }`}
                />
                {filters.studyDate && (
                  <button
                    onClick={() => {
                      handleFilterChange('studyDate', '');
                      setShowDatePicker(false);
                    }}
                    className="mt-2 w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Clear Date
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorFilters;