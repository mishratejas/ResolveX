import React from 'react';
import AdminLayout from '../../layouts/AdminLayout'; // 🚀 Changed to AdminLayout!
import DepartmentManager from '../../components/admin/DepartmentManager';

const AdminDepartmentsPage = ({ onLogout }) => {
  return (
    // 🚀 Pass activePage="departments" to highlight the sidebar button
    <AdminLayout activePage="departments" onLogout={onLogout}>
      <DepartmentManager />
    </AdminLayout>
  );
};

export default AdminDepartmentsPage;