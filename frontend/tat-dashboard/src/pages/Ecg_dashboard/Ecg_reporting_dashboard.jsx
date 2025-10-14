import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { getGreeting, getLocations, getPatients, getDoctorStats } from "./Ecg_handlers";

const CardiologistDashboard = () => {
  const navigate = useNavigate();

  // ✅ Extract logged-in user info properly
  const storedData = JSON.parse(localStorage.getItem("user"));
  const doctorUsername = storedData?.user?.username || "";
  const doctorName =
    storedData?.user?.first_name
      ? `${storedData.user.first_name} ${storedData.user.last_name || ""}`.trim()
      : "Doctor";

  const [greeting, setGreeting] = useState("");
  const [locations, setLocations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    location: "",
    test_date: "",
    search: "",
  });
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Redirect to login if not logged in
  useEffect(() => {
    if (!storedData || !doctorUsername) {
      navigate("/");
    }
  }, [navigate, storedData, doctorUsername]);

  // ✅ Fetch greeting
  useEffect(() => {
    getGreeting().then(setGreeting);
  }, []);

  // ✅ Fetch locations
  useEffect(() => {
    getLocations().then(setLocations);
  }, []);

  // ✅ Fetch patients list
  const fetchPatients = () => {
    getPatients(doctorUsername, filters).then(setPatients);
  };


  useEffect(() => {
    fetchPatients();
  }, [filters, doctorUsername]);

  // ✅ Fetch doctor stats
  useEffect(() => {
    getDoctorStats(doctorUsername).then(setStats);
  }, [doctorUsername]);

  // ✅ Navigate to ECG report page
  const goToReport = (patientId) => {
    navigate(`/ecg-report/${patientId}`, { state: { doctorUsername } });
  };

  // ✅ Logout user
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen`}>
      <div className="bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-all duration-500">
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-3 shadow-md bg-white dark:bg-gray-950">
          <div className="flex items-center space-x-3">
            <img
              src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
              alt="U4rad"
              className="h-10 p-1 bg-transparent dark:bg-white rounded"
            />
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-lg font-semibold">
              {greeting && doctorName
                ? `${greeting}, ${doctorName}!`
                : greeting
                ? `${greeting}, Doctor!`
                : "Welcome, Doctor!"}
            </span>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800 transition"
              title="Logout"
            >
              <LogOut size={20} className="text-red-600 dark:text-red-400" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6">
          {/* Stats Section */}
          <div className="bg-red-100 dark:bg-red-900 rounded-xl p-4 mb-6 shadow">
            <h2 className="font-bold text-lg mb-2">Your Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <p className="text-sm">Total Reported</p>
                <p className="font-bold text-red-600 dark:text-red-400">{stats.total_reported}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <p className="text-sm">Current Allocated</p>
                <p className="font-bold text-red-600 dark:text-red-400">{stats.current_allocated}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <p className="text-sm">Current Reported</p>
                <p className="font-bold text-red-600 dark:text-red-400">{stats.current_reported}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700 w-full sm:w-auto"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.test_date}
              onChange={(e) => setFilters({ ...filters, test_date: e.target.value })}
              className="border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700 w-full sm:w-auto"
            />

            <input
              type="text"
              placeholder="Search Patient"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700 flex-grow"
            />

            <button
              onClick={fetchPatients}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition w-full sm:w-auto"
            >
              Filter
            </button>
          </div>

          {/* Patient List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-200 dark:bg-gray-800">
                <tr>
                  <th className="p-2 border dark:border-gray-700">Patient Name</th>
                  <th className="p-2 border dark:border-gray-700">Age</th>
                  <th className="p-2 border dark:border-gray-700">Gender</th>
                  <th className="p-2 border dark:border-gray-700">Heart Rate</th>
                  <th className="p-2 border dark:border-gray-700">Test Date</th>
                  <th className="p-2 border dark:border-gray-700">Location</th>
                  <th className="p-2 border dark:border-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <td className="p-2 border dark:border-gray-700">{p.PatientName}</td>
                    <td className="p-2 border dark:border-gray-700">{p.age}</td>
                    <td className="p-2 border dark:border-gray-700">{p.gender}</td>
                    <td className="p-2 border dark:border-gray-700">{p.HeartRate}</td>
                    <td className="p-2 border dark:border-gray-700">{p.TestDate}</td>
                    <td className="p-2 border dark:border-gray-700">{p.location?.name}</td>
                    <td className="p-2 border dark:border-gray-700 text-center">
                      <button
                        onClick={() => goToReport(p.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                      >
                        Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length === 0 && (
              <p className="text-center text-gray-500 mt-4">No patients found</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CardiologistDashboard;
