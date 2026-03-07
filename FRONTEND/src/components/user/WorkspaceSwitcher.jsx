import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const WorkspaceSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    loadCurrentWorkspace();
    loadWorkspaces();
  }, []);

  const loadCurrentWorkspace = () => {
    const workspace = localStorage.getItem('currentWorkspace');
    if (workspace) {
      setCurrentWorkspace(JSON.parse(workspace));
    }
  };

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/api/users/my-workspaces`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setWorkspaces(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

const switchWorkspace = (workspace) => {
  const workspaceData = {
    id: workspace._id,
    name: workspace.organizationName,
    workspaceCode: workspace.workspaceCode, // ← FIXED: Use workspaceCode, not code
    email: workspace.email,
    phone: workspace.phone || '',
    joinedAt: new Date().toISOString()
  };

  console.log('🔄 Switching to workspace:', workspaceData);
  localStorage.setItem('currentWorkspace', JSON.stringify(workspaceData));
  setCurrentWorkspace(workspaceData);
  setIsOpen(false);
  toast.success(`Switched to ${workspace.organizationName}`);
  
  // Reload the page to refresh all workspace-dependent data
  window.location.reload();
};

  const goToWorkspaceSelector = () => {
    setIsOpen(false);
    navigate('/select-workspace');
  };

  if (!currentWorkspace) {
    return (
      <button
        onClick={() => navigate('/select-workspace')}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
      >
        <Building2 className="w-4 h-4" />
        <span className="text-sm font-medium">Select Workspace</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
      >
        <Building2 className="w-4 h-4 text-blue-600" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
            {currentWorkspace.name}
          </span>
          <span className="text-xs text-gray-500">
            {currentWorkspace.workspaceCode}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Your Workspaces</h3>
                <button
                  onClick={() => {
                    loadWorkspaces();
                    toast.success('Workspaces refreshed');
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Refresh workspaces"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Switch between your joined workspaces
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading workspaces...</p>
                </div>
              ) : workspaces.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No workspaces found</p>
                  <button
                    onClick={goToWorkspaceSelector}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Join a Workspace
                  </button>
                </div>
              ) : (
                <>
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace._id}
                      onClick={() => switchWorkspace(workspace)}
                      className={`w-full p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                        currentWorkspace?.id === workspace._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {workspace.profileImage ? (
                            <img
                              src={workspace.profileImage}
                              alt={workspace.organizationName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {workspace.organizationName}
                            </span>
                            {currentWorkspace?.id === workspace._id && (
                              <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {workspace.workspaceCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={goToWorkspaceSelector}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Manage Workspaces
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;