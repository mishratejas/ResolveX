// pages/admin/AdminStaffDetailPage.jsx
import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import StaffDetailManager from '../../components/admin/StaffDetailManager';

const AdminStaffDetailPage = ({ onLogout }) => {
  return (
    <AdminLayout activePage="staff" onLogout={onLogout}>
      <StaffDetailManager />
    </AdminLayout>
  );
};

export default AdminStaffDetailPage;