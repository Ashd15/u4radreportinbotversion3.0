import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Eye, Grid, List, Sun, Moon, Save, X, Check, AlertTriangle } from 'lucide-react';
import ApiHandlerSuperCoordinator from './apiHandlerSuperCoordinator';
import { useNavigate } from 'react-router-dom';


// Main SuperCoordinator Panel Component
const SuperCoordinatorPanel = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [apiHandler] = useState(new ApiHandlerSuperCoordinator());
  const navigate = useNavigate();

  
  // Form state for creating/editing clients
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution_names: [''],
    password: '',
    can_edit_patient_name: false,
    can_edit_patient_id: false,
    can_edit_age: true,
    can_edit_gender: true,
    can_edit_study_date: false,
    can_edit_study_description: false,
    can_edit_notes: true,
    can_edit_body_part_examined: false,
    can_edit_referring_doctor_name: false,
    can_edit_whatsapp_number: true,
    can_edit_email: true,
    can_edit_contrast_used: false,
    can_edit_is_follow_up: false,
    can_edit_inhouse_patient: true,
    upload_header: null,
    upload_footer: null,
  });

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await apiHandler.getAllClients();
      setClients(clientsData);
      setError(null);
    } catch (err) {
      setError('Failed to load clients. Please check if the API server is running.');
      // Mock data for demonstration when API is not available
      setClients([
        {
          id: 1,
          name: "Demo Client",
          email: "demo@example.com",
          institutions: [{ id: 1, name: "Demo Institution" }],
          tbclient: false,
          can_edit_patient_name: true,
          can_edit_age: true,
          user: 1
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      const clientData = {
        ...formData,
        password: formData.password || 'U4rad@2025', // Default password
        institution_names: formData.institution_names.filter(name => name.trim() !== '')
      };
      
      const newClient = await apiHandler.createClient(clientData);
      setClients([...clients, newClient]);
      resetForm();
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Failed to create client');
    }
  };

  const handleUpdateClient = async () => {
    try {
      const clientData = {
        ...formData,
        institution_names: formData.institution_names.filter(name => name.trim() !== '')
      };
      
      const updatedClient = await apiHandler.updateClient(editingClient.id, clientData);
      setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c));
      resetForm();
      setEditingClient(null);
    } catch (err) {
      setError('Failed to update client');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      institution_names: [''],
      password: '',
      can_edit_patient_name: false,
      can_edit_patient_id: false,
      can_edit_age: true,
      can_edit_gender: true,
      can_edit_study_date: false,
      can_edit_study_description: false,
      can_edit_notes: true,
      can_edit_body_part_examined: false,
      can_edit_referring_doctor_name: false,
      can_edit_whatsapp_number: true,
      can_edit_email: true,
      can_edit_contrast_used: false,
      can_edit_is_follow_up: false,
      can_edit_inhouse_patient: true,
      upload_header: null,
      upload_footer: null,
    });
  };

  const startEdit = (client) => {
    setEditingClient(client);
    setFormData({
      ...client,
      institution_names: client.institutions.map(inst => inst.name),
      password: client.password || ''
    });
  };

  const addInstitutionField = () => {
    setFormData({
      ...formData,
      institution_names: [...formData.institution_names, '']
    });
  };

  const updateInstitutionField = (index, value) => {
    const updated = [...formData.institution_names];
    updated[index] = value;
    setFormData({
      ...formData,
      institution_names: updated
    });
  };

  const removeInstitutionField = (index) => {
    const updated = formData.institution_names.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      institution_names: updated.length ? updated : ['']
    });
  };

  const theme = darkMode ? 'dark' : 'light';
  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 ${textClass}`}>Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`${cardBgClass} rounded-lg shadow-lg p-6 mb-6 border ${borderClass}`}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
             
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
        onClick={() => navigate('/PatientRecordsSearch')}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Go to Patient Records
      </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {/* View Mode Toggle */}
              <div className={`flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1`}>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-500 text-white' : ''}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : ''}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
              
              {/* Add Client Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className="text-2xl font-bold text-blue-500">{clients.length}</div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Clients</div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <div className="text-2xl font-bold text-green-500">
                {clients.filter(c => !c.tbclient).length}
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Clients</div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
              <div className="text-2xl font-bold text-purple-500">
                {clients.reduce((acc, c) => acc + c.institutions?.length || 0, 0)}
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Institutions</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingClient) && (
          <div className={`${cardBgClass} rounded-lg shadow-lg p-6 mb-6 border ${borderClass}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingClient ? 'Edit Client' : 'Create New Client'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingClient(null);
                  resetForm();
                }}
                className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter client name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Leave empty for default (U4rad@2025)"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Institutions</label>
                    <button
                      onClick={addInstitutionField}
                      className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.institution_names.map((institution, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => updateInstitutionField(index, e.target.value)}
                          className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Institution name"
                        />
                        {formData.institution_names.length > 1 && (
                          <button
                            onClick={() => removeInstitutionField(index)}
                            className="text-red-500 hover:text-red-600 px-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Edit Permissions</h3>
                
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {Object.entries(formData).map(([key, value]) => {
                    if (key.startsWith('can_edit_') && typeof value === 'boolean') {
                      const label = key.replace('can_edit_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setFormData({...formData, [key]: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingClient(null);
                  resetForm();
                }}
                className={`px-4 py-2 border rounded-lg ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={editingClient ? handleUpdateClient : handleCreateClient}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="h-4 w-4" />
                {editingClient ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </div>
        )}

        {/* Clients Display */}
        {viewMode === 'table' ? (
          // Table View
          <div className={`${cardBgClass} rounded-lg shadow-lg border ${borderClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="text-left p-4 font-medium">ID</th>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Institutions</th>
                    <th className="text-left p-4 font-medium">TB Client</th>
                    <th className="text-left p-4 font-medium">User ID</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className={`border-t ${borderClass} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                      <td className="p-4">{client.id}</td>
                      <td className="p-4 font-medium">{client.name}</td>
                      <td className="p-4">{client.email}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {client.institutions?.map((inst) => (
                            <span key={inst.id} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded">
                              {inst.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          client.tbclient 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {client.tbclient ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-4">{client.user}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(client)}
                            className="text-blue-500 hover:text-blue-600 p-1"
                            title="Edit Client"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div key={client.id} className={`${cardBgClass} rounded-lg shadow-lg p-6 border ${borderClass} hover:shadow-xl transition-shadow`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{client.name}</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>ID: {client.id}</p>
                  </div>
                  <button
                    onClick={() => startEdit(client)}
                    className="text-blue-500 hover:text-blue-600 p-2"
                    title="Edit Client"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{client.email}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Institutions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {client.institutions?.map((inst) => (
                        <span key={inst.id} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded">
                          {inst.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium">TB Client:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        client.tbclient 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {client.tbclient ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>User: {client.user}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500">
                      Active Permissions: {Object.entries(client).filter(([key, value]) => 
                        key.startsWith('can_edit_') && value === true
                      ).length}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {clients.length === 0 && !loading && (
          <div className={`${cardBgClass} rounded-lg shadow-lg p-12 text-center border ${borderClass}`}>
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Clients Found</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Start by creating your first client to manage their permissions and institutions.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create First Client
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperCoordinatorPanel;