import { useState, useCallback } from "react";
import axiosInstance from "../api/axios";

export const useStaffComplaints = ({ calculateStats, onUnauthorized } = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(`/api/staff/issues`, {
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
      // axiosInstance already tries a silent refresh on 401 before this catch
      // ever sees it, so a 401 here means the refresh itself failed.
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
      const response = await axiosInstance.put(
        `/api/staff/issues/${complaintId}`,
        { status: newStatus, ...extraPayload }
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