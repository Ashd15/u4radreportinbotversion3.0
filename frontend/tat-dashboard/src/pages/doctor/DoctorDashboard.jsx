
import React, { useState, useEffect } from 'react';
import { fetchTatCounters } from '../doctor/apiConnector';
import { formatTime } from '../doctor/formatTime';
import { Timer } from 'lucide-react';

import Header from '../doctor/Header';
import Sidebar from '../doctor/Sidebar';
import CaseSummaryCard from '../doctor/CaseSummaryCard';
import Filters from '../doctor/Filters';
import { useNavigate } from 'react-router-dom';

function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [caseFilter, setCaseFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');

  const navigate = useNavigate();

  // Load patients with cursor pagination
  const loadPatients = async (cursor = null) => {
    try {
      const res = await fetchTatCounters(cursor);
      const newPatients = res.data.results;

      // Deduplicate
      setPatients(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniquePatients = newPatients.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniquePatients];
      });

      setNextCursor(res.data.next_cursor);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadPatients();
  }, []);

  // Timer countdown for pending cases
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev =>
        prev.map(p => {
          if (p.is_done) return p;
          if ((p.time_remaining || 0) > 0) {
            return { ...p, time_remaining: p.time_remaining - 1 };
          } else {
            return {
              ...p,
              time_remaining: 0,
              overdue_seconds: (p.overdue_seconds || 0) + 1
            };
          }
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = idx => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  // Filters
  const filteredPatients = patients.filter(p => {
    const matchCase =
      caseFilter === 'all' ||
      (caseFilter === 'reported' && p.is_done) ||
      (caseFilter === 'pending' && !p.is_done) ||
      (caseFilter === 'tatbreach' && p.overdue_seconds > 0);

    const matchSearch = [p.patient_name, p.patient_id, p.study_description]
      .some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchModality =
      selectedModality === 'All' ||
      p.modality?.toLowerCase() === selectedModality.toLowerCase();

    const matchDate =
      !selectedDate || p.received_on_db?.slice(0, 10) === selectedDate;

    return matchCase && matchSearch && matchModality && matchDate;
  });

  // Summary counts
  const assignedCases = patients.length;
  const reportedCases = patients.filter(p => p.is_done).length;
  const pendingCases = assignedCases - reportedCases;
  const reportedPatients = patients.filter(p => p.is_done);
  const reportedOnTimeCases = reportedPatients.filter(p => (p.overdue_seconds || 0) === 0).length;
  const tatMonitor = reportedPatients.length > 0
    ? `${Math.round((reportedOnTimeCases / reportedPatients.length) * 100)}%`
    : '0%';

  return (
    <div className="flex h-screen">
      {showSidebar && (
        <Sidebar
          onClose={() => setShowSidebar(false)}
          reportedCases={reportedCases}
          pendingCases={pendingCases}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onSidebarToggle={() => setShowSidebar(true)} />

        {/* Summary Cards & Filters */}
        <div className="px-1 py-[2px] sticky top-0 bg-white z-10 shadow-sm">
          <div className="flex gap-1 mb-[4px]">
            <CaseSummaryCard value={assignedCases} label="Assigned" active={caseFilter === 'all'} onClick={() => setCaseFilter('all')} />
            <CaseSummaryCard value={reportedCases} label="Reported" active={caseFilter === 'reported'} onClick={() => setCaseFilter('reported')} />
            <CaseSummaryCard value={pendingCases} label="Pending" active={caseFilter === 'pending'} onClick={() => setCaseFilter('pending')} />
            <CaseSummaryCard value={tatMonitor} label="TAT" active={caseFilter === 'tatbreach'} onClick={() => setCaseFilter('tatbreach')} />
          </div>

          <Filters
            compact
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedModality={selectedModality}
            setSelectedModality={setSelectedModality}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-auto px-2 pb-2">
          {filteredPatients.length === 0 && (
            <div className="text-center text-gray-500 mt-4 text-sm">
              {caseFilter === 'tatbreach' ? 'No TAT breach cases.' : 'No cases found.'}
            </div>
          )}

          {filteredPatients.map((p, idx) => (
            <div key={p.id}>
              <div
                 className={`rounded shadow p-2 mb-2 cursor-pointer hover:shadow-md transition-all duration-200
    ${
      p.urgent
        ? 'bg-red-100 hover:bg-red-200 border border-red-400'
        : p.vip
        ? 'bg-yellow-100 hover:bg-yellow-200 border border-yellow-400'
        : p.Mlc
        ? 'bg-blue-100 hover:bg-blue-200 border border-blue-400'
        : p.is_done
        ? p.overdue_seconds > 0
          ? 'bg-red-50 hover:bg-red-100 border border-red-200'
          : 'bg-green-100 hover:bg-green-100 border border-green-400'
        : 'bg-white hover:bg-gray-50'
    }
  `}
              >
                <div className="flex justify-between items-start gap-2">

                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="text-[12px] text-gray-400">{p.patient_id}</div>

                    <div className="font-medium text-[14px] leading-tight flex flex-wrap items-center gap-1">
                      {p.patient_name} • {p.age} y/o • {p.gender} • {p.modality}
                      {p.urgent && <span className="text-red-500 ml-1">• Urgent</span>}
                      {p.vip && <span className="bg-yellow-200 text-yellow-800 text-[10px] px-1 rounded ml-1 font-semibold">VIP</span>}
                       {p.Mlc && (
  <span className="bg-blue-200 text-blue-800 text-[10px] px-1 rounded ml-1 font-semibold">
    MLC
  </span>
)}

                    </div>

                    <div className="text-[12px] mt-0.5 line-clamp-1">{p.study_description}</div>
                      <div className="text-[12px] mt-0.5 line-clamp-1">{p.body_part_examined}</div>
                  </div>

                  {/* Status & Received Time */}
                  <div className="flex flex-col items-start px-1 min-w-[100px]">
                    <div className={`text-[12px] font-bold ${p.is_done ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {p.is_done ? 'Reported' : 'Unreported'}
                    </div>
                    <div className="text-[11px] text-gray-500">{p.received_on_db}</div>
                  </div>

                  {/* Reports & History */}
                  <div className="flex flex-wrap gap-1 px-1 max-w-[160px] justify-end">
                    {p.patient_reports?.length > 0 ? (
                      p.patient_reports.map((report, i) => (
                        <a
                          key={`report-${i}`}
                          href={report.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-500 text-white px-2 py-[2px] rounded text-[11px] hover:bg-red-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {report.title || `Report ${i + 1}`}
                        </a>
                      ))
                    ) : (
                      <div className="text-[11px] text-gray-400">No reports</div>
                    )}

                    {p.history_files?.length > 0 ? (
                      p.history_files.map((url, i) => (
                        <a
                          key={`history-${i}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-red-500 text-red-500 px-2 py-[2px] rounded text-[11px] hover:bg-red-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          H{i + 1}
                        </a>
                      ))
                    ) : (
                      <div className="text-[11px] text-gray-400">No history</div>
                    )}
                  </div>

                  {/* TAT & Buttons */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-0.5 text-[11px] text-gray-400">
                      <Timer size={14} className={`${p.overdue_seconds > 0 ? 'text-red-600' : 'text-green-600'}`} /> TAT
                    </div>
                    <div className={`font-bold text-[12px] ${p.overdue_seconds > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {p.time_remaining > 0
                        ? formatTime(p.time_remaining)
                        : `Overdue: ${formatTime(p.overdue_seconds)}`}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/viewer?id=${p.id}`);
                      }}
                      className="bg-red-500 text-white px-2 py-[2px] mt-1 text-[11px] rounded"
                    >
                      Report
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(idx);
                      }}
                      className={`mt-1 px-2 py-[3px] text-[11px] rounded-full border transition-colors duration-200
                        ${expandedIndex === idx
                          ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`}
                    >
                      {expandedIndex === idx ? 'Hide Notes' : 'Show Notes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIndex === idx && (
                <div className="bg-white rounded shadow p-2 mb-2 text-[12px]">
                  <span className="font-semibold">Notes:</span> {p.clinical_notes || p.notes}
                </div>
              )}
            </div>
          ))}

          {/* Show More */}
          {nextCursor && (
            <div className="text-center mt-2">
              <button
                onClick={() => loadPatients(nextCursor)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Show More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;  