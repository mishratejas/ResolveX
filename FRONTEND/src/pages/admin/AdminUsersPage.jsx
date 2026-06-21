import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import AdminUsersManager from '../../components/admin/AdminUsersManager';

const AdminUsersPage = ({ onLogout }) => {
  return (
    // Pass activePage="users" so the sidebar highlights the correct button
    <AdminLayout activePage="users" onLogout={onLogout}>
      <AdminUsersManager />
    </AdminLayout>
  );
};

export default AdminUsersPage;