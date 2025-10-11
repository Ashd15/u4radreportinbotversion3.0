import React from 'react';
import { useNavigate } from 'react-router-dom';

const CoordinatorGridTable = ({
  darkMode,
  filteredPatients,
  selectedPatients,
  handlePatientSelect,
  setSelectedReport,
  getLiveTimeRemaining,
  formatTimeRemaining,
  getTimeRemainingColor,
  viewMode,
  renderGridView,
  headerHeight,
  filterHeight,
  showInstitutionDropdown,
  setShowInstitutionDropdown,
  filters,
  handleFilterChange,
  institutions,
  patients
}) => {
  const navigate = useNavigate();

  const renderTableView = () => (
    <table className="min-w-full divide-y divide-gray-200">
         <thead className={`sticky z-30 bg-gradient-to-r ${
        darkMode ? 'from-gray-700 to-gray-800' : 'from-gray-50 to-slate-100'
      }`}
      style={{ 
        top: 0,
        zIndex: 10,
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <tr>
          <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
            darkMode ? 'bg-gray-800' : 'bg-gray-50'

          }`}>
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  handlePatientSelect('all', filteredPatients.map(p => p.id));
                } else {
                  handlePatientSelect('clear');
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
          </th>
          {[
            'Patient ID', 'Patient Name', 'Age', 'Gender', 'Study Date', 'Study Time','Radiologist',
            'Institution', 'Modality', 'Study Description', 'Body Part', 'Status',
            'TAT Status', 'Flags', 'Clinical History', 'Actions'
          ].map(header => (
            <th key={header} className={`px-3 py-2 text-left text-xxs font-bold uppercase tracking-wider ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            } ${header === 'Institution' ? 'relative' : ''}`}>
              {header === 'Institution' ? (
                <>
                  <button
                    // onClick={() => setShowInstitutionDropdown(!showInstitutionDropdown)}
                    className={`flex items-center space-x-2 hover:text-blue-500 transition-colors ${
                      filters.institution ? 'text-blue-500' : ''
                    }`}
                  >
                    <span>{header}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {filters.institution && (
                      <span className="ml-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                  
                  {showInstitutionDropdown && (
                    <div className={`absolute top-full left-0 mt-2 w-64 max-h-96 overflow-y-auto rounded-lg shadow-xl border z-50 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            handleFilterChange('institution', '');
                            setShowInstitutionDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            !filters.institution
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          All Institutions
                        </button>
                        
                        {[...new Set(patients.map(p => p.institution_name))]
                          .filter(name => name && name !== 'None')
                          .sort((a, b) => a.localeCompare(b))
                          .map((institution, index) => {
                            const count = filteredPatients.filter(p => p.institution_name === institution).length;
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  handleFilterChange('institution', institution);
                                  setShowInstitutionDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                  filters.institution === institution
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <span className="truncate">{institution}</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                  filters.institution === institution
                                    ? 'bg-blue-200 dark:bg-blue-800'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={`divide-y ${
        darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-100 bg-white'
      }`}>
        {filteredPatients.map((patient, index) => (
          <tr key={patient.id} className={`transition-all duration-200 ${
            patient.tat_breached && !patient.is_done 
              ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' 
              : patient.is_done 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
                : index % 2 === 0 
                  ? (darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-25 hover:bg-slate-50')
                  : (darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'hover:bg-slate-50')
          }`}>
            <td className="px-3 py-2 whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedPatients.includes(patient.id)}
                onChange={() => handlePatientSelect(patient.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </td>
            <td className={`px-3 py-2 whitespace-nowrap text-xs font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{patient.patient_id}</td>
            <td className="px-3 py-2 whitespace-nowrap text-xs">
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${
                  patient.is_done 
                    ? 'text-emerald-700'
                    : patient.tat_breached 
                      ? 'text-red-700'
                      : darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {patient.patient_name}
                </span>
                {patient.is_done && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                    ✅ Done
                  </span>
                )}
                {patient.tat_breached && !patient.is_done && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 animate-pulse">
                    🚨 Overdue
                  </span>
                )}
              </div>
            </td>
            <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{patient.age}</td>
            <td className={`px-4 py-4 whitespace-nowrap text-sm ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{patient.gender}</td>
            <td className={`px-4 py-4 whitespace-nowrap text-sm ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{patient.study_date}</td>
            <td className={`px-4 py-4 whitespace-nowrap text-sm ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{patient.study_time}</td>
            <td
              className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${
                patient.radiologist && patient.radiologist.length > 0
                  ? darkMode
                    ? 'text-emerald-300'
                    : 'text-emerald-700'
                  : darkMode
                  ? 'text-amber-300'
                  : 'text-amber-700'
              }`}
            >
              {patient.radiologist && patient.radiologist.length > 0
                ? patient.radiologist.map((r, i) => (
                    <span key={i}>
                      Dr. {r}
                      {i !== patient.radiologist.length - 1 && ', '}
                    </span>
                  ))
                : 'Unassigned'}
            </td>
            <td className={`px-3 py-2 whitespace-nowrap text-xs font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{patient.institution_name}</td>
            <td className="px-3 py-2 whitespace-nowrap text-xs">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                darkMode 
                  ? 'bg-blue-900/30 border border-blue-700 text-blue-300' 
                  : 'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-800'
              }`}>
                {patient.modality}
              </span>
            </td>
            <td className={`px-3 py-2 text-xs max-w-xs ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <div className="truncate font-medium" title={patient.study_description}>
                {patient.study_description}
              </div>
            </td>
            <td className={`px-3 py-2 whitespace-nowrap text-xs font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>{patient.body_part_examined}</td>
            <td className="px-3 py-2 whitespace-nowrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
                patient.is_done 
                  ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700' 
                  : 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700'
              }`}>
                {patient.is_done ? '✅ Completed' : '⏳ Pending'}
              </span>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-xs">
              <div className="flex flex-col space-y-1">
                <span className={`ml-1 font-bold ${getTimeRemainingColor(getLiveTimeRemaining(patient.id, patient.time_remaining), patient.tat_breached, patient.is_done)}`}>
                  {formatTimeRemaining(getLiveTimeRemaining(patient.id, patient.time_remaining), patient.is_done, patient.overdue_seconds)}
                </span>
                {patient.tat_breached && !patient.is_done && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300 animate-pulse dark:from-red-900/30 dark:to-red-800/30 dark:text-red-200 dark:border-red-600">
                    🚨 TAT BREACHED
                  </span>
                )}
                {patient.is_done && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-800 border border-emerald-300 dark:from-emerald-900/30 dark:to-green-800/30 dark:text-emerald-200 dark:border-emerald-600">
                    ✅ COMPLETED
                  </span>
                )}
              </div>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-xs">
              <div className="flex flex-wrap gap-1">
                {patient.urgent && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 rounded-full border border-red-300 shadow-sm dark:from-red-900/30 dark:to-red-800/30 dark:text-red-200 dark:border-red-600">
                    🚨 URGENT
                  </span>
                )}
                {patient.vip && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full border border-purple-300 shadow-sm dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-200 dark:border-purple-600">
                    👑 VIP
                  </span>
                )}
                {patient.Mlc && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 rounded-full border border-orange-300 shadow-sm dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-200 dark:border-orange-600">
                    📋 MLC
                  </span>
                )}
                {patient.twostepcheck && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full border border-blue-300 shadow-sm dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-200 dark:border-blue-600">
                    🔍 Review
                  </span>
                )}
                {patient.tat_breached && !patient.is_done && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-gradient-to-r from-red-200 to-red-300 text-red-900 rounded-full border-2 border-red-400 shadow-md animate-pulse dark:from-red-800/30 dark:to-red-700/30 dark:text-red-100 dark:border-red-500">
                    ⚠️ OVERDUE
                  </span>
                )}
              </div>
            </td>
            <td className={`px-3 py-2 text-xs max-w-xs ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <div className="space-y-2">
                <div className="truncate font-medium" title={patient.notes}>
                  {patient.notes || 'No clinical history available'}
                </div>
                {patient.history_files && patient.history_files.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {patient.history_files.map((file, index) =>{
                      let fileUrl = file;
                      if (fileUrl.includes("/https/")) {
                        fileUrl = fileUrl.split("/https/")[1];
                        fileUrl = "https://" + fileUrl;
                      }
                      return(
                        <a key={index}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 hover:from-indigo-200 hover:to-blue-200 dark:hover:from-indigo-800 dark:hover:to-blue-800 transition-all duration-200"
                        >
                          H{index + 1}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-xs">
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/viewer?id=${patient.id}`);
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 border border-blue-300 transition-all duration-200 transform hover:scale-105 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-200 dark:hover:from-blue-800 dark:hover:to-blue-700 dark:border-blue-600"
                >
                  👁️ View
                </button>
                <button 
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-200 dark:from-emerald-900/30 dark:to-green-800/30 text-emerald-700 dark:text-emerald-200 hover:from-emerald-200 hover:to-green-300 dark:hover:from-emerald-800 dark:hover:to-green-700 border border-emerald-300 dark:border-emerald-600 transition-all duration-200 transform hover:scale-105"
                  onClick={() => setSelectedReport(patient)}  
                >
                  ✏️ Edit
                </button>
                {patient.patient_reports && patient.patient_reports.length > 0 && (
                  <a 
                    href={patient.patient_reports[0].url}
                    target="_blank"
                    rel="noopener noreereferrer"
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-200 hover:from-purple-200 hover:to-purple-300 dark:hover:from-purple-800 dark:hover:to-purple-700 border border-purple-300 dark:border-purple-600 transition-all duration-200 transform hover:scale-105"
                  >
                    📄 Report
                  </a>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className={`rounded-2xl shadow-lg border overflow-hidden ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div className="overflow-auto relative" style={{ maxHeight: '500px' }}>
        {viewMode === 'table' ? renderTableView() : renderGridView()}
        
        {filteredPatients.length === 0 && viewMode === 'table' && (
          <div className="text-center py-16">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'
            }`}>
              <span className="text-4xl text-gray-400">📋</span>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>No patients found</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorGridTable;