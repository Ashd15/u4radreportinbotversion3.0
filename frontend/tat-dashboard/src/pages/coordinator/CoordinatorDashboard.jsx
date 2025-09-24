import React, { useEffect, useState } from "react";
import CoordinatorHandler from "./CoordinatorHandler";

const Coordinator = () => {
  const [coordinators, setCoordinators] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [radiologists, setRadiologists] = useState([]);
  const [selectedRadiologist, setSelectedRadiologist] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [bodyParts, setBodyParts] = useState([]);
  const [assignMode, setAssignMode] = useState('assign');

  // Filter states
  const [filters, setFilters] = useState({
    bodyPart: '',
    allocated: '',
    clinicalHistory: '',
    status: '',
    modality: ''
  });

  // Get unique filter options
  const getUniqueOptions = (field) => {
    const options = patients.map(p => {
      switch(field) {
        case 'bodyPart': return p.body_part_examined;
        case 'allocated': return p.radiologist?.length > 0 ? 'Assigned' : 'Unassigned';
        case 'status': return p.is_done ? 'Completed' : 'Pending';
        case 'modality': return p.modality;
        default: return '';
      }
    }).filter(option => option && option !== 'Unknown');
    return [...new Set(options)];
  };

  // Calculate dashboard stats
  const getDashboardStats = () => {
    const totalCases = patients.length;
    const pendingCases = patients.filter(p => !p.is_done).length;
    const reportedCases = patients.filter(p => p.is_done).length;
    const overdueCases = patients.filter(p => p.tat_breached && !p.is_done).length; // Only pending overdue cases
    
    return { totalCases, pendingCases, reportedCases, overdueCases };
  };

  const stats = getDashboardStats();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coordinatorData, patientData, radiologistData, bodyPartsData] = await Promise.all([
        CoordinatorHandler.getCoordinators(),
        CoordinatorHandler.getTatCounters(),
        CoordinatorHandler.getRadiologists().catch(() => []),
        CoordinatorHandler.getBodyParts().catch(() => [])
      ]);
      
      setCoordinators(coordinatorData);
      setPatients(patientData);
      setFilteredPatients(patientData);
      setRadiologists(radiologistData);
      setBodyParts(bodyPartsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...patients];
    
    if (filters.bodyPart) {
      filtered = filtered.filter(p => p.body_part_examined === filters.bodyPart);
    }
    if (filters.allocated) {
      const isAssigned = filters.allocated === 'Assigned';
      filtered = filtered.filter(p => isAssigned ? p.radiologist?.length > 0 : p.radiologist?.length === 0);
    }
    if (filters.status) {
      const isDone = filters.status === 'Completed';
      filtered = filtered.filter(p => p.is_done === isDone);
    }
    if (filters.modality) {
      filtered = filtered.filter(p => p.modality === filters.modality);
    }

    setFilteredPatients(filtered);
  }, [filters, patients]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleAssignRadiologist = async () => {
    if (!selectedRadiologist || selectedPatients.length === 0) {
      alert('Please select a radiologist and at least one patient.');
      return;
    }
  
    try {
      const apiCall = assignMode === 'assign' 
        ? CoordinatorHandler.assignRadiologist 
        : CoordinatorHandler.replaceRadiologist;
  
      await Promise.all(
        selectedPatients.map(patientId => 
          apiCall(patientId, selectedRadiologist)
        )
      );
      
      // Refresh data after assignment
      await fetchData();
      setSelectedPatients([]);
      setSelectedRadiologist('');
      alert(`Radiologist ${assignMode === 'assign' ? 'assigned' : 'replaced'} successfully!`);
    } catch (error) {
      console.error(`Error ${assignMode === 'assign' ? 'assigning' : 'replacing'} radiologist:`, error);
      alert(`Error ${assignMode === 'assign' ? 'assigning' : 'replacing'} radiologist. Please try again.`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleSaveReport = async (newData, historyFiles) => {
     try {
       await CoordinatorHandler.updatePatient(
         selectedReport.id,   // patient ID
         newData,             // updated fields
         historyFiles         // attached files
       );
   
       alert("Patient updated successfully ✅");
       setSelectedReport(null); // close modal
       fetchData();             // refresh list
     } catch (error) {
       console.error("Error updating patient:", error);
       alert("Failed to update patient ❌");
     }
   };


   const formatTimeRemaining = (timeRemaining, isDone, overdueSeconds) => {
     if (isDone) {
       // For completed reports, show total time taken
       if (overdueSeconds) {
         const absTime = Math.abs(overdueSeconds);
         const hours = Math.floor(absTime / 3600);
         const minutes = Math.floor((absTime % 3600) / 60);
         return `Completed in ${hours}h ${minutes}m`;
       }
       return 'Completed';
     }
     
     // For pending reports, show remaining/overdue time
     if (!timeRemaining) return 'N/A';
     
     const absTime = Math.abs(timeRemaining);
     const hours = Math.floor(absTime / 3600);
     const minutes = Math.floor((absTime % 3600) / 60);
     
     if (timeRemaining < 0) {
       return `Overdue by ${hours}h ${minutes}m`;
     } else {
       return `${hours}h ${minutes}m remaining`;
     }
   };
   
  const getTimeRemainingColor = (timeRemaining, tatBreached, isDone) => {
    if (isDone) return 'text-green-700'; // Completed reports are green
    if (tatBreached || timeRemaining < 0) return 'text-red-700';
    if (timeRemaining < 3600) return 'text-yellow-700'; // Less than 1 hour
    return 'text-green-700';
  };


  const currentCoordinator = coordinators[0]; // Assuming first coordinator is current user

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f9fafb'}}>
      {/* Header */}
      <div style={{backgroundColor: '#000000'}} className="shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold" style={{color: '#ffffff'}}>Coordinator Dashboard</h1>
            
            {/* Profile Section */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                  {currentCoordinator?.profile_pic ? (
                    <img 
                      src={currentCoordinator.profile_pic} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span style={{color: '#ffffff'}} className="text-sm font-medium">
                      {currentCoordinator?.first_name?.charAt(0)}
                      {currentCoordinator?.last_name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{color: '#ffffff'}}>
                    {currentCoordinator?.first_name} {currentCoordinator?.last_name}
                  </p>
                  <p className="text-xs" style={{color: '#d1d5db'}}>{currentCoordinator?.email}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                        {currentCoordinator?.profile_pic ? (
                          <img 
                            src={currentCoordinator.profile_pic} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span style={{color: '#ffffff'}} className="text-lg font-medium">
                            {currentCoordinator?.first_name?.charAt(0)}
                            {currentCoordinator?.last_name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold" style={{color: '#111827'}}>
                          {currentCoordinator?.first_name} {currentCoordinator?.last_name}
                        </h3>
                        <p className="text-gray-600">{currentCoordinator?.email}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">About:</h4>
                      <p className="text-sm text-gray-600">{currentCoordinator?.about || 'No description available'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">TAT Completed:</span>
                        <p className="font-semibold" style={{color: '#16a34a'}}>{currentCoordinator?.tat_completed || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">TAT Breached:</span>
                        <p className="font-semibold" style={{color: '#dc2626'}}>{currentCoordinator?.tat_breached || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Total Cases</h3>
            <p className="text-2xl font-bold" style={{color: '#111827'}}>{stats.totalCases}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Pending Cases</h3>
            <p className="text-2xl font-bold" style={{color: '#ca8a04'}}>{stats.pendingCases}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Reported Cases</h3>
            <p className="text-2xl font-bold" style={{color: '#16a34a'}}>{stats.reportedCases}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Overdue Cases</h3>
                <p className="text-2xl font-bold text-red-600">{stats.overdueCases}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
            </div>
            {stats.overdueCases > 0 && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                Immediate attention required
              </div>
            )}
          </div>
        </div>

        {/* Assign Radiologist Section */}
        {/* Assign Radiologist Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h3 className="text-lg font-semibold mb-4" style={{color: '#111827'}}>Manage Radiologist Assignment</h3>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setAssignMode('assign')}
                className={`px-3 py-1 rounded ${assignMode === 'assign' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Assign
              </button>
              <button
                onClick={() => setAssignMode('replace')}
                className={`px-3 py-1 rounded ${assignMode === 'replace' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Replace
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedRadiologist}
              onChange={(e) => setSelectedRadiologist(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Radiologist</option>
              {radiologists.map(rad => (
                <option key={rad.id} value={rad.id}>
                  {rad.first_name} {rad.last_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignRadiologist}
              disabled={!selectedRadiologist || selectedPatients.length === 0}
              style={{
                backgroundColor: !selectedRadiologist || selectedPatients.length === 0 ? '#9ca3af' : 
                                assignMode === 'assign' ? '#2563eb' : '#ea580c'
              }}
              className="px-4 py-2 text-white rounded-md hover:opacity-80 disabled:cursor-not-allowed transition-colors"
            >
              {assignMode === 'assign' ? 'Assign' : 'Replace'} for Selected ({selectedPatients.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <h3 className="text-lg font-semibold mb-4" style={{color: '#111827'}}>Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.bodyPart}
              onChange={(e) => handleFilterChange('bodyPart', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Body Parts</option>
              {bodyParts.map(part => (
                <option key={part.id} value={part.name}>{part.name}</option>
              ))}
            </select>

            <select
              value={filters.allocated}
              onChange={(e) => handleFilterChange('allocated', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Allocation Status</option>
              <option value="Assigned">Assigned</option>
              <option value="Unassigned">Unassigned</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={filters.modality}
              onChange={(e) => handleFilterChange('modality', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modalities</option>
              {getUniqueOptions('modality').map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <button
              onClick={() => setFilters({bodyPart: '', allocated: '', clinicalHistory: '', status: '', modality: ''})}
              style={{backgroundColor: '#4b5563'}}
              className="px-4 py-2 text-white rounded-md transition-colors"
              onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4b5563'}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPatients(filteredPatients.map(p => p.id));
                        } else {
                          setSelectedPatients([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study Time</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modality</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study Description</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Body Part</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TAT Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinical History</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className={`${
                      patient.tat_breached && !patient.is_done 
                        ? 'bg-red-50 border-l-4 border-red-500' 
                        : patient.is_done 
                          ? 'bg-green-50 hover:bg-green-100' 
                          : 'hover:bg-gray-50'
                    }`}>
                    <td className="px-2 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPatients.includes(patient.id)}
                        onChange={() => handlePatientSelect(patient.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{patient.patient_id}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={`${
                          patient.is_done 
                            ? 'text-green-700 font-semibold' 
                            : patient.tat_breached 
                              ? 'text-red-700 font-semibold' 
                              : 'text-gray-900'
                        }`}>
                          {patient.patient_name}
                        </span>
                        {patient.is_done && (
                          <span className="text-green-500 text-xs">✅</span>
                        )}
                        {patient.tat_breached && !patient.is_done && (
                          <span className="text-red-500 text-xs">🚨</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{patient.age}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{patient.gender}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{patient.study_date}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{patient.study_time}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{patient.institution_name}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">{patient.modality}</span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate">{patient.study_description}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{patient.body_part_examined}</td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        patient.is_done 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {patient.is_done ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                       <div className="flex flex-col">
                         <span className={`text-xs font-medium ${getTimeRemainingColor(patient.time_remaining, patient.tat_breached, patient.is_done)}`}>
                            {formatTimeRemaining(patient.time_remaining, patient.is_done, patient.overdue_seconds)}
                          </span>
                          {patient.tat_breached && !patient.is_done && (
                            <span className="text-xs text-red-600 bg-red-100 px-1 py-0.5 rounded mt-1 inline-block">
                              TAT BREACHED
                            </span>
                          )}
                          {patient.is_done && (
                            <span className="text-xs text-green-600 bg-green-100 px-1 py-0.5 rounded mt-1 inline-block">
                              COMPLETED ✓
                            </span>
                          )}
                       </div>
                     </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                       <div className="flex space-x-1 flex-wrap">
                         {patient.urgent && <span className="px-1 py-0.5 text-xs bg-red-100 text-red-800 rounded">URG</span>}
                         {patient.vip && <span className="px-1 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">VIP</span>}
                         {patient.mlc && <span className="px-1 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">MLC</span>}
                         {patient.twostepcheck && <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Mark for Review</span>}
                         {patient.tat_breached && !patient.is_done && (
                           <span className="px-1 py-0.5 text-xs bg-red-200 text-red-900 rounded font-bold border border-red-400">
                             OVERDUE
                           </span>
                         )}
                       </div>
                     </td>
                    <td className="px-3 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={patient.notes}>
                        {patient.notes || 'N/A'}
                      </div>
                      {patient.history_files && patient.history_files.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs text-blue-600">
                            {patient.history_files.length} file(s)
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-xs">View</button>
                        <button 
                          className="text-green-600 hover:text-green-800 text-xs"
                          onClick={() => setSelectedReport(patient)}  
                        >
                          Edit
                        </button>
                        {patient.patient_reports && patient.patient_reports.length > 0 && (
                          <a 
                            href={patient.patient_reports[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 text-xs"
                          >
                            Report
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No patients found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close profile dropdown */}
      {showProfile && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfile(false)}
        />
      )}

      {selectedReport && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800">Edit DICOM Data</h2>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
    
          <form
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const newData = {};
              fd.forEach((value, key) => {
                if (key !== 'history_file') {
                  newData[key] = value;
                }
              });
    
              // Extract history files
              const historyFiles = Array.from(fd.getAll('history_file')).filter(f => f && f.size > 0);
    
              handleSaveReport(newData, historyFiles.length ? historyFiles : null);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span>Name:</span>
                <input
                  type="text"
                  name="patient_name"
                  defaultValue={selectedReport.patient_name || ""}
                  className="border rounded p-2"
                />
              </label>
              <label className="flex flex-col">
                <span>Patient Id:</span>
                <input
                  type="text"
                  name="patient_id"
                  defaultValue={selectedReport.patient_id || ""}
                  className="border rounded p-2"
                />
              </label>
              <label className="flex flex-col">
                <span>Age:</span>
                <input
                  type="text"
                  name="age"
                  defaultValue={selectedReport.age || ""}
                  className="border rounded p-2"
                />
              </label>
              <label className="flex flex-col">
                <span>Gender:</span>
                <input
                  type="text"
                  name="gender"
                  defaultValue={selectedReport.gender || ""}
                  className="border rounded p-2"
                />
              </label>
              <label className="flex flex-col">
                <span>Study Date:</span>
                <input
                  type="text"
                  name="study_date"
                  defaultValue={selectedReport.study_date || ""}
                  className="border rounded p-2"
                />
              </label>
              <label className="flex flex-col">
                <span>Study Description:</span>
                <input
                  type="text"
                  name="study_description"
                  defaultValue={selectedReport.study_description || ""}
                  className="border rounded p-2"
                />
              </label>
            </div>
    
            <label className="flex flex-col">
              <span>Notes:</span>
              <textarea
                name="notes"
                defaultValue={selectedReport.notes || ""}
                className="border rounded p-2"
              />
            </label>

            
    
            <label className="flex flex-col">
              <span>Body Part Examined:</span>
              <select
                name="body_part_examined"
                defaultValue={selectedReport.body_part_examined || ""}
                className="border rounded p-2"
              >
                <option value="" disabled>Select Body Part</option>
                {bodyParts.map(part => (
                  <option key={part.id} value={part.name}>{part.name}</option>
                ))}
              </select>
            </label>
    
            <label className="flex flex-col">
              <span>Referring Doctor Name:</span>
              <input
                type="text"
                name="referring_doctor_name"
                defaultValue={selectedReport.referring_doctor_name || ""}
                className="border rounded p-2"
              />
            </label>
    
            <label className="flex flex-col">
              <span>Email:</span>
              <input
                type="text"
                name="email"
                defaultValue={selectedReport.email || ""}
                className="border rounded p-2"
              />
            </label>
    
            <label className="flex flex-col">
              <span>WhatsApp Number:</span>
              <input
                type="text"
                name="whatsapp_number"
                defaultValue={selectedReport.whatsapp_number || ""}
                className="border rounded p-2"
              />
            </label>
    
            <label className="flex flex-col">
              <span>Patient History File:</span>
            
              {/* Show existing history file(s) if any */}
              {selectedReport.history_files && selectedReport.history_files.length > 0 ? (
                <ul className="list-disc pl-5 mb-2 text-sm text-gray-600">
                 {selectedReport.history_files.map((file, index) => {
                   let fileUrl = file;
                   // Fix malformed URLs starting with "http://localhost/.../https/..."
                   if (fileUrl.includes("/https/")) {
                     fileUrl = fileUrl.split("/https/")[1];
                     fileUrl = "https://" + fileUrl;
                   }
             
                   return (
                     <li key={index}>
                       <a
                         href={fileUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-blue-600 underline"
                       >
                         {`History File ${index + 1}`}
                       </a>
                     </li>
                   );
                 })}
               </ul>
              ) : (
                <span className="text-xs text-gray-500 mb-2">
                  No history file uploaded yet
                </span>
              )}
            
              {/* Add more history files */}
              <input
                type="file"
                name="history_file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="border rounded p-2"
              />
              <span className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
              </span>
            </label>
            <label className="flex flex-col">
              <span className="mb-2">Case Type:</span>
              <div className="flex space-x-6">
                {["VIP", "URGENT", "MLC"].map((option) => (
                  <label key={option} className="inline-flex items-center space-x-2">
                    <input
                      type="radio"
                      name="case_type"
                      value={option}
                      defaultChecked={selectedReport.case_type === option}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </label>

             

    
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    
    </div>
  );
};

export default Coordinator;