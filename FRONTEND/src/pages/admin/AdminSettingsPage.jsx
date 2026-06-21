import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import AdminSettingsManager from '../../components/admin/AdminSettingsManager';

const AdminSettingsPage = ({ onLogout }) => {
  return (
    <AdminLayout activePage="settings" onLogout={onLogout}>
      <AdminSettingsManager />
    </AdminLayout>
  );
};

export default AdminSettingsPage;