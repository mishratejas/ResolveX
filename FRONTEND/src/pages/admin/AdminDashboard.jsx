import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import AdminDashboardManager from '../../components/admin/AdminDashboardManager';

const AdminDashboard = ({ onLogout }) => {
  return (
    // Pass activePage="dashboard" to highlight it in the sidebar
    <AdminLayout activePage="dashboard" onLogout={onLogout}>
      <AdminDashboardManager />
    </AdminLayout>
  );
};

export default AdminDashboard;