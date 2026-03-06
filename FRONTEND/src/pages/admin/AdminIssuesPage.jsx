import React from 'react';
import AdminLayout from '../../layouts/AdminLayout'; // Make sure this path is correct!
import ComplaintManager from '../../components/admin/ComplaintManager';

const AdminIssuesPage = () => {
  return (
    <AdminLayout>
      <ComplaintManager />
    </AdminLayout>
  );
};

export default AdminIssuesPage;