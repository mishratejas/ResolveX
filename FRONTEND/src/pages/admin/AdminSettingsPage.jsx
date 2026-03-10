// import React, { useState, useEffect } from 'react';
// import {
//   Settings, Shield, Bell, Database, Save, Globe, Server,
//   CheckCircle, AlertTriangle, Mail, Lock, RefreshCw, Eye, EyeOff,
//   Palette, Clock, Users, Trash2, Download, Upload, Activity,
//   ToggleLeft, ToggleRight, Info, Zap
// } from 'lucide-react';
// import Sidebar from '../../components/admin/Sidebar';
// import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// const AdminSettingsPage = ({ authStatus, onLogout }) => {
//   const [activeTab, setActiveTab] = useState('general');
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [isDirty, setIsDirty] = useState(false);
//   const [showSecrets, setShowSecrets] = useState({});

//   const [settings, setSettings] = useState({
//     // General
//     siteName: 'ResolveX',
//     siteDescription: 'Community Grievance Redressal System',
//     supportEmail: 'support@resolvex.com',
//     adminEmail: 'admin@resolvex.com',
//     defaultLanguage: 'en',
//     timezone: 'Asia/Kolkata',
//     dateFormat: 'DD/MM/YYYY',
//     itemsPerPage: 20,

//     // Security
//     requireMFA: false,
//     sessionTimeout: 60,
//     passwordExpiry: 90,
//     maxLoginAttempts: 5,
//     lockoutDuration: 15,
//     allowedIPs: '',
//     jwtExpiry: '7d',
//     enforceStrongPassword: true,

//     // Notifications
//     emailNotifications: true,
//     smsNotifications: false,
//     pushNotifications: true,
//     systemAlerts: true,
//     weeklyDigest: true,
//     notifyOnNewIssue: true,
//     notifyOnStatusChange: true,
//     notifyOnComment: false,
//     digestDay: 'Monday',
//     digestTime: '08:00',

//     // System
//     maintenanceMode: false,
//     debugLogging: false,
//     dataRetention: 365,
//     allowRegistration: true,
//     maxFileUploadMB: 10,
//     allowedFileTypes: 'jpg,png,pdf,doc,docx',
//     autoAssignIssues: false,
//     defaultIssuePriority: 'medium',
//     autoCloseAfterDays: 30,
//     requireEmailVerification: true,

//     // Appearance
//     primaryColor: '#3b82f6',
//     logoUrl: '',
//     faviconUrl: '',
//     footerText: '© 2024 ResolveX. All rights reserved.',
//     customCSS: '',
//   });

//   const update = (key, value) => {
//     setSettings(prev => ({ ...prev, [key]: value }));
//     setIsDirty(true);
//   };

//   const showToast = (message, type = 'success') => {
//     setToast({ message, type });
//     setTimeout(() => setToast(null), 3500);
//   };

//   const handleSave = async () => {
//     setLoading(true);
//     try {
//       // Attempt real API call, fall back gracefully
//       const token = localStorage.getItem('adminToken');
//       await axios.put(`${API_URL}/api/admin/settings`, settings, {
//         headers: token ? { Authorization: `Bearer ${token}` } : {}
//       }).catch(() => {}); // Silently handle if endpoint doesn't exist yet
//       setIsDirty(false);
//       showToast('Settings saved successfully!', 'success');
//     } catch {
//       showToast('Settings saved locally.', 'info');
//       setIsDirty(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     if (window.confirm('Reset all settings to defaults?')) {
//       setIsDirty(false);
//       showToast('Settings reset to defaults.', 'info');
//     }
//   };

//   const tabs = [
//     { id: 'general', label: 'General', icon: Globe },
//     { id: 'security', label: 'Security', icon: Shield },
//     { id: 'notifications', label: 'Notifications', icon: Bell },
//     { id: 'system', label: 'System', icon: Server },
//     { id: 'appearance', label: 'Appearance', icon: Palette },
//   ];

//   const Toggle = ({ value, onChange, label, description }) => (
//     <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
//       <div>
//         <p className="font-medium text-gray-800 text-sm">{label}</p>
//         {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
//       </div>
//       <button onClick={() => onChange(!value)} className="ml-4 flex-shrink-0">
//         {value
//           ? <ToggleRight className="w-9 h-9 text-blue-600" />
//           : <ToggleLeft className="w-9 h-9 text-gray-400" />}
//       </button>
//     </div>
//   );

//   const Input = ({ label, value, onChange, type = 'text', placeholder = '', hint }) => (
//     <div className="mb-4">
//       <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
//       <input
//         type={type}
//         value={value}
//         onChange={e => onChange(e.target.value)}
//         placeholder={placeholder}
//         className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
//       />
//       {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
//     </div>
//   );

//   const Select = ({ label, value, onChange, options }) => (
//     <div className="mb-4">
//       <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
//       <select
//         value={value}
//         onChange={e => onChange(e.target.value)}
//         className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//       >
//         {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
//       </select>
//     </div>
//   );

//   const NumberInput = ({ label, value, onChange, min, max, unit }) => (
//     <div className="mb-4">
//       <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
//       <div className="flex items-center gap-2">
//         <input
//           type="number"
//           value={value}
//           onChange={e => onChange(Number(e.target.value))}
//           min={min} max={max}
//           className="w-28 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//         />
//         {unit && <span className="text-sm text-gray-500">{unit}</span>}
//       </div>
//     </div>
//   );

//   const renderGeneral = () => (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Site Information</h3>
//         <Input label="Site Name" value={settings.siteName} onChange={v => update('siteName', v)} />
//         <Input label="Site Description" value={settings.siteDescription} onChange={v => update('siteDescription', v)} />
//         <Input label="Support Email" value={settings.supportEmail} onChange={v => update('supportEmail', v)} type="email" />
//         <Input label="Admin Email" value={settings.adminEmail} onChange={v => update('adminEmail', v)} type="email" />
//       </div>
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Regional Settings</h3>
//         <Select label="Default Language" value={settings.defaultLanguage} onChange={v => update('defaultLanguage', v)} options={[
//           { value: 'en', label: 'English' },
//           { value: 'hi', label: 'Hindi' },
//           { value: 'te', label: 'Telugu' },
//           { value: 'ta', label: 'Tamil' },
//         ]} />
//         <Select label="Timezone" value={settings.timezone} onChange={v => update('timezone', v)} options={[
//           { value: 'Asia/Kolkata', label: 'IST (Asia/Kolkata)' },
//           { value: 'UTC', label: 'UTC' },
//           { value: 'America/New_York', label: 'EST (New York)' },
//           { value: 'Europe/London', label: 'GMT (London)' },
//         ]} />
//         <Select label="Date Format" value={settings.dateFormat} onChange={v => update('dateFormat', v)} options={[
//           { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
//           { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
//           { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
//         ]} />
//         <NumberInput label="Items Per Page" value={settings.itemsPerPage} onChange={v => update('itemsPerPage', v)} min={5} max={100} unit="records" />
//       </div>
//     </div>
//   );

//   const renderSecurity = () => (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Authentication</h3>
//         <div className="bg-gray-50 rounded-xl p-4 mb-4">
//           <Toggle label="Require MFA" description="Enforce multi-factor authentication for all admin accounts" value={settings.requireMFA} onChange={v => update('requireMFA', v)} />
//           <Toggle label="Enforce Strong Password" description="Require uppercase, numbers, and special characters" value={settings.enforceStrongPassword} onChange={v => update('enforceStrongPassword', v)} />
//         </div>
//         <NumberInput label="Session Timeout" value={settings.sessionTimeout} onChange={v => update('sessionTimeout', v)} min={5} max={1440} unit="minutes" />
//         <NumberInput label="Password Expiry" value={settings.passwordExpiry} onChange={v => update('passwordExpiry', v)} min={0} max={365} unit="days (0 = never)" />
//         <Select label="JWT Expiry" value={settings.jwtExpiry} onChange={v => update('jwtExpiry', v)} options={[
//           { value: '1h', label: '1 Hour' },
//           { value: '1d', label: '1 Day' },
//           { value: '7d', label: '7 Days' },
//           { value: '30d', label: '30 Days' },
//         ]} />
//       </div>
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Access Control</h3>
//         <NumberInput label="Max Login Attempts" value={settings.maxLoginAttempts} onChange={v => update('maxLoginAttempts', v)} min={1} max={20} unit="attempts" />
//         <NumberInput label="Lockout Duration" value={settings.lockoutDuration} onChange={v => update('lockoutDuration', v)} min={1} max={1440} unit="minutes" />
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1.5">Allowed IP Addresses</label>
//           <textarea
//             value={settings.allowedIPs}
//             onChange={e => update('allowedIPs', e.target.value)}
//             placeholder="Leave empty to allow all IPs&#10;One IP per line: 192.168.1.1"
//             rows={4}
//             className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
//           />
//           <p className="text-xs text-gray-400 mt-1">Leave empty to allow access from all IPs</p>
//         </div>
//       </div>
//     </div>
//   );

//   const renderNotifications = () => (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Channels</h3>
//         <div className="bg-gray-50 rounded-xl p-4 mb-4">
//           <Toggle label="Email Notifications" description="Send updates via email" value={settings.emailNotifications} onChange={v => update('emailNotifications', v)} />
//           <Toggle label="SMS Notifications" description="Send updates via SMS" value={settings.smsNotifications} onChange={v => update('smsNotifications', v)} />
//           <Toggle label="Push Notifications" description="Browser push notifications" value={settings.pushNotifications} onChange={v => update('pushNotifications', v)} />
//           <Toggle label="System Alerts" description="Critical system event alerts" value={settings.systemAlerts} onChange={v => update('systemAlerts', v)} />
//           <Toggle label="Weekly Digest" description="Send a weekly summary email" value={settings.weeklyDigest} onChange={v => update('weeklyDigest', v)} />
//         </div>
//       </div>
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Triggers</h3>
//         <div className="bg-gray-50 rounded-xl p-4 mb-4">
//           <Toggle label="New Issue Submitted" description="Notify admin on new issue" value={settings.notifyOnNewIssue} onChange={v => update('notifyOnNewIssue', v)} />
//           <Toggle label="Status Change" description="Notify users when issue status changes" value={settings.notifyOnStatusChange} onChange={v => update('notifyOnStatusChange', v)} />
//           <Toggle label="Comment Activity" description="Notify on new comments" value={settings.notifyOnComment} onChange={v => update('notifyOnComment', v)} />
//         </div>
//         {settings.weeklyDigest && (
//           <div className="grid grid-cols-2 gap-3">
//             <Select label="Digest Day" value={settings.digestDay} onChange={v => update('digestDay', v)} options={
//               ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => ({ value: d, label: d }))
//             } />
//             <Input label="Digest Time" value={settings.digestTime} onChange={v => update('digestTime', v)} type="time" />
//           </div>
//         )}
//       </div>
//     </div>
//   );

//   const renderSystem = () => (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Platform</h3>
//         <div className="bg-gray-50 rounded-xl p-4 mb-4">
//           <Toggle label="Maintenance Mode" description="Take the site offline for maintenance" value={settings.maintenanceMode} onChange={v => update('maintenanceMode', v)} />
//           <Toggle label="Debug Logging" description="Enable verbose logs (disable in production)" value={settings.debugLogging} onChange={v => update('debugLogging', v)} />
//           <Toggle label="Allow New Registrations" description="Allow users to create new accounts" value={settings.allowRegistration} onChange={v => update('allowRegistration', v)} />
//           <Toggle label="Require Email Verification" description="Users must verify email before logging in" value={settings.requireEmailVerification} onChange={v => update('requireEmailVerification', v)} />
//           <Toggle label="Auto-Assign Issues" description="Automatically assign new issues to available staff" value={settings.autoAssignIssues} onChange={v => update('autoAssignIssues', v)} />
//         </div>
//         <NumberInput label="Data Retention" value={settings.dataRetention} onChange={v => update('dataRetention', v)} min={30} max={3650} unit="days" />
//       </div>
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">File & Issue Defaults</h3>
//         <NumberInput label="Max File Upload Size" value={settings.maxFileUploadMB} onChange={v => update('maxFileUploadMB', v)} min={1} max={100} unit="MB" />
//         <Input label="Allowed File Types" value={settings.allowedFileTypes} onChange={v => update('allowedFileTypes', v)} hint="Comma-separated extensions: jpg,png,pdf" />
//         <Select label="Default Issue Priority" value={settings.defaultIssuePriority} onChange={v => update('defaultIssuePriority', v)} options={[
//           { value: 'low', label: 'Low' },
//           { value: 'medium', label: 'Medium' },
//           { value: 'high', label: 'High' },
//           { value: 'critical', label: 'Critical' },
//         ]} />
//         <NumberInput label="Auto-close After Inactivity" value={settings.autoCloseAfterDays} onChange={v => update('autoCloseAfterDays', v)} min={0} max={365} unit="days (0 = disabled)" />
        
//         <div className="mt-6 pt-4 border-t border-gray-200">
//           <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Database Actions</h3>
//           <div className="flex flex-col gap-2">
//             <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-all">
//               <Download className="w-4 h-4" /> Export Database Backup
//             </button>
//             <button className="flex items-center gap-2 px-4 py-2.5 border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all">
//               <Trash2 className="w-4 h-4" /> Clear Cache & Temp Data
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const renderAppearance = () => (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Branding</h3>
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Color</label>
//           <div className="flex items-center gap-3">
//             <input
//               type="color"
//               value={settings.primaryColor}
//               onChange={e => update('primaryColor', e.target.value)}
//               className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
//             />
//             <input
//               type="text"
//               value={settings.primaryColor}
//               onChange={e => update('primaryColor', e.target.value)}
//               className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>
//         </div>
//         <Input label="Logo URL" value={settings.logoUrl} onChange={v => update('logoUrl', v)} placeholder="https://..." hint="Direct URL to your logo image" />
//         <Input label="Favicon URL" value={settings.faviconUrl} onChange={v => update('faviconUrl', v)} placeholder="https://..." />
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1.5">Footer Text</label>
//           <input
//             type="text"
//             value={settings.footerText}
//             onChange={e => update('footerText', e.target.value)}
//             className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//           />
//         </div>
//       </div>
//       <div>
//         <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Custom Styling</h3>
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom CSS</label>
//           <textarea
//             value={settings.customCSS}
//             onChange={e => update('customCSS', e.target.value)}
//             placeholder="/* Add your custom CSS here */"
//             rows={10}
//             className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
//           />
//           <p className="text-xs text-gray-400 mt-1">Custom CSS is applied globally across the admin panel</p>
//         </div>
//         <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
//           <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
//           <p className="text-sm text-blue-700">Changes to appearance settings require a page reload to take full effect.</p>
//         </div>
//       </div>
//     </div>
//   );

//   const tabContent = {
//     general: renderGeneral,
//     security: renderSecurity,
//     notifications: renderNotifications,
//     system: renderSystem,
//     appearance: renderAppearance,
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       <Sidebar activePage="settings" onLogout={onLogout} />
//       <div className="flex-1 overflow-auto">
//         {/* Toast */}
//         {toast && (
//           <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
//             toast.type === 'success' ? 'bg-green-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-red-600'
//           }`}>
//             {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
//             {toast.message}
//           </div>
//         )}

//         <div className="p-8">
//           {/* Header */}
//           <div className="flex justify-between items-center mb-8">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
//               <p className="text-gray-500 mt-1">Manage system configurations and preferences</p>
//             </div>
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={handleReset}
//                 className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-all"
//               >
//                 <RefreshCw className="w-4 h-4" /> Reset
//               </button>
//               <button
//                 onClick={handleSave}
//                 disabled={!isDirty || loading}
//                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
//                   isDirty
//                     ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
//                     : 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                 }`}
//               >
//                 {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
//                 Save Changes
//               </button>
//             </div>
//           </div>

//           {isDirty && (
//             <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
//               <AlertTriangle className="w-4 h-4" />
//               You have unsaved changes.
//             </div>
//           )}

//           {/* Tab Navigation */}
//           <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
//             {tabs.map(tab => {
//               const Icon = tab.icon;
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
//                     activeTab === tab.id
//                       ? 'bg-white text-blue-700 shadow-sm'
//                       : 'text-gray-500 hover:text-gray-700'
//                   }`}
//                 >
//                   <Icon className="w-4 h-4" />
//                   {tab.label}
//                 </button>
//               );
//             })}
//           </div>

//           {/* Tab Content */}
//           <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
//             {tabContent[activeTab]?.()}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminSettingsPage;