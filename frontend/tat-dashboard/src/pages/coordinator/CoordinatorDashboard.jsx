import React, { useEffect, useState } from "react";
import CoordinatorHandler from "./CoordinatorHandler";
import Select from "react-select";

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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  
  // New states for dark mode and logout
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    bodyPart: '',
    allocated: '',
    clinicalHistory: '',
    status: '',
    modality: '',
    studyDate: ''
  });

  const [dateFilter, setDateFilter] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  // State to store live time remaining for each patient
  const [liveTimeRemaining, setLiveTimeRemaining] = useState({});  

  const user = JSON.parse(localStorage.getItem("user"))?.user;
  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";

  // Persist dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    
    // Update document class for Tailwind dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);




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

  // Initialize live time remaining when patients data is loaded
useEffect(() => {
  if (patients.length > 0) {
    const initialTimes = {};
    patients.forEach(patient => {
      if (!patient.is_done && patient.time_remaining !== null) {
        initialTimes[patient.id] = patient.time_remaining;
      }
    });
    setLiveTimeRemaining(initialTimes);
  }
}, [patients]);

// Countdown timer effect
useEffect(() => {
  const timer = setInterval(() => {
    setLiveTimeRemaining(prev => {
      const updated = { ...prev };
      let hasChanges = false;
      
      Object.keys(updated).forEach(patientId => {
        const patient = patients.find(p => p.id === parseInt(patientId));
        
        if (patient && !patient.is_done) {
          updated[patientId] = updated[patientId] - 1;
          hasChanges = true;
        }
      });
      
      return hasChanges ? updated : prev;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [patients]);

  // Apply filters
  useEffect(() => {
    let filtered = [...patients];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.institution_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
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
    if (filters.studyDate) {
      filtered = filtered.filter(p => p.study_date === filters.studyDate);
    }

    filtered.sort((a, b) => {
      const aUrgentPending = a.urgent && !a.is_done;
      const bUrgentPending = b.urgent && !b.is_done;
      
      if (aUrgentPending && !bUrgentPending) return -1;
      if (!aUrgentPending && bUrgentPending) return 1;
      
      // Secondary sort: overdue cases
      const aOverdue = a.tat_breached && !a.is_done;
      const bOverdue = b.tat_breached && !b.is_done;
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      return 0;
  });

    setFilteredPatients(filtered);
  }, [filters, patients, searchTerm]);

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


   const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 18) return "Good Afternoon";
    else return "Good Evening";
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

  const handleLogout = async () => {
    try {
      // Call your logout API if you have one
      await CoordinatorHandler.logout?.();
      
      // Clear local storage or tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('darkMode');
      
      // Redirect to login page or reload
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear storage and redirect anyway
      localStorage.clear();
      window.location.href = '/';
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
      <div className={`flex justify-center items-center min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-600'}`}>Loading Dashboard...</p>
        </div>
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
  

  const bodyPartOptions = bodyParts
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((part) => ({
        value: part.name,
        label: part.name,
      }));
    

   const formatTimeRemaining = (timeRemaining, isDone, overdueSeconds) => {
     if (isDone) {
       // For completed reports, show total time taken
       if (overdueSeconds) {
         const absTime = Math.abs(overdueSeconds);
         const hours = Math.floor(absTime / 3600);
         const minutes = Math.floor((absTime % 3600) / 60);
         const seconds = absTime % 60;
         return `Completed in ${hours}h ${minutes}m ${seconds}s`;
       }
       return 'Completed';
     }
     
     // For pending reports, show remaining/overdue time
     if (timeRemaining === null || timeRemaining === undefined) return 'N/A';
     
     const absTime = Math.abs(timeRemaining);
     const hours = Math.floor(absTime / 3600);
     const minutes = Math.floor((absTime % 3600) / 60);
     const seconds = absTime % 60;
     
     if (timeRemaining < 0) {
       return `Overdue by ${hours}h ${minutes}m ${seconds}s`;
     } else {
       return `${hours}h ${minutes}m ${seconds}s remaining`;
     }
   };
    
  const getLiveTimeRemaining = (patientId, fallbackTime) => {
    return liveTimeRemaining[patientId] !== undefined 
      ? liveTimeRemaining[patientId] 
      : fallbackTime;
  };

   const renderGridView = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className={`rounded-xl shadow-md border transition-all duration-200 hover:shadow-lg cursor-pointer ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                : 'bg-white border-gray-200 hover:border-blue-300'
            } ${
              patient.tat_breached && !patient.is_done 
                ? 'border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20' 
                : patient.is_done 
                  ? 'border-l-4 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                  : ''
            }`}
            // onClick={() => setSelectedReport(patient)}
          >
            {/* Card Header */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <input
                  type="checkbox"
                  checked={selectedPatients.includes(patient.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handlePatientSelect(patient.id);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                  patient.is_done 
                    ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200' 
                    : 'bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                }`}>
                  {patient.is_done ? '✅ Completed' : '⏳ Pending'}
                </span>
              </div>
              
              <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {patient.patient_name}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>ID: {patient.patient_id}</p>
              
              {/* Flags */}
              <div className="flex flex-wrap gap-1 mt-2">

  {/* 🚨 URGENT */}
  {patient.urgent && (
    <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full">
      🚨 URGENT
    </span>
  )}

  {/* 👑 VIP */}
  {patient.vip && (
    <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
      👑 VIP
    </span>
  )}

  {/* ⚠️ OVERDUE */}
  {patient.tat_breached && !patient.is_done && (
    <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100 rounded-full animate-pulse">
      ⚠️ OVERDUE
    </span>
  )}

  {/* 🩺 RADIOLOGIST */}
  {patient.radiologist && patient.radiologist.length > 0 ? (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full">
      🩺 {patient.radiologist.map((r, i) => (
        <span key={i}>
          Dr. {r}
          {i !== patient.radiologist.length - 1 && ', '}
        </span>
      ))}
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full">
      ⚕️ Unassigned
    </span>
  )}
</div>

            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age:</span>
                  <span className={`ml-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{patient.age}</span>
                </div>
                <div>
                  <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender:</span>
                  <span className={`ml-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{patient.gender}</span>
                </div>
                <div>
                  <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Study Date:</span>
                  <span className={`ml-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{patient.study_date}</span>
                </div>
                <div>
                  <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Modality:</span>
                  <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                    {patient.modality}
                  </span>
                </div>
               <div className="text-sm">
                <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Institution:</span>
                <span className={`ml-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{patient.institution_name}</span>
              </div>

              <div className="text-sm">
                <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Body Part:</span>
                <span className={`ml-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{patient.body_part_examined}</span>
              </div>

              <div className="text-sm">
                <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Study:</span>
                <p className={`truncate ${darkMode ? 'text-white' : 'text-gray-900'}`} title={patient.study_description}>
                  {patient.study_description}
                </p>
              </div>
              {/* TAT Status */}
              <div className="text-sm">
                <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>TAT Status:</span>
                <span className={`text-xs font-bold ${
                  getTimeRemainingColor(getLiveTimeRemaining(patient.id, patient.time_remaining), patient.tat_breached, patient.is_done)
                }`}>
                  {formatTimeRemaining(getLiveTimeRemaining(patient.id, patient.time_remaining), patient.is_done, patient.overdue_seconds)}
                </span>
              </div>
              </div>

              {/* Clinical History Preview */}
              {patient.notes && (
                <div className="text-sm">
                  <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Clinical History:</span>
                  <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {patient.notes}
                  </p>
                </div>
              )}

              {/* History Files */}
              {patient.history_files && patient.history_files.length > 0 && (
               <div className="flex flex-wrap gap-1">
                 {patient.history_files.map((file, index) => {
                   let fileUrl = file;
                   if (fileUrl.includes("/https/")) {
                     fileUrl = fileUrl.split("/https/")[1];
                     fileUrl = "https://" + fileUrl;
                   }
                   return (
                     <a
                       key={index}
                       href={fileUrl}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={(e) => e.stopPropagation()}
                       className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-all duration-200"
                     >
                       H{index + 1}
                     </a>
                   );
                 })}
               </div>
             )}
            </div>

            {/* Card Footer */}
            <div className={`px-4 py-3 border-t flex justify-between items-center ${
              darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReport(patient);
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-all duration-200"
                >
                  ✏️ Edit
                </button>
                {patient.patient_reports && patient.patient_reports.length > 0 && (
                  <a 
                    href={patient.patient_reports[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-700 transition-all duration-200"
                  >
                    📄 Report
                  </a>
                )}
              </div>
              
              <button className={`text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>
                Click for details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State for Grid */}
      {filteredPatients.length === 0 && (
        <div className="text-center py-16">
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
            darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'
          }`}>
            <span className="text-4xl text-gray-400">📋</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No patients found</h3>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Try adjusting your search criteria or filters.</p>
        </div>
      )}
    </div>
  );
   
  const getTimeRemainingColor = (timeRemaining, tatBreached, isDone) => {
    if (isDone) return darkMode ? 'text-emerald-300' : 'text-emerald-700';
    if (tatBreached || timeRemaining < 0) return darkMode ? 'text-red-300' : 'text-red-700';
    if (timeRemaining < 3600) return darkMode ? 'text-amber-300' : 'text-amber-700';
    return darkMode ? 'text-emerald-300' : 'text-emerald-700';
  };

  const currentCoordinator = coordinators[0]; // Assuming first coordinator is current user

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Enhanced Header */}
      <div className={`bg-gradient-to-r shadow-xl border-b ${
        darkMode 
          ? 'from-gray-800 to-gray-900 border-gray-700' 
          : 'from-gray-50 to-indigo-900 border-gray-200'
      }`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">📊</span>
              </div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                <img
                  src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
                  alt="U4rad"
                  style={{
                    height: 50,
                    backgroundColor: darkMode ? 'white' : 'transparent',
                    borderRadius: 6, // optional
                    padding: 2        // optional (to give space around logo)
                  }}
                />
              </span>

            
              </h1>
            </div>

            {/* Enhanced Profile Section with Dark Mode Toggle and Logout */}
            <div className="relative flex items-center space-x-3">
          <h2
  style={{
    fontSize: 18,
    margin: 0,
    fontWeight: 600,
    color: darkMode ? '#F9FAFB' : '#0B0B0B',
    display: window.innerWidth <= 600 ? 'none' : 'block',
  }}
>
  {getGreeting()}, Dr. {firstName} {lastName}
</h2>


              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode 
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 backdrop-blur-sm border border-white/10"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                    {currentCoordinator?.profile_pic ? (
                      <img 
                        src={currentCoordinator.profile_pic} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {currentCoordinator?.first_name?.charAt(0)}
                        {currentCoordinator?.last_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-semibold text-white">
                      {currentCoordinator?.first_name} {currentCoordinator?.last_name}
                    </p>
                    <p className="text-xs text-blue-200">{currentCoordinator?.email}</p>
                  </div>
                  <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              
                {/* Enhanced Profile Dropdown */}
                {showProfile && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border z-50 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}>
                    <div className="p-4">
                      {/* Profile Info */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                          {currentCoordinator?.profile_pic ? (
                            <img 
                              src={currentCoordinator.profile_pic} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-bold">
                              {currentCoordinator?.first_name?.charAt(0)}
                              {currentCoordinator?.last_name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {currentCoordinator?.first_name} {currentCoordinator?.last_name}
                          </h3>
                          <p className={`text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>{currentCoordinator?.email}</p>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            darkMode 
                              ? 'bg-blue-800 text-blue-200' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            Coordinator
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className={`p-3 rounded-lg border ${
                          darkMode 
                            ? 'bg-emerald-900/20 border-emerald-800' 
                            : 'bg-emerald-50 border-emerald-100'
                        }`}>
                          <div className="text-center">
                            <span className={`text-xs font-medium ${
                              darkMode ? 'text-emerald-400' : 'text-emerald-600'
                            }`}>TAT Completed</span>
                            <p className={`text-xl font-bold ${
                              darkMode ? 'text-emerald-300' : 'text-emerald-700'
                            }`}>{currentCoordinator?.tat_completed || 0}</p>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg border ${
                          darkMode 
                            ? 'bg-red-900/20 border-red-800' 
                            : 'bg-red-50 border-red-100'
                        }`}>
                          <div className="text-center">
                            <span className={`text-xs font-medium ${
                              darkMode ? 'text-red-400' : 'text-red-600'
                            }`}>TAT Breached</span>
                            <p className={`text-xl font-bold ${
                              darkMode ? 'text-red-300' : 'text-red-700'
                            }`}>{currentCoordinator?.tat_breached || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => setDarkMode(!darkMode)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                            darkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className="font-medium">
                            {darkMode ? 'Light Mode' : 'Dark Mode'}
                          </span>
                          <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
                        </button>
                        
                        <button
                          onClick={() => setShowLogoutConfirm(true)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 font-medium ${
                            darkMode 
                              ? 'bg-red-900/20 hover:bg-red-900/30 text-red-300' 
                              : 'bg-red-50 hover:bg-red-100 text-red-700'
                          }`}
                        >
                          <span>Logout</span>
                          <span>🚪</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 w-full">
          <div className={`p-4 rounded-xl shadow-md border transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Total Cases</h3>
                <p className={`text-2xl font-bold mt-1 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{stats.totalCases}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📁</span>
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <div className={`w-full rounded-full h-2 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl shadow-md border transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Pending Cases</h3>
                <p className={`text-2xl font-bold mt-1 ${
                  darkMode ? 'text-amber-400' : 'text-amber-600'
                }`}>{stats.pendingCases}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">⏳</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl shadow-md border transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Reported Cases</h3>
                <p className={`text-2xl font-bold mt-1 ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>{stats.reportedCases}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl shadow-md border-l-4 border-red-400 transition-all duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Overdue Cases</h3>
                <p className={`text-2xl font-bold mt-1 ${
                  darkMode ? 'text-red-400' : 'text-red-600'
                }`}>{stats.overdueCases}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🚨</span>
              </div>
            </div>
            {stats.overdueCases > 0 && (
              <div className={`mt-2 text-xs font-medium ${
                darkMode ? 'text-red-400' : 'text-red-600'
              }`}>⚠️ Needs attention</div>
            )}
          </div>
        </div>

        {/* Show assign/replace section only when patients are selected */}
        {selectedPatients.length > 0 && (
          <div className={`p-4 rounded-2xl shadow-lg border mb-8 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`flex rounded-xl p-1 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <button
                  onClick={() => setAssignMode('assign')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    assignMode === 'assign'
                      ? 'bg-blue-500 text-white shadow-md transform scale-105'
                      : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Assign New
                </button>
                <button
                  onClick={() => setAssignMode('replace')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    assignMode === 'replace'
                      ? 'bg-orange-500 text-white shadow-md transform scale-105'
                      : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Replace Existing
                </button>
              </div>

              <select
                value={selectedRadiologist}
                onChange={(e) => setSelectedRadiologist(e.target.value)}
                className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm min-w-64 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select Radiologist</option>
                {radiologists.map((rad) => (
                  <option key={rad.id} value={rad.id}>
                    Dr. {rad.first_name} {rad.last_name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAssignRadiologist}
                disabled={!selectedRadiologist || selectedPatients.length === 0}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg ${
                  !selectedRadiologist || selectedPatients.length === 0
                    ? 'bg-gray-300 text-gray-500'
                    : assignMode === 'assign'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-blue-200'
                                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-200'
                }`}
              >
                {assignMode === 'assign' ? 'Assign' : 'Replace'} for Selected (
                {selectedPatients.length})
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className={`p-2 rounded-xl shadow-lg border mb-6 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          {/* Search Input */}
          <div className="mb-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name, ID, or institution..."
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
        
          {/* Existing Filter Dropdowns */}
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
                className={`px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-sm ${
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
                setFilters({bodyPart: '', allocated: '', clinicalHistory: '', status: '', modality: ''});
                setSearchTerm(''); // Clear search as well
              }}
              className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 shadow-lg text-sm"
            >
              Clear All
            </button>

            <div className="flex items-center gap-3">
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
      <span className="text-sm">
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

        {/* Enhanced Patient Table */}
        <div className={`rounded-2xl shadow-lg border overflow-hidden ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="overflow-x-auto">
            {viewMode === 'table' ? (
             <table className="min-w-full divide-y divide-gray-200">
  <thead className={`bg-gradient-to-r ${
    darkMode ? 'from-gray-700 to-gray-800' : 'from-gray-50 to-slate-100'
  }`}>
    <tr>
      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
        <input
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedPatients(filteredPatients.map(p => p.id));
            } else {
              setSelectedPatients([]);
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
        />
      </th>
      {[
        'Patient ID', 'Patient Name', 'Age', 'Gender', 'Study Date', 'Study Time','Allocated ',
        'Institution', 'Modality', 'Study Description', 'Body Part', 'Status',
        'TAT Status', 'Flags', 'Clinical History', 'Actions'
      ].map(header => (
        <th key={header} className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {header}
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
        <td className="px-4 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={selectedPatients.includes(patient.id)}
            onChange={() => handlePatientSelect(patient.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
        </td>
        <td className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{patient.patient_id}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm">
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${
  patient.is_done 
    ? 'text-emerald-700' // Changed from 'text-gray-900 dark:text-emerald-300'
    : patient.tat_breached 
      ? 'text-red-700' // Changed from 'text-gray-900 dark:text-red-300'
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


        
        <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{patient.institution_name}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            darkMode 
              ? 'bg-blue-900/30 border border-blue-700 text-blue-300' 
              : 'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-800'
          }`}>
            {patient.modality}
          </span>
        </td>
        <td className={`px-4 py-4 text-sm max-w-xs ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <div className="truncate font-medium" title={patient.study_description}>
            {patient.study_description}
          </div>
        </td>
        <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{patient.body_part_examined}</td>
        <td className="px-4 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
            patient.is_done 
              ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700' 
              : 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700'
          }`}>
            {patient.is_done ? '✅ Completed' : '⏳ Pending'}
          </span>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm">
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
        <td className="px-4 py-4 whitespace-nowrap text-sm">
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
             {patient.mlc && (
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
        <td className={`px-4 py-4 text-sm max-w-xs ${
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
        <td className="px-4 py-4 whitespace-nowrap text-sm">
          <div className="flex space-x-2">
           <button className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 border border-blue-300 transition-all duration-200 transform hover:scale-105 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-200 dark:hover:from-blue-800 dark:hover:to-blue-700 dark:border-blue-600">
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
                rel="noopener noreferrer"
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
            ) : (
              renderGridView()
            )}
          </div>
          
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

      {/* Click outside to close profile dropdown */}
      {showProfile && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfile(false)}
        />
      )}

      {/* Enhanced Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">✏️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Edit Patient Data</h2>
                    <p className="text-blue-100 text-sm">Update DICOM information and clinical details</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
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
                className="space-y-6"
              >
                {/* Basic Information */}
                <div className={`p-6 rounded-2xl border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-100'
                }`}>
                  <h3 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>👤</span>
                    <span>Basic Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Patient Name</span>
                      <input
                        type="text"
                        name="patient_name"
                        defaultValue={selectedReport.patient_name || ""}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter patient name"
                      />
                    </label>
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Patient ID</span>
                      <input
                        type="text"
                        name="patient_id"
                        defaultValue={selectedReport.patient_id || ""}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter patient ID"
                      />
                    </label>
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Age</span>
                      <input
                        type="text"
                        name="age"
                        defaultValue={selectedReport.age || ""}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter age"
                      />
                    </label>
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Gender</span>
                      <input
                        type="text"
                        name="gender"
                        defaultValue={selectedReport.gender || ""}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter gender"
                      />
                    </label>
                  </div>
                </div>

                {/* Study Information */}
                <div className={`p-6 rounded-2xl border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100'
                }`}>
                  <h3 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>🔬</span>
                    <span>Study Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Study Date</span>
                      <input
                        type="text"
                        name="study_date"
                        defaultValue={selectedReport.study_date || ""}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter study date"
                      />
                    </label>
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Study Description</span>
                      <input
                        type="text"
                        name="study_description"
                        defaultValue={selectedReport.study_description || ""}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter study description"
                      />
                    </label>
<label className="flex flex-col space-y-2 md:col-span-2">
  <span
    className={`text-sm font-semibold ${
      darkMode ? "text-gray-300" : "text-gray-700"
    }`}
  >
    Body Part Examined
  </span>

  <Select
    name="body_part_examined"
    defaultValue={
      selectedReport.body_part_examined
        ? {
            value: selectedReport.body_part_examined,
            label: selectedReport.body_part_examined,
          }
        : null
    }
    options={bodyPartOptions}
    placeholder="Search or select body part..."
    isSearchable
    className="react-select-container"
    classNamePrefix="react-select"
  />
</label>


                  </div>
                </div>

                {/* Clinical Information */}
                <div className={`p-6 rounded-2xl border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100'
                }`}>
                  <h3 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>📋</span>
                    <span>Clinical Information</span>
                  </h3>
                  <div className="space-y-4">
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Clinical Notes</span>
                      <textarea
                        name="notes"
                        defaultValue={selectedReport.notes || ""}
                        rows={4}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter clinical notes and history"
                      />
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col space-y-2">
                        <span className={`text-sm font-semibold ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Referring Doctor</span>
                        <input
                          type="text"
                          name="referring_doctor_name"
                          defaultValue={selectedReport.referring_doctor_name || ""}
                          className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                            darkMode 
                              ? 'bg-gray-600 border-gray-500 text-white' 
                              : 'border-gray-300'
                          }`}
                          placeholder="Enter doctor name"
                        />
                      </label>
                      <label className="flex flex-col space-y-2">
                        <span className={`text-sm font-semibold ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Case Type</span>
                        <div className="flex space-x-4 pt-2">
                          {["VIP", "URGENT", "MLC"].map((option) => (
                            <label key={option} className="inline-flex items-center space-x-2">
                              <input
                                type="radio"
                                name="case_type"
                                value={option}
                                defaultChecked={selectedReport.case_type === option}
                                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                              />
                              <span className={`text-sm font-medium ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>{option}</span>
                            </label>
                          ))}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className={`p-6 rounded-2xl border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-100'
                }`}>
                  <h3 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>📞</span>
                    <span>Contact Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Email Address</span>
                      <input
                        type="email"
                        name="email"
                        defaultValue={selectedReport.email || ""}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                    </label>
                    <label className="flex flex-col space-y-2">
                      <span className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>WhatsApp Number</span>
                      <input
                        type="tel"
                        name="whatsapp_number"
                        defaultValue={selectedReport.whatsapp_number || ""}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                          darkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter WhatsApp number"
                      />
                    </label>
                  </div>
                </div>

              

                                {/* File Upload Section */}
                <div className={`p-6 rounded-2xl border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100'
                     }`}>
                  <h3 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>📎</span>
                    <span>Patient History Files</span>
                  </h3>
                  
                  {/* Show existing history file(s) if any */}
                  {selectedReport.history_files && selectedReport.history_files.length > 0 ? (
                    <div className={`mb-4 p-4 rounded-xl border ${
                      darkMode ? 'bg-gray-600 border-indigo-700' : 'bg-white border-indigo-200'
                    }`}>
                      <h4 className={`text-sm font-semibold mb-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Current Files:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedReport.history_files.map((file, index) => {
                          let fileUrl = file;
                          // Fix malformed URLs starting with "http://localhost/.../https/..."
                          if (fileUrl.includes("/https/")) {
                            fileUrl = fileUrl.split("/https/")[1];
                            fileUrl = "https://" + fileUrl;
                          }

                          return (
                            <a
                              key={index}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-200 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-800 dark:hover:to-indigo-800 border border-blue-200 dark:border-blue-600 transition-all duration-200"
                            >
                              📄 History File {index + 1}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className={`mb-4 p-4 rounded-xl border ${
                      darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'
                    }`}>
                      <p className={`text-sm text-center py-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>No history files uploaded yet</p>
                    </div>
                  )}

                  <label className="flex flex-col space-y-2">
                    <span className={`text-sm font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Upload Additional Files</span>
                    <input
                      type="file"
                      name="history_file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium hover:file:bg-indigo-100 ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white file:bg-indigo-900 file:text-indigo-200' 
                          : 'border-gray-300 file:bg-indigo-50 file:text-indigo-700'
                      }`}
                    />
                    <p className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB per file)
                    </p>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 hover:from-gray-500 hover:to-gray-600 transform hover:scale-105 shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🚪</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Confirm Logout</h2>
                  <p className="text-red-100 text-sm">Are you sure you want to logout?</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className={`mb-6 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                You'll need to login again to access the dashboard.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode 
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>Yes, Logout</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close logout modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
};

export default Coordinator;