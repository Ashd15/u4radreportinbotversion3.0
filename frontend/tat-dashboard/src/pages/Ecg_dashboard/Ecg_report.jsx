import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { X, FileText, Check, Eye } from "lucide-react";
import { fetchPatientDetails, previewReport as generatePreview, finalizeReport } from "./Ecg_handlers";
import { API_BASE_URL } from "../Api/apiconnector";

const PatientReportPage = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const doctorUsername = location.state?.doctorUsername;

  const [patient, setPatient] = useState(null);
  const [ecgFindings, setEcgFindings] = useState("");
  const [customFinding, setCustomFinding] = useState("");
  const [additionalFindings, setAdditionalFindings] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ECG dropdown options
  const ecgOptions = [
    "Normal ECG",
    "Sinus rhythm with incomplete RBBB",
    "Sinus Tachycardia with incomplete RBBB",
    "Sinus Bradycardia with incomplete RBBB",
    "Sinus Bradycardia",
    "Sinus Tachycardia",
    "Normal sinus rhythm with t inversion in lead III",
    "Other",
  ];

  // Fetch patient details
  useEffect(() => {
    fetchPatientDetails(patientId, doctorUsername, setPatient);
  }, [patientId, doctorUsername]);

  const handlePreview = async () => {
    const finalFindings = ecgFindings === "Other" ? customFinding : ecgFindings;
    
    if (!finalFindings.trim()) {
      alert("Please select or enter ECG findings");
      return;
    }

    setLoading(true);
    await generatePreview(
      patient.id,
      doctorUsername,
      finalFindings,
      additionalFindings,
      setPreviewData
    );
    setLoading(false);
  };

  const handleFinalize = async () => {
    const finalFindings = ecgFindings === "Other" ? customFinding : ecgFindings;
    
    if (!finalFindings.trim()) {
      alert("Please select or enter ECG findings");
      return;
    }

    if (!window.confirm("Are you sure you want to finalize this report?")) {
      return;
    }

    setLoading(true);
    const success = await finalizeReport(
      patient.id,
      doctorUsername,
      finalFindings,
      additionalFindings
    );
    setLoading(false);

    if (success) {
      navigate("/cardiologist-dashboard");
    }
  };

  const handleClose = () => {
    if (window.confirm("Are you sure you want to leave? Any unsaved changes will be lost.")) {
      navigate("/cardiologist-dashboard");
    }
  };

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg">Loading patient details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {patient.PatientName}'s Report
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {patient.age} yrs • {patient.gender} • {patient.TestDate}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {/* ECG Image Section */}
        {patient.image && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <label className="font-semibold block mb-3 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              ECG Image
            </label>
            <div className="flex justify-center overflow-x-auto">
              <img
                src={`${API_BASE_URL}${patient.image}`}
                alt="ECG"
                className="max-w-full h-auto border rounded-lg shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          {/* ECG Findings Dropdown */}
          <div className="mb-6">
            <label className="font-semibold block mb-2 text-base sm:text-lg">
              ECG Findings *
            </label>
            <select
              className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={ecgFindings}
              onChange={(e) => setEcgFindings(e.target.value)}
            >
              <option value="">Select ECG Finding</option>
              {ecgOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {/* Custom Finding Input */}
            {ecgFindings === "Other" && (
              <input
                type="text"
                placeholder="Enter custom ECG finding"
                className="border border-gray-300 p-3 w-full mt-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={customFinding}
                onChange={(e) => setCustomFinding(e.target.value)}
              />
            )}
          </div>

          {/* Additional Findings */}
          <div className="mb-6">
            <label className="font-semibold mb-2 block text-base sm:text-lg">
              Additional Findings
            </label>
            <textarea
              placeholder="Enter any additional observations or notes..."
              className="border border-gray-300 w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              rows="4"
              value={additionalFindings}
              onChange={(e) => setAdditionalFindings(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              {loading ? "Loading..." : "Preview PDF"}
            </button>
            <button
              onClick={handleFinalize}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {loading ? "Processing..." : "Finalize PDF"}
            </button>
          </div>
        </div>

        {/* Preview Report Section */}
        {previewData && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 relative">
            <button
              onClick={() => setPreviewData(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            
            <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-800 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Report Preview
            </h3>
            
            <div className="prose max-w-none mb-4">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {previewData.report_text}
              </p>
            </div>

            {previewData.ecg_image_base64 && (
              <div className="mt-4 flex justify-center overflow-x-auto">
                <img
                  src={previewData.ecg_image_base64}
                  alt="ECG Preview"
                  className="max-w-full h-auto border rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientReportPage;