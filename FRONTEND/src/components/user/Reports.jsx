import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import {
  AlertCircle, CheckCircle, Clock, Users, Activity,
  Download, RefreshCw, Building2, Trophy, Crown, Medal,
  ThumbsUp, Target, TrendingUp, ChevronUp, ChevronDown,
  Plus, Share2, Search
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Reports = ({ currentUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [myComplaints, setMyComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');
  const [leaderSearch, setLeaderSearch] = useState('');
  const [leaderSort, setLeaderSort] = useState('reported');

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (selectedWorkspace) loadAll(); }, [timeRange, selectedWorkspace]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const currentWorkspace = JSON.parse(localStorage.getItem('currentWorkspace') || 'null');

      const params = {};
      if (selectedWorkspace !== 'all') params.workspaceId = selectedWorkspace;
      else if (currentWorkspace?.id) params.workspaceId = currentWorkspace.id;

      const [myRes, allRes, wsRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/user_issues/my`, {
          params, headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/api/user_issues`, {
          params, headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/api/users/my-workspaces`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      if (myRes.data.success) setMyComplaints(myRes.data.data || []);
      if (allRes.data.success) setAllComplaints(allRes.data.data || []);
      if (wsRes.data.success) setWorkspaces(wsRes.data.data || []);
    } catch (e) {
      console.error('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  // ----- My Stats -----
  const myStats = (() => {
    const total = myComplaints.length;
    const resolved = myComplaints.filter(c => c.status === 'resolved').length;
    const pending = myComplaints.filter(c => c.status === 'pending').length;
    const inProgress = myComplaints.filter(c => c.status === 'in-progress').length;
    const totalVotes = myComplaints.reduce((s, c) => s + (c.voteCount || 0), 0);
    const resRate = total > 0 ? ((resolved / total) * 100).toFixed(0) : 0;

    // avg resolution time
    let totalDays = 0, resCount = 0;
    myComplaints.forEach(c => {
      if (c.status === 'resolved' && c.createdAt && c.resolvedAt) {
        totalDays += Math.ceil(Math.abs(new Date(c.resolvedAt) - new Date(c.createdAt)) / 86400000);
        resCount++;
      }
    });

    return { total, resolved, pending, inProgress, totalVotes, resRate, avgDays: resCount > 0 ? (totalDays / resCount).toFixed(1) : 'N/A' };
  })();

  // ----- Monthly Chart -----
  const monthlyData = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const m = (now.getMonth() - (5 - i) + 12) % 12;
      return months[m];
    });
    const counts = {};
    myComplaints.forEach(c => {
      if (c.createdAt) {
        const m = months[new Date(c.createdAt).getMonth()];
        if (!counts[m]) counts[m] = { reported: 0, resolved: 0 };
        counts[m].reported++;
        if (c.status === 'resolved') counts[m].resolved++;
      }
    });
    return last6.map(m => ({ month: m, reported: counts[m]?.reported || 0, resolved: counts[m]?.resolved || 0 }));
  })();

  // ----- Category Chart -----
  const categoryData = (() => {
    const counts = {};
    myComplaints.forEach(c => {
      const cat = c.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), value
    }));
  })();

  // ----- Leaderboard -----
  const leaderboard = (() => {
    const users = {};
    allComplaints.forEach(c => {
      const uid = c.user?._id || c.user;
      const name = c.user?.name || 'Anonymous';
      if (!uid) return;
      if (!users[uid]) users[uid] = { id: uid, name, reported: 0, resolved: 0, votes: 0 };
      users[uid].reported++;
      if (c.status === 'resolved') users[uid].resolved++;
      users[uid].votes += c.voteCount || 0;
    });

    let list = Object.values(users);

    if (leaderSearch.trim()) {
      const q = leaderSearch.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (leaderSort === 'votes') return b.votes - a.votes;
      if (leaderSort === 'resolved') return b.resolved - a.resolved;
      return b.reported - a.reported;
    });

    return list;
  })();

  const currentUserId = (() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    return u?.id || u?._id;
  })();

  const myRank = leaderboard.findIndex(u => u.id === currentUserId) + 1;

  // ----- Export -----
  const handleExport = () => {
    if (!myComplaints.length) { alert('No data to export'); return; }
    const rows = myComplaints.map(c => ({
      Title: c.title, Category: c.category, Status: c.status,
      Priority: c.priority || 'medium', Location: c.location?.address || '',
      Created: new Date(c.createdAt).toLocaleDateString(),
      Votes: c.voteCount || 0,
    }));
    const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `my-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Leaderboard</h1>
            <p className="text-gray-500 mt-1 text-sm">Your activity analytics and workspace rankings</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={selectedWorkspace}
                onChange={e => setSelectedWorkspace(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 bg-white"
              >
                <option value="all">All Workspaces</option>
                {workspaces.map(ws => (
                  <option key={ws._id} value={ws._id}>{ws.organizationName} ({ws.workspaceCode})</option>
                ))}
              </select>
              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button onClick={loadAll} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'My Issues', value: myStats.total, icon: <AlertCircle className="w-5 h-5 text-blue-600"/>, bg: 'bg-blue-50', sub: `${myStats.resolved} resolved` },
          { label: 'Resolution Rate', value: myStats.resRate + '%', icon: <CheckCircle className="w-5 h-5 text-green-600"/>, bg: 'bg-green-50', sub: `${myStats.resolved} of ${myStats.total}` },
          { label: 'Avg. Resolution', value: myStats.avgDays === 'N/A' ? 'N/A' : myStats.avgDays + 'd', icon: <Clock className="w-5 h-5 text-yellow-600"/>, bg: 'bg-yellow-50', sub: 'Days to resolve' },
          { label: 'Total Votes', value: myStats.totalVotes, icon: <ThumbsUp className="w-5 h-5 text-purple-600"/>, bg: 'bg-purple-50', sub: 'Community support' },
          { label: 'Active Issues', value: myStats.pending + myStats.inProgress, icon: <Activity className="w-5 h-5 text-orange-600"/>, bg: 'bg-orange-50', sub: 'Pending + In progress' },
        ].map(({ label, value, icon, bg, sub }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* My Rank */}
      {myRank > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-5 text-white flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-2xl font-bold">#{myRank}</span>
          </div>
          <div>
            <p className="font-bold text-lg">Your Workspace Rank</p>
            <p className="text-white/80 text-sm">
              {myRank === 1 ? '🏆 You are the top contributor!' : myRank <= 3 ? '🥉 Top 3 contributor!' : `Keep reporting to climb the leaderboard`}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Monthly Activity (Last 6 Months)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="reported" name="Reported" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-5">My Issues by Category</h3>
          {categoryData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No category data yet</div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Workspace Leaderboard</h3>
              <p className="text-xs text-gray-500 mt-0.5">{allComplaints.length} total issues • {leaderboard.length} contributors</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search member..."
                  value={leaderSearch}
                  onChange={e => setLeaderSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 w-40"
                />
              </div>
              <select
                value={leaderSort}
                onChange={e => setLeaderSort(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:border-blue-500"
              >
                <option value="reported">By Reports</option>
                <option value="resolved">By Resolved</option>
                <option value="votes">By Votes</option>
              </select>
            </div>
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {leaderboard.slice(0, 15).map((user, idx) => {
              const rank = idx + 1;
              const isMe = user.id === currentUserId;
              return (
                <div key={user.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${isMe ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
                  <div className="w-8 flex items-center justify-center flex-shrink-0">{getRankIcon(rank)}</div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user.name} {isMe && <span className="text-blue-600 text-xs font-medium">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.resolved} resolved of {user.reported} •{' '}
                      {user.reported > 0 ? Math.round((user.resolved / user.reported) * 100) : 0}% rate
                    </p>
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm">{user.reported}</p>
                      <p className="text-xs text-gray-400">Reports</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600 text-sm">{user.resolved}</p>
                      <p className="text-xs text-gray-400">Resolved</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-blue-600 text-sm">{user.votes}</p>
                      <p className="text-xs text-gray-400">Votes</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No data yet for this workspace</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/home/raise-complaint')}
            className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-left"
          >
            <Plus className="w-5 h-5 text-blue-600 mb-2" />
            <p className="font-medium text-blue-700 text-sm">Report New Issue</p>
          </button>
          <button
            onClick={() => navigate('/home/my-complaints')}
            className="p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors text-left"
          >
            <Target className="w-5 h-5 text-green-600 mb-2" />
            <p className="font-medium text-green-700 text-sm">My Complaints</p>
          </button>
          <button
            onClick={handleExport}
            className="p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors text-left"
          >
            <Download className="w-5 h-5 text-purple-600 mb-2" />
            <p className="font-medium text-purple-700 text-sm">Export My Data</p>
          </button>
          <button
            onClick={loadAll}
            className="p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors text-left"
          >
            <RefreshCw className="w-5 h-5 text-orange-600 mb-2" />
            <p className="font-medium text-orange-700 text-sm">Refresh Data</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
