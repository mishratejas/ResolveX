// pages/admin/AdminStaffPage.jsx
import React from 'react';
import AdminLayout from '../../layouts/AdminLayout'; // Double check your path
import StaffManager from '../../components/admin/StaffManager'; // Double check your path

const AdminStaffPage = ({ onLogout }) => {
  return (
    <AdminLayout activePage="staff" onLogout={onLogout}>
      <StaffManager />
    </AdminLayout>
  );
};

export default AdminStaffPage;