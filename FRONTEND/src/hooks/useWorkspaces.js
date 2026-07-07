import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useWorkspaces = ({ autoLoad = true } = {}) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [actionLoading, setActionLoading] = useState(false);

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });

  const loadWorkspaces = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/users/my-workspaces`, authHeaders());
      if (response.data.success) {
        setWorkspaces(response.data.data || []);
      }
      return response.data;
    } catch (error) {
      console.error("Error loading workspaces:", error);
      toast.error("Failed to load workspaces");
      throw error;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const joinWorkspace = useCallback(async (workspaceCode) => {
    if (!workspaceCode?.trim()) {
      toast.error("Please enter a workspace code");
      return null;
    }
    setActionLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/users/join-workspace`,
        { workspaceCode: workspaceCode.trim().toUpperCase() },
        authHeaders()
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await loadWorkspaces();
      }
      return response.data;
    } catch (error) {
      console.error("Error joining workspace:", error);
      toast.error(error.response?.data?.message || "Failed to join workspace");
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [loadWorkspaces]);

  const leaveWorkspace = useCallback(async (workspaceId, workspaceName) => {
    if (workspaces.length <= 1) {
      toast.error("You must be in at least one workspace. Join another workspace before leaving this one.");
      return null;
    }
    if (!window.confirm(`Are you sure you want to leave ${workspaceName}?`)) {
      return null;
    }
    try {
      const response = await axios.post(
        `${BASE_URL}/api/users/leave-workspace/${workspaceId}`,
        {},
        authHeaders()
      );
      if (response.data.success) {
        toast.success(response.data.message);
        const currentWorkspace = JSON.parse(localStorage.getItem("currentWorkspace") || "{}");
        if (currentWorkspace.id === workspaceId) {
          localStorage.removeItem("currentWorkspace");
        }
        await loadWorkspaces();
      }
      return response.data;
    } catch (error) {
      console.error("Error leaving workspace:", error);
      toast.error(error.response?.data?.message || "Failed to leave workspace");
      throw error;
    }
  }, [workspaces.length, loadWorkspaces]);

  // Persists the chosen workspace to localStorage in the one shape every
  // consumer expects (id/name/workspaceCode/email/phone/joinedAt).
  const selectWorkspace = useCallback((workspace) => {
    const workspaceData = {
      id: workspace._id,
      name: workspace.organizationName,
      workspaceCode: workspace.workspaceCode,
      email: workspace.email,
      phone: workspace.phone || "",
      joinedAt: new Date().toISOString(),
    };
    localStorage.setItem("currentWorkspace", JSON.stringify(workspaceData));
    return workspaceData;
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadWorkspaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    workspaces,
    loading,
    actionLoading,
    loadWorkspaces,
    joinWorkspace,
    leaveWorkspace,
    selectWorkspace,
  };
};

export default useWorkspaces;