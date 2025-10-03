// DoctorStatus.jsx
import React, { useEffect, useState } from "react";
import api from "../login/apilogin";
import { User, Mail } from "lucide-react";

const DoctorStatus = () => {
  const [radiologists, setRadiologists] = useState([]);

  const fetchRadiologists = async () => {
    try {
      const response = await api.get("/radiologists/");
      setRadiologists(response.data);
    } catch (err) {
      console.error("Error fetching radiologists:", err);
    }
  };

  useEffect(() => {
    fetchRadiologists();
    const interval = setInterval(fetchRadiologists, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-red-500 drop-shadow-lg animate-pulse">
        🩸 Radiologist Dashboard
      </h1>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {radiologists.map((doc) => (
          <div
            key={doc.id}
            className={`relative bg-black border border-gray-800 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-16 h-16 flex items-center justify-center rounded-full text-2xl font-bold shadow-lg ${
                  doc.is_online
                    ? "bg-red-600 text-white shadow-[0_0_10px_rgba(255,0,0,0.7)] animate-pulse"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {doc.first_name?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                  <User size={20} /> {doc.first_name} {doc.last_name}
                </h2>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Mail size={16} /> {doc.email}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span
                className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-semibold transition-all ${
                  doc.is_online
                    ? "bg-red-700 text-red-100 shadow-[0_0_10px_rgba(255,0,0,0.7)] animate-pulse"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full ${
                    doc.is_online
                      ? "bg-red-500 shadow-[0_0_6px_rgba(255,0,0,0.9)] animate-ping"
                      : "bg-gray-500"
                  }`}
                ></span>
                {doc.is_online ? "ONLINE" : "OFFLINE"}
              </span>
              <button
                className={`text-sm px-4 py-1 rounded-xl font-medium transition ${
                  doc.is_online
                    ? "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_6px_rgba(255,0,0,0.6)]"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                View Profile
              </button>
            </div>

            {/* Footer stats */}
            <div className="mt-4 flex justify-between text-sm text-gray-400">
              <div>
                <span className="font-semibold">ID:</span> {doc.id}
              </div>
              <div>
                <span className="font-semibold">Last Login:</span>{" "}
                {doc.last_login ? new Date(doc.last_login).toLocaleString() : "N/A"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorStatus;
