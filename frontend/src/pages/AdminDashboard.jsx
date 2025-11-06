import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Auth and Initial Data Load
  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      navigate("/admin-login");
      return;
    }
    const parsedAdmin = JSON.parse(adminData);
    setAdmin(parsedAdmin);

    if (parsedAdmin.user_id) {
      fetchData();
    } else {
      setError("Admin ID not found. Please log in again.");
      setLoading(false);
      localStorage.removeItem("admin");
    }
  }, [navigate]);

  // 2. Data Fetching Function
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingsRes, logRes] = await Promise.all([
        axios.get(`http://localhost:8000/admin/bookings/pending`),
        axios.get(`http://localhost:8000/admin/audit_log`),
      ]);
      setPendingBookings(bookingsRes.data || []);
      setAuditLog(logRes.data || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError("Failed to load admin data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Action: Approve Booking
  const handleApprove = async (bookingId) => {
    try {
      await axios.post(
        `http://localhost:8000/admin/bookings/${bookingId}/approve`,
      );
      fetchData(); // Refresh lists
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to approve booking.");
    }
  };

  // 4. Action: Reject Booking
  const handleReject = async (bookingId) => {
    try {
      await axios.post(
        `http://localhost:8000/admin/bookings/${bookingId}/reject`,
      );
      fetchData(); // Refresh lists
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reject booking.");
    }
  };

  // 5. Action: Logout
  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/");
  };

  // 6. Render
  if (loading && !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome, {admin?.first_name || "Admin"}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg px-6 py-3 transition"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Section 1: Pending Bookings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Pending Venue Bookings</h2>
          {loading && <p className="text-gray-400">Loading bookings...</p>}
          {!loading && pendingBookings.length === 0 ? (
            <p className="text-gray-400">
              There are no pending venue bookings.
            </p>
          ) : (
            <div className="grid gap-4">
              {pendingBookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="bg-gray-800 rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        {booking.event_name}
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Requested by {booking.club_name} (
                        {booking.requested_by_name})
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400">
                        <span>
                          <strong>Venue:</strong> {booking.venue_name} (Cap:{" "}
                          {booking.capacity})
                        </span>
                        <span>
                          <strong>Start:</strong>{" "}
                          {new Date(booking.start_time).toLocaleString()}
                        </span>
                        <span>
                          <strong>End:</strong>{" "}
                          {new Date(booking.end_time).toLocaleString()}
                        </span>
                        <span>
                          <strong>Availability:</strong>
                          <span
                            className={
                              booking.is_available
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {booking.is_available ? " Available" : " CONFLICT"}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4 md:mt-0">
                      <button
                        onClick={() => handleApprove(booking.booking_id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg px-6 py-2 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.booking_id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-2 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Audit Log */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Recent Activity (Audit Log)
          </h2>
          {loading && <p className="text-gray-400">Loading log...</p>}
          {!loading && auditLog.length === 0 ? (
            <p className="text-gray-400">No audit log entries found.</p>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6">
              <ul className="space-y-4">
                {auditLog.map((log) => (
                  <li
                    key={log.log_id}
                    className="border-b border-gray-700 pb-2"
                  >
                    <p className="text-sm text-gray-400">
                      {new Date(log.log_timestamp).toLocaleString()}
                      <span className="font-bold text-yellow-400 mx-2">
                        {log.action_type}
                      </span>
                    </p>
                    <p className="text-gray-200">{log.details}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
