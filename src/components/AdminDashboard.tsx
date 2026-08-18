import React, { useState } from 'react';
import { AnalyticsStats, Room, User } from '../types';
import {
  ShieldCheck,
  Users,
  Building,
  Eye,
  Trash2,
  TrendingUp,
  Search,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell
} from 'recharts';

interface AdminDashboardProps {
  stats: AnalyticsStats | null;
  users: User[];
  rooms: Room[];
  onDeleteUser: (userId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onRefresh: () => void;
}

const BAR_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  users,
  rooms,
  onDeleteUser,
  onDeleteRoom,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'rooms'>('analytics');
  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'owner'>('all');
  const [roomQuery, setRoomQuery] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.phone.includes(userQuery);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesQuery && matchesRole;
  });

  const filteredRooms = rooms.filter((r) => {
    return (
      r.title.toLowerCase().includes(roomQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(roomQuery.toLowerCase()) ||
      r.contactName.toLowerCase().includes(roomQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-800">
      {/* Admin Security Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-1">
              <span>SECURITY AUTHENTICATED ADMINISTRATOR</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">System Admin Control Center</h1>
            <p className="text-xs text-slate-500">
              Full control over room listings, owner/user management, and website traffic reach analytics.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-all"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            Website Reach
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalPageViews || 0}</p>
          <p className="text-[10px] text-blue-600 font-medium">Page Views Tracked</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Registered Users
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
          <p className="text-[10px] text-slate-500 font-medium">Renters / Guests</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            Registered Owners
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalOwners || 0}</p>
          <p className="text-[10px] text-slate-500 font-medium">Property Owners</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            Total Rooms
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalRooms || 0}</p>
          <p className="text-[10px] text-blue-600 font-medium">{stats?.availableRooms || 0} Available</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-slate-600" />
            Booked Rooms
          </span>
          <p className="text-2xl font-black text-slate-700">{stats?.bookedRooms || 0}</p>
          <p className="text-[10px] text-slate-500 font-medium">Occupied</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            Inquiries Sent
          </span>
          <p className="text-2xl font-black text-blue-600">{stats?.totalInquiries || 0}</p>
          <p className="text-[10px] text-slate-500 font-medium">Messages</p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analytics & Traffic</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Owners ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Manage Rooms ({rooms.length})</span>
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Traffic Reach Trend */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Website Reach & Views Trend
              </h3>
              <p className="text-xs text-slate-500">Daily visitor impressions and inquiry activity</p>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.viewsTrend || []}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      color: '#1e293b',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#viewsGrad)"
                    name="Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Rooms Distribution by City */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Listings by City Location
              </h3>
              <p className="text-xs text-slate-500">Geographic distribution of room listings</p>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.roomsByCity || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="city" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      color: '#1e293b',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Rooms">
                    {stats?.roomsByCity?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Users & Owners Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search name, email, or phone..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {(['all', 'user', 'owner'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                    userRoleFilter === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r === 'all' ? 'All Roles' : `${r}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                            u.role === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : u.role === 'owner'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">{u.phone || 'N/A'}</td>
                      <td className="p-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to delete ${u.role} "${u.name}"? If owner, their listings will also be removed.`
                                )
                              ) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Management Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={roomQuery}
                onChange={(e) => setRoomQuery(e.target.value)}
                placeholder="Search room title, city, owner..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        room.status === 'Available' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                      }`}
                    >
                      {room.status}
                    </span>
                    <span className="text-xs font-bold text-blue-600">${room.price} / mo</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 line-clamp-1">{room.title}</h4>
                  <p className="text-xs text-slate-500">{room.location}, {room.city}</p>
                  <p className="text-xs text-slate-400">Owner: {room.contactName} ({room.contactPhone})</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">{room.viewsCount} views</span>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete room "${room.title}"?`)) {
                        onDeleteRoom(room.id);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Room</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
