import React, { useState, useRef } from 'react';

const CoordinatorHeader = ({ 
  darkMode, 
  setDarkMode, 
  currentCoordinator, 
  firstName, 
  lastName,
  stats 
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 18) return "Good Afternoon";
    else return "Good Evening";
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('darkMode');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className={`sticky top-0 z-50 bg-gradient-to-r shadow-xl border-b ${
      darkMode
        ? 'from-gray-800 to-gray-900 border-gray-700' 
        : 'from-gray-50 to-indigo-900 border-gray-200'
    }`}>
      <div className="w-full px-2 sm:px-3 lg:px-4">
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
                    borderRadius: 6,
                    padding: 2
                  }}
                />
              </span>
            </h1>
          </div>

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
            
              {showProfile && (
                <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border z-50 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                  <div className="p-4">
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

      {showProfile && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfile(false)}
        />
      )}

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-40" 
          onClick={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
};

export default CoordinatorHeader;