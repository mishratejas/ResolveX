import React from 'react';
import AdminLayout from '../../layouts/AdminLayout'; // Make sure this path is correct!
import ComplaintManager from '../../components/admin/ComplaintManager';

const AdminIssuesPage = ({ onLogout }) => {
  return (
    <AdminLayout activePage="issues" onLogout={onLogout}>
      <ComplaintManager />
    </AdminLayout>
  );
};

export default AdminIssuesPage;