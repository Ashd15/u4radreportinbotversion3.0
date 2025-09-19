import React from "react";
import { Wallet } from "lucide-react";

const ClientSidebar = ({ summary }) => {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="space-y-3 text-sm">
        {/* Cases Sent */}
        <div className="bg-gray-800 p-3 rounded-lg">
          <h3 className="text-gray-300 font-medium mb-2">Cases Sent</h3>
          <p>CT: <span className="font-semibold">{summary.ct}</span></p>
          <p>MRI: <span className="font-semibold">{summary.mri}</span></p>
          <p>X-Ray: <span className="font-semibold">{summary.xray}</span></p>
          <p className="mt-2">Total Sent: <span className="font-bold">{summary.totalSent}</span></p>
          <p>Total Reported: <span className="font-bold">{summary.totalReported}</span></p>
        </div>

        {/* Wallet */}
        <div className="bg-gray-800 p-3 rounded-lg">
          <h3 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Wallet
          </h3>
          <p>Total Wallet: <span className="font-bold">₹{summary.totalWallet}</span></p>
          <p>Left: <span className="font-bold text-green-400">₹{summary.moneyLeft}</span></p>
        </div>
      </div>
    </div>
  );
};

export default ClientSidebar;
