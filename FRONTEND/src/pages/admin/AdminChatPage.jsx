import React from 'react';
import AdminLayout from '../../layouts/AdminLayout'; 
import AdminChatInbox from '../../components/admin/AdminChatInbox';

const AdminChatPage = ({ onLogout }) => {
  return (
    // 🚀 Pass activePage="chat" (or whatever your sidebar uses) to highlight the button
    <AdminLayout activePage="chat" onLogout={onLogout}>
      <AdminChatInbox />
    </AdminLayout>
  );
};

export default AdminChatPage;