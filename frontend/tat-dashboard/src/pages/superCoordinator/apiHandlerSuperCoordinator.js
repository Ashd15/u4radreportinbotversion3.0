// API Handler Class
class ApiHandlerSuperCoordinator {
  constructor(baseUrl = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getAllClients() {
    return this.makeRequest('/supercoordinator/clients/');
  }

  async createClient(clientData) {
    return this.makeRequest('/supercoordinator/clients/', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(clientId, clientData) {
    return this.makeRequest(`/supercoordinator/clients/${clientId}/`, {
      method: 'PATCH',
      body: JSON.stringify(clientData),
    });
  }

  async getAllRadiologists() {
    return this.makeRequest('/supercoordinator/radiologists/');
  }

  async getAllInstitutions() {
    return this.makeRequest('/supercoordinator/institutions/');
  }

  async getAllModalities() {
    return this.makeRequest('/supercoordinator/modalities/');
  }

  async getAllServices() {
    return this.makeRequest('/supercoordinator/services/');
  }

  async getServiceTATSettings() {
    return this.makeRequest('/supercoordinator/service-tat-settings/');
  }

  async createServiceTATSetting(tatData) {
    return this.makeRequest('/supercoordinator/service-tat-settings/', {
      method: 'POST',
      body: JSON.stringify(tatData),
    });
  }

  async updateServiceTATSetting(tatId, tatData) {
    return this.makeRequest(`/supercoordinator/service-tat-settings/${tatId}/`, {
      method: 'PATCH',
      body: JSON.stringify(tatData),
    });
  }

  async getPatients(filterParams = {}) {
    const params = new URLSearchParams();
    
    if (filterParams.patientName) params.append('name', filterParams.patientName);
    if (filterParams.startDate) params.append('start_date', filterParams.startDate);
    if (filterParams.endDate) params.append('end_date', filterParams.endDate);
    if (filterParams.receivedStartDate) params.append('received_start_date', filterParams.receivedStartDate);
    if (filterParams.receivedEndDate) params.append('received_end_date', filterParams.receivedEndDate);
    
    filterParams.modality?.forEach(m => params.append('Modality', m));
    filterParams.radiologist?.forEach(r => params.append('radiologist', r));
    filterParams.institution?.forEach(i => params.append('institution', i));
    
    if (filterParams.status && filterParams.status !== 'All') {
      params.append('status', filterParams.status.toLowerCase());
    }

    if (filterParams.export) {
      params.append('export', '1');
    }

    const queryString = params.toString();
    return this.makeRequest(`/supercoordinator/patients/${queryString ? '?' + queryString : ''}`);
  }

  getExportURL(filterParams = {}) {
    const params = new URLSearchParams();
    
    if (filterParams.patientName) params.append('name', filterParams.patientName);
    if (filterParams.startDate) params.append('start_date', filterParams.startDate);
    if (filterParams.endDate) params.append('end_date', filterParams.endDate);
    if (filterParams.receivedStartDate) params.append('received_start_date', filterParams.receivedStartDate);
    if (filterParams.receivedEndDate) params.append('received_end_date', filterParams.receivedEndDate);
    
    filterParams.modality?.forEach(m => params.append('Modality', m));
    filterParams.radiologist?.forEach(r => params.append('radiologist', r));
    filterParams.institution?.forEach(i => params.append('institution', i));
    
    if (filterParams.status && filterParams.status !== 'All') {
      params.append('status', filterParams.status.toLowerCase());
    }
    
    params.append('export', '1');

    return `${this.baseUrl}/supercoordinator/patients/?${params.toString()}`;
  }

  async getClientNames() {
    return this.makeRequest('/supercoordinator/clientss/');
  }
}
export default ApiHandlerSuperCoordinator;