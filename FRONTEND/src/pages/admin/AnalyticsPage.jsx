import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import AdminAnalyticsManager from '../../components/admin/AdminAnalyticsManager';

const AnalyticsPage = ({ onLogout }) => {
  return (
    // Pass activePage="analytics" so the sidebar highlights correctly
    <AdminLayout activePage="analytics" onLogout={onLogout}>
      <AdminAnalyticsManager />
    </AdminLayout>
  );
};

export default AnalyticsPage;