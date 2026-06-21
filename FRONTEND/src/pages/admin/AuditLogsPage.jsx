import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import AdminAuditLogsManager from '../../components/admin/AdminAuditLogsManager';

const AuditLogsPage = ({ onLogout }) => {
  return (
    // Pass activePage="audit" so the sidebar highlights the Audit Logs button
    <AdminLayout activePage="audit" onLogout={onLogout}>
      <AdminAuditLogsManager />
    </AdminLayout>
  );
};

export default AuditLogsPage;