import { useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getStaffToken = () =>
  localStorage.getItem("staffToken") || localStorage.getItem("staffAccessToken");

export const useStaffComplaints = ({ calculateStats, onUnauthorized } = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = getStaffToken();

      const response = await axios.get(`${BASE_URL}/api/staff/issues`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data.success) {
        const data = response.data.data || [];
        setComplaints(data);
        if (calculateStats) {
          setStats(calculateStats(data));
        }
        return data;
      } else {
        setError(response.data.message || "Failed to load complaints");
        return [];
      }
    } catch (err) {
      console.error("Error fetching assigned complaints:", err);
      if (err.response?.status === 401) {
        if (onUnauthorized) onUnauthorized();
      } else {
        setError(
          err.response
            ? `Server error: ${err.response.status}`
            : "Unable to connect to server."
        );
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [calculateStats, onUnauthorized]);

  const updateComplaintStatus = useCallback(async (complaintId, newStatus, extraPayload = {}) => {
    try {
      const token = getStaffToken();
      const response = await axios.put(
        `${BASE_URL}/api/staff/issues/${complaintId}`,
        { status: newStatus, ...extraPayload },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        await fetchComplaints();
      }
      return response.data;
    } catch (err) {
      console.error("Failed to update status:", err);
      throw err;
    }
  }, [fetchComplaints]);

  return {
    complaints,
    stats,
    loading,
    error,
    setError,
    fetchComplaints,
    updateComplaintStatus,
  };
};

export default useStaffComplaints;