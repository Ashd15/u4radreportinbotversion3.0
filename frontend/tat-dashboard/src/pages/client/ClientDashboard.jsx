import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Filter,
  Calendar,
  User,
  FileText,
  FileDown,
  MessageCircle,
  Edit3,
  X,
} from "lucide-react";
import ApiHandler from "./apiHandler"; // En
// Code is write by shyam on the date of 20-09-2025
// remain code updated option(put optain not working) and some ui changes. 

const ClientSidebar = ({ summary }) => (
  <div className="w-64 bg-white shadow-lg p-4">
    <h3 className="font-bold text-lg mb-4">Dashboard Summary</h3>
    <div className="space-y-2 text-sm">
      <div>CT: {summary.ct}</div>
      <div>MRI: {summary.mri}</div>
      <div>X-Ray: {summary.xray}</div>
      <div>Total Sent: {summary.totalSent}</div>
      <div>Total Reported: {summary.totalReported}</div>
      <div>Total Wallet: ${summary.totalWallet}</div>
      <div>Money Left: ${summary.moneyLeft}</div>
    </div>
  </div>
);

const ClientDashboard = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    name: "",
    email: "",
    modality: "",
    status: "",
  });

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await ApiHandler.getDicomReports();
      if (response.success) {
        const transformedData = response.data.map(item => ({
          id:item.id,
          name: item.patient_name || "N/A",
          email: item.email || "N/A",
          testDate: item.recived_on_db ? new Date(item.recived_on_db).toLocaleDateString() : "N/A",
          modality: item.Modality || "N/A",
          reportDate: item.marked_done_at ? new Date(item.marked_done_at).toLocaleDateString() : item.study_description || "N/A",
          location: item.body_part_examined || item.study_description || "N/A",
          status: item.isDone ? "Ready" : "Pending",
          pdfs: [], // Adjust if API returns PDFs
          age: item.age,
          gender: item.gender,
          studyDescription: item.study_description,
          referringDoctor: item.referring_doctor_name,
          whatsappNumber: item.whatsapp_number,
          notes: item.notes,
          bodyPart: item.body_part_examined,
          isVIP: item.vip || false,
          isUrgent: item.urgent || false,
          isMLC: item.Mlc || false,
          studyId: item.study_id,
          contrastUsed: item.contrast_used,
          isFollowUp: item.is_follow_up,
          imagingViews: item.imaging_views,
          inhousePatient: item.inhouse_patient
        }));
        setReports(transformedData);
      } else {
        setError(response.error || "Failed to fetch reports");
      }
    } catch (err) {
      setError("Error fetching reports: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const summary = { ct: 25, mri: 40, xray: 120, totalSent: 185, totalReported: 150, totalWallet: 5000, moneyLeft: 1200 };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    (report.email || "").toLowerCase().includes(filters.email.toLowerCase()) &&
    (filters.modality === "" || report.modality === filters.modality) &&
    (filters.status === "" || report.status === filters.status)
  );

  const handleSaveReport = async (reportData) => {
    try {
      const originalReport = reports.find(r => r.id === selectedReport.id);
      if (!originalReport) return;
      // Prepare API payload from form
      const apiData = { ...reportData };
      // Updating the report (not patient_id)
      const response = await ApiHandler.updateDicomReport(selectedReport.id, apiData);

      if (response.success) {
        await fetchReports();
        setSelectedReport(null);
      } else {
        alert("Failed to update report: " + response.error);
      }
    } catch (err) {
      alert("Error updating report: " + err.message);
    }
  };

  const handleStatusToggle = async (reportId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Ready" ? "Pending" : "Ready";
      const isDone = newStatus === "Ready";
      const response = await ApiHandler.updateDicomReport(reportId, { isDone });
      if (response.success) {
        await fetchReports();
      } else {
        alert("Failed to update status: " + response.error);
      }
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      {showSidebar && <ClientSidebar summary={summary} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-gray-900">U4RAD </span>
              <span className="text-red-500">Reports Dashboard</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Manage, review, and download imaging reports
            </p>
          </div>
          <button
            className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:scale-105 transform transition"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <User className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="border p-2 rounded flex-1"
          />
          <input
            type="text"
            placeholder="Search by Email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            className="border p-2 rounded flex-1"
          />
          <select
            value={filters.modality}
            onChange={(e) => setFilters({ ...filters, modality: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">All Modalities</option>
            <option value="CT">CT</option>
            <option value="MR">MR</option>
            <option value="DX">DX</option>
            <option value="CR">CR</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">All Status</option>
            <option value="Ready">Ready</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4" /> Select All
          </label>
          <span className="text-sm font-semibold text-gray-600">
            👤 Total Reports: {filteredReports.length}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1">
          <div className="overflow-y-auto max-h-[450px]">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-left">Patient ID</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Test Date</th>
                  <th className="p-3 text-left">Modality</th>
                  <th className="p-3 text-left">Study Description</th>
                  <th className="p-3 text-left">Body part</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => (
                  <tr
                    key={report.id}
                    className={`transition hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-gray-50/30" : "bg-white"
                    }`}
                  >
                    <td className="p-3 font-medium text-gray-700">{report.id}</td>
                    <td className="p-3">{report.name}</td>
                    <td className="p-3 text-gray-600">{report.email}</td>
                    <td className="p-3">{report.testDate}</td>
                    <td className="p-3">{report.modality}</td>
                    <td className="p-3">{report.studyDescription}</td>
                    <td className="p-3">{report.location}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          report.status === "Ready"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                        onClick={() => handleStatusToggle(report.id, report.status)}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <button className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
                          <FileText className="w-4 h-4" /> Word
                        </button>
                        {report.pdfs?.map((pdf, i) => (
                          <button
                            key={i}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                            onClick={() => ApiHandler.downloadReport(report.id, 'pdf')}
                          >
                            <FileDown className="w-4 h-4" /> PDF {i + 1}
                          </button>
                        ))}
                        <button className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Edit3 className="w-4 h-4" /> Edit
                        </button>

                        {/* Checkboxes for VIP, Urgent, MLC */}
                        <div className="flex items-center gap-2">
                        <label className="flex items-center text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-1 accent-purple-600"
                            checked={report.isVIP}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              // Optimistically update UI by updating local state
                              setReports(prev =>
                                prev.map(r => r.id === report.id ? { ...r, isVIP: checked } : r)
                              );
                              // Send update to backend
                              try {
                                await ApiHandler.updateDicomReport(report.id, { vip: checked });
                              } catch (error) {
                                // Optional: revert change or show error
                                alert("Failed to update VIP status: " + error.message);
                                // revert state if needed
                                setReports(prev =>
                                  prev.map(r => r.id === report.id ? { ...r, isVIP: !checked } : r)
                                );
                              }
                            }}
                          />
                          VIP
                        </label>

                        <label className="flex items-center text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-1 accent-red-600"
                            checked={report.isUrgent}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              setReports(prev =>
                                prev.map(r => r.id === report.id ? { ...r, isUrgent: checked } : r)
                              );
                              try {
                                await ApiHandler.updateDicomReport(report.id, { urgent: checked });
                              } catch (error) {
                                alert("Failed to update Urgent status: " + error.message);
                                setReports(prev =>
                                  prev.map(r => r.id === report.id ? { ...r, isUrgent: !checked } : r)
                                );
                              }
                            }}
                          />
                          Urgent
                        </label>
                        
                        <label className="flex items-center text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-900 hover:bg-yellow-200 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-1 accent-yellow-500"
                            checked={report.isMLC}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              setReports(prev =>
                                prev.map(r => r.id === report.id ? { ...r, isMLC: checked } : r)
                              );
                              try {
                                await ApiHandler.updateDicomReport(report.id, { Mlc: checked });
                              } catch (error) {
                                alert("Failed to update MLC status: " + error.message);
                                setReports(prev =>
                                  prev.map(r => r.id === report.id ? { ...r, isMLC: !checked } : r)
                                );
                              }
                            }}
                          />
                          MLC
                        </label>
                        
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit DICOM Data</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                // Get form values
                const fd = new FormData(e.target);
                const newData = {};
                fd.forEach((value, key) => newData[key] = value);
                handleSaveReport(newData);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col">
                  <span>Name:</span>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedReport.name}
                    className="border rounded p-2"
                  />
                </label>
                <label className="flex flex-col">
                  <span>Patient Id:</span>
                  <input
                    type="text"
                    name="patient_id"
                    defaultValue={selectedReport.id}
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
                    defaultValue={selectedReport.testDate}
                    className="border rounded p-2"
                  />
                </label>
                <label className="flex flex-col">
                  <span>Study Description:</span>
                  <input
                    type="text"
                    name="study_description"
                    defaultValue={selectedReport.studyDescription || ""}
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
                  name="body_part"
                  defaultValue={selectedReport.bodyPart || "NA"}
                  className="border rounded p-2"
                >
                  <option value="NA" disabled>Select Body Part</option>
                  <option value="Head">Head</option>
                  <option value="Brain">Brain</option>
                  <option value="Neck">Neck</option>
                  <option value="Chest">Chest</option>
                  <option value="Lungs">Lungs</option>
                  <option value="Heart">Heart</option>
                  <option value="Abdomen">Abdomen</option>
                  <option value="Liver">Liver</option>
                  <option value="Kidney">Kidney</option>
                  <option value="Stomach">Stomach</option>
                  <option value="Pelvis">Pelvis</option>
                  <option value="Spine">Spine</option>
                  <option value="Shoulder">Shoulder</option>
                  <option value="Arm">Arm</option>
                  <option value="Elbow">Elbow</option>
                  <option value="Wrist">Wrist</option>
                  <option value="Hand">Hand</option>
                  <option value="Hip">Hip</option>
                  <option value="Knee">Knee</option>
                  <option value="Ankle">Ankle</option>
                  <option value="Foot">Foot</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="flex flex-col">
                <span>Referring Doctor Name:</span>
                <input
                  type="text"
                  name="referring_doctor"
                  defaultValue={selectedReport.referringDoctor || ""}
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
                  defaultValue={selectedReport.whatsappNumber || ""}
                  className="border rounded p-2"
                />
              </label>
              <label className="flex flex-col">
                <span>Patient History File:</span>
                <input type="file" className="border rounded p-2" />
              </label>

              {/* Checklist Section */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Checklist for Radiographer / Coordinator (Pre-Scan Verification)
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p>1. Body Part Confirmation</p>
                    <p className="text-gray-600 ml-2">
                      ➝ Have you filled the body part details? (Coordinator/Client)
                    </p>
                  </div>
                  <div>
                    <p>2. Contrast Imaging Verification</p>
                    <label className="mr-4">
                      <input
                        type="checkbox"
                        className="mr-1"
                        defaultChecked={selectedReport.contrastUsed}
                      /> Yes
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        className="mr-1"
                        defaultChecked={!selectedReport.contrastUsed}
                      /> No
                    </label>
                  </div>
                  <div>
                    <p>3. Comparative / Follow-Up Verification</p>
                    <label className="mr-4">
                      <input
                        type="checkbox"
                        className="mr-1"
                        defaultChecked={selectedReport.isFollowUp}
                      /> Yes
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        className="mr-1"
                        defaultChecked={!selectedReport.isFollowUp}
                      /> No
                    </label>
                  </div>
                  <div>
                    <p>4. Imaging View Verification (for X-ray)</p>
                    <div className="flex flex-wrap gap-4 ml-2">
                      <label>
                        <input type="checkbox" className="mr-1" /> AP
                      </label>
                      <label>
                        <input type="checkbox" className="mr-1" /> PA
                      </label>
                      <label>
                        <input type="checkbox" className="mr-1" /> Lateral
                      </label>
                      <label>
                        <input type="checkbox" className="mr-1" /> Oblique
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
