import React, { useState, useEffect } from 'react';
import { Search, Download, RotateCcw, Calendar, Filter } from 'lucide-react';

import ApiHandlerSuperCoordinator from './apiHandlerSuperCoordinator';

export default function PatientRecordsSearch() {
  const [filters, setFilters] = useState({
    patientName: '',
    startDate: '',
    endDate: '',
    receivedStartDate: '',
    receivedEndDate: '',
    modality: [],
    radiologist: [],
    status: 'All',
    institution: []
  });

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radiologists, setRadiologists] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [api] = useState(() => new ApiHandlerSuperCoordinator());

  useEffect(() => {
    fetchInitialData();
    fetchPatients();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [radData, instData, modData] = await Promise.all([
        api.getAllRadiologists(),
        api.getAllInstitutions(),
        api.getAllModalities()
      ]);

      setRadiologists(radData);
      setInstitutions(instData);
      setModalities(modData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchPatients = async (filterParams = {}) => {
    setLoading(true);
    try {
      const data = await api.getPatients(filterParams);
      setPatients(data.results || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
    setLoading(false);
  };

  const handleApplyFilters = () => {
    fetchPatients(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      patientName: '',
      startDate: '',
      endDate: '',
      receivedStartDate: '',
      receivedEndDate: '',
      modality: [],
      radiologist: [],
      status: 'All',
      institution: []
    };
    setFilters(resetFilters);
    fetchPatients();
  };

 const handleExportExcel = async () => {
  try {
    setLoading(true);
    await api.exportPatients(filters);
    // Optional: Show success message
    alert('Excel file downloaded successfully!');
  } catch (error) {
    console.error('Error exporting Excel:', error);
    alert('Failed to export Excel. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleMultiSelect = (field, value) => {
    setFilters(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full h-full">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Search className="text-blue-600" size={32} />
            Search Patient Records
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Patient Name:
              </label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={filters.patientName}
                onChange={(e) => setFilters({...filters, patientName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date:
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date:
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Received Start Date:
              </label>
              <input
                type="date"
                value={filters.receivedStartDate}
                onChange={(e) => setFilters({...filters, receivedStartDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Received End Date:
              </label>
              <input
                type="date"
                value={filters.receivedEndDate}
                onChange={(e) => setFilters({...filters, receivedEndDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Modality:
              </label>
              <select
                multiple
                value={filters.modality}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters({...filters, modality: selected});
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size="3"
              >
                {modalities.map(mod => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Radiologist:
              </label>
              <select
                multiple
                value={filters.radiologist}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters({...filters, radiologist: selected});
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size="3"
              >
                {radiologists.map(rad => (
                  <option key={rad.id} value={rad.id}>
                    {rad.name} {rad.email && `(${rad.email})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status:
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Reported">Reported</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Institution Name:
              </label>
              <select
                multiple
                value={filters.institution}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters({...filters, institution: selected});
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size="3"
              >
                {institutions.map(inst => (
                  <option key={inst.name} value={inst.name}>{inst.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleApplyFilters}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Filter size={20} />
              Apply Filters
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Download size={20} />
              Get Excel
            </button>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <RotateCcw size={20} />
              Reset Filters
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Patient Records ({patients.length})
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading patient records...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No patient records found</p>
              <p className="text-sm">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Age/Gender</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Study Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Received On</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Modality</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Institution</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Radiologists</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(patient => (
                    <tr key={patient.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">{patient.patient_name}</td>
                      <td className="px-4 py-3 text-sm">{patient.patient_id}</td>
                      <td className="px-4 py-3 text-sm">{patient.age} / {patient.gender}</td>
                      <td className="px-4 py-3 text-sm">{patient.study_date || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(patient.recived_on_db)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {patient.Modality || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{patient.institution_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          patient.isDone 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {patient.isDone ? 'Reported' : 'Pending'}
                        </span>
                        {patient.urgent && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            Urgent
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {patient.radiologists.length > 0 
                          ? patient.radiologists.join(', ')
                          : 'Not assigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}