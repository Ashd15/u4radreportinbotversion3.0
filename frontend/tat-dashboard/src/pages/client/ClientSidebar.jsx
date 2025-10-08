import React from "react";
import { Activity, Brain, XRay, Wallet, LogOut, Info } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/**
 * ClientSidebar - improved visual & robust calculations based on the `summary` prop.
 * Expects summary: { ct, mri, xray, totalSent, totalReported, totalPending, totalWallet, moneyLeft }
 */
const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"]; // CT, MRI, XRay, Other

const ClientSidebar = ({ summary = {} }) => {
  // Defensive numbers
  const ct = Number(summary.ct) || 0;
  const mri = Number(summary.mri) || 0;
  const xray = Number(summary.xray) || 0;
  const totalSent = Number(summary.totalSent) || 0;
  const totalReported = Number(summary.totalReported) || 0;
  const totalPending = Number(summary.totalPending) || 0;
  const totalWallet = summary.totalWallet ?? 0;
  const moneyLeft = summary.moneyLeft ?? 0;

  // If modality counts don't add up to totalSent, allocate remainder to "Other"
  const modalitySum = ct + mri + xray;
  const other = Math.max(0, totalSent - modalitySum);

  const data = [
    { name: "CT", value: ct, color: COLORS[0] },
    { name: "MRI", value: mri, color: COLORS[1] },
    { name: "X-Ray", value: xray, color: COLORS[2] },
  ];
  if (other > 0) data.push({ name: "Other", value: other, color: COLORS[3] });

  const totalForChart = data.reduce((s, d) => s + d.value, 0);
  const completionRate = totalSent ? Math.round((totalReported / totalSent) * 100) : 0;

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
          <span role="img" aria-label="chart">📊</span> Dashboard Summary
        </h3>

        {/* Donut */}
        <div className="w-full h-44 mb-2">
          {totalForChart === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">
              No modality data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={44}
                  outerRadius={70}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={4}
                  labelLine={false}
                  label={false} // remove overlapping labels
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const pct = totalForChart ? Math.round((value / totalForChart) * 100) : 0;
                    return [`${value} (${pct}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Center badge */}
          <div className="mt-2 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-gray-500">Total Scans</div>
              <div className="text-xl font-bold">{totalSent}</div>
              <div className="text-xs text-gray-500">{completionRate}% reported</div>
            </div>
          </div>
        </div>

        {/* Legend / counts */}
        <div className="mt-3 space-y-2">
          {data.map((d, i) => {
            const pct = totalForChart ? Math.round((d.value / totalForChart) * 100) : 0;
            return (
              <div key={d.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ background: d.color }}
                  />
                  <span>{d.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{d.value}</span>
                  <span className="ml-2 text-xs text-gray-400">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        <hr className="my-3 border-gray-200 dark:border-gray-700" />

        {/* Quick stats */}
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Total Sent:</span>
            <span className="font-semibold">{totalSent}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Reported:</span>
            <span className="font-semibold text-green-600">{totalReported}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Pending:</span>
            <span className="font-semibold text-yellow-600">{totalPending}</span>
          </div>

          {/* <div className="flex justify-between mt-2">
            <span>Total Wallet:</span>
            <div className="flex items-center gap-1 font-semibold text-emerald-600">
              <Wallet size={14} /> ${totalWallet}
            </div>
          </div>
          <div className="flex justify-between">
            <span>Money Left:</span>
            <span className="font-semibold text-red-600">${moneyLeft}</span>
          </div> */}
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="text-xs text-gray-600 mb-1">Completion Rate</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="text-xs mt-1 text-gray-500">{completionRate}%</div>
        </div>

        {/* Instruction box */}
        <div className="mt-5 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-gray-700 dark:text-gray-300 flex gap-2">
          <Info size={16} className="text-blue-500" />
          <div>
            <p className="font-semibold text-blue-600 dark:text-blue-300 mb-1">Quick Tip</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Once a new case arrives, upload the patient’s history and write the patient note within 10 minutes.</li>
              <li>Check patient details, and if anything is wrong, immediately inform the coordinator.</li>
              <li>After reporting, double-check the report for any errors before final submission.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ClientSidebar;
