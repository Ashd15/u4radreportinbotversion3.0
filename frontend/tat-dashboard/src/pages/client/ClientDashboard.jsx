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
  LogOut ,
} from "lucide-react";
import ApiHandler from "./apiHandler";
import ClientSidebar from "./ClientSidebar";

// const ClientSidebar = ({ summary }) => (
//   <div className="w-64 bg-white shadow-lg p-4">
//     <h3 className="font-bold text-lg mb-4">Dashboard Summary</h3>
//     <div className="space-y-2 text-sm">
//       <div className="flex justify-between">
//         <span>CT:</span>
//         <span className="font-semibold text-blue-600">{summary.ct}</span>
//       </div>
//       <div className="flex justify-between">
//         <span>MRI:</span>
//         <span className="font-semibold text-green-600">{summary.mri}</span>
//       </div>
//       <div className="flex justify-between">
//         <span>X-Ray:</span>
//         <span className="font-semibold text-purple-600">{summary.xray}</span>
//       </div>
//       <hr className="my-2" />
//       <div className="flex justify-between">
//         <span>Total Sent:</span>
//         <span className="font-semibold text-gray-800">{summary.totalSent}</span>
//       </div>
//       <div className="flex justify-between">
//         <span>Total Reported:</span>
//         <span className="font-semibold text-green-600">{summary.totalReported}</span>
//       </div>
//       <div className="flex justify-between">
//         <span>Total Pending:</span>
//         <span className="font-semibold text-yellow-600">{summary.totalPending}</span>
//       </div>
//       <hr className="my-2" />
//       <div className="flex justify-between">
//         <span>Total Wallet:</span>
//         <span className="font-semibold text-emerald-600">${summary.totalWallet}</span>
//       </div>
//       <div className="flex justify-between">
//         <span>Money Left:</span>
//         <span className="font-semibold text-red-600">${summary.moneyLeft}</span>
//       </div>
      
//       {/* Progress bars for visual representation */}
//       <div className="mt-4 space-y-2">
//         <div>
//           <div className="text-xs text-gray-600 mb-1">Completion Rate</div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div 
//               className="bg-green-500 h-2 rounded-full" 
//               style={{ width: `${summary.totalSent > 0 ? (summary.totalReported / summary.totalSent) * 100 : 0}%` }}
//             ></div>
//           </div>
//           <div className="text-xs text-gray-500 mt-1">
//             {summary.totalSent > 0 ? Math.round((summary.totalReported / summary.totalSent) * 100) : 0}%
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// );

const ClientDashboard = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [bodyParts, setBodyParts] = useState([]);
  const reportsPerPage = 50;
  const user = JSON.parse(localStorage.getItem("user"))?.user;
  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";

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


  useEffect(() => {
  fetchBodyParts();
}, []);

const fetchBodyParts = async () => {
  const response = await ApiHandler.getBodyParts();
  if (response.success) {
    setBodyParts(response.data);
  } else {
    console.error("Failed to fetch body parts:", response.error);
  }
};


  //Reset Page When Filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await ApiHandler.getDicomReports();
      if (response.success) {
        const transformedData = response.data.map(item => ({
          id: item.id,
          patient_id: item.patient_id,
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

  // Calculate dynamic summary from reports data
  const summary = React.useMemo(() => {
    const ct = reports.filter(report => report.modality === 'CT').length;
    const mri = reports.filter(report => report.modality === 'MR').length;
    const xray = reports.filter(report => report.modality === 'DX' || report.modality === 'CR').length;
    const totalSent = reports.length;
    const totalReported = reports.filter(report => report.status === 'Ready').length;
    const totalPending = reports.filter(report => report.status === 'Pending').length;
    
    // You can adjust these calculations based on your business logic
    const totalWallet = 5000; // This might come from a separate API call
    const moneyLeft = totalWallet - (totalReported * 10); // Example: $10 per report
    
    return {
      ct,
      mri,
      xray,
      totalSent,
      totalReported,
      totalPending,
      totalWallet,
      moneyLeft: Math.max(0, moneyLeft) // Ensure it doesn't go negative
    };
  }, [reports]);

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    (report.email || "").toLowerCase().includes(filters.email.toLowerCase()) &&
    (filters.modality === "" || report.modality === filters.modality) &&
    (filters.status === "" || report.status === filters.status)
  );

  const handleSaveReport = async (reportData, historyFiles = null) => {
    try {
      const originalReport = reports.find(r => r.id === selectedReport.id);
      if (!originalReport) return;
      
      // Map frontend field names to backend field names
      const apiData = {
        patient_name: reportData.patient_name,
        patient_id: reportData.patient_id,
        age: reportData.age,
        gender: reportData.gender,
        study_description: reportData.study_description,
        notes: reportData.notes,
        body_part_examined: reportData.body_part_examined,
        referring_doctor_name: reportData.referring_doctor_name,
        email: reportData.email,
        whatsapp_number: reportData.whatsapp_number,
        contrast_used: reportData.contrast_used === 'true' || reportData.contrast_used === true,
        is_follow_up: reportData.is_follow_up === 'true' || reportData.is_follow_up === true,
        imaging_views: reportData.imaging_views
      };
      
      
      
      const response = await ApiHandler.updateDicomReport(selectedReport.id, apiData);

      if (response.success) {
        // If there's a history file, upload it separately
        if (historyFiles && historyFiles.length > 0) {
          setUploadingFile(true);
          const uploadResponse = await ApiHandler.uploadHistoryFile(selectedReport.id, historyFiles);
          setUploadingFile(false);
          
          if (!uploadResponse.success) {
            alert("Report updated but history file upload failed: " + uploadResponse.error);
          } else {
            alert("Report updated and history file uploaded successfully!");
          }
        }
        
        await fetchReports();
        setSelectedReport(null);
      } else {
        alert("Failed to update report: " + response.error);
      }
    } catch (err) {
      setUploadingFile(false);
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

  //Pagination Logic
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 18) return "Good Afternoon";
    else return "Good Evening";
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
    <>
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      {showSidebar && <ClientSidebar summary={summary} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className={'text-white'}>
                 <img
                   src="https://u4rad.com/static/media/Logo.c9920d154c922ea9e355.png"
                   alt="U4rad"
                   style={{
                     height: 50,
                     backgroundColor: 'transparent',
                     borderRadius: 6, // optional
                     padding: 2        // optional (to give space around logo)
                   }}
                 />
               </span>
               
            </h1>
          
          </div>
          <div className="flex items-center gap-3">
              <h2
  style={{
    fontSize: 18,
    margin: 0,
    fontWeight: 600,
    color:'#0B0B0B',
    display: window.innerWidth <= 600 ? 'none' : 'block',
  }}
>
  {getGreeting()}, {firstName} {lastName}
</h2>
    {/* Logout Button */}
    <button
      onClick={() => {
        // Clear stored tokens or user data
        localStorage.removeItem("token");
        sessionStorage.clear();

        // Redirect to login
        window.location.href = "/login";
      }}
      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
    >
      <LogOut className="w-5 h-5" />
      <span className="hidden sm:inline font-medium">Logout</span>
    </button>

    {/* Sidebar toggle button */}
    <button
      className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:scale-105 transform transition"
      onClick={() => setShowSidebar(!showSidebar)}
    >
      <User className="w-6 h-6 text-white" />
    </button>
  </div>
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
                {paginatedReports.map((report, index)=> (
                  <tr
                    key={report.id}
                    className={`transition hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-gray-50/30" : "bg-white"
                    }`}
                  >
                    <td className="p-3 font-medium text-gray-700">{report.patient_id}</td>
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
                              setReports(prev =>
                                prev.map(r => r.id === report.id ? { ...r, isVIP: checked } : r)
                              );
                              try {
                                await ApiHandler.updateDicomReport(report.id, { vip: checked });
                              } catch (error) {
                                alert("Failed to update VIP status: " + error.message);
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 rounded ${currentPage === i + 1
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
            </div> 
            
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
                const fd = new FormData(e.target);
                const newData = {};
                fd.forEach((value, key) => {
                  if (key !== 'history_file') {
                    newData[key] = value;
                  }
                });
                
                // Get the history file separately
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
                    defaultValue={selectedReport.name}
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
    name="body_part_examined"
    value={selectedReport?.bodyPart || ""}
    onChange={(e) =>
      setSelectedReport((prev) => ({ ...prev, bodyPart: e.target.value }))
    }
    className="border rounded p-2"
  >
    <option value="" disabled>
      Select Body Part
    </option>
    {bodyParts.map((part) => (
      <option key={part.id} value={part.name}>
        {part.name}
      </option>
    ))}
  </select>
</label>


              <label className="flex flex-col">
                <span>Referring Doctor Name:</span>
                <input
                  type="text"
                  name="referring_doctor_name"
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
                <input 
                  type="file" 
                  name="history_file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="border rounded p-2" 
                />
                <span className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
                </span>
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
                        type="radio"
                        name="contrast_used"
                        value="true"
                        className="mr-1"
                        defaultChecked={selectedReport.contrastUsed}
                      /> Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="contrast_used"
                        value="false"
                        className="mr-1"
                        defaultChecked={!selectedReport.contrastUsed}
                      /> No
                    </label>
                  </div>
                  <div>
                    <p>3. Comparative / Follow-Up Verification</p>
                    <label className="mr-4">
                      <input
                        type="radio"
                        name="is_follow_up"
                        value="true"
                        className="mr-1"
                        defaultChecked={selectedReport.isFollowUp}
                      /> Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="is_follow_up"
                        value="false"
                        className="mr-1"
                        defaultChecked={!selectedReport.isFollowUp}
                      /> No
                    </label>
                  </div>
                  <div>
                    <p>4. Imaging View Verification (for X-ray)</p>
                    <div className="flex flex-wrap gap-4 ml-2">
                      <label>
                        <input type="checkbox" name="imaging_views" value="AP" className="mr-1" /> AP
                      </label>
                      <label>
                        <input type="checkbox" name="imaging_views" value="PA" className="mr-1" /> PA
                      </label>
                      <label>
                        <input type="checkbox" name="imaging_views" value="Lateral" className="mr-1" /> Lateral
                      </label>
                      <label>
                        <input type="checkbox" name="imaging_views" value="Oblique" className="mr-1" /> Oblique
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
                  disabled={uploadingFile}
                  className={`px-4 py-2 rounded text-white ${
                    uploadingFile 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {uploadingFile ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </>
  );
};

export default ClientDashboard;