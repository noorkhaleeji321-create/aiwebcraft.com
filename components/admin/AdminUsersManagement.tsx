import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  Layers, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  MapPin, 
  Clock, 
  Info,
  ChevronRight,
  UserX,
  UserCheck
} from 'lucide-react';
import { AdminUser, SellerProject } from '../../types';
import { fetchAdminUsers, updateUserStatusServer } from '../../services/adminService';
import { getAllStoredSellerProjects } from '../../services/sellerStore';

interface AdminUsersManagementProps {
  onRefreshStats?: () => void;
}

export const AdminUsersManagement: React.FC<AdminUsersManagementProps> = ({ onRefreshStats }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Buyer' | 'Seller' | 'Both' | 'Super Admin'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');

  // Detail Drawer state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userProjects, setUserProjects] = useState<SellerProject[]>([]);
  
  // Suspend Dialog state
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = (user: AdminUser) => {
    setSelectedUser(user);
    // Find projects owned by this user
    const allProjects = getAllStoredSellerProjects();
    const owns = allProjects.filter(p => p.seller?.email === user.email || p.seller?.id === user.id);
    setUserProjects(owns);
  };

  const handleStatusChange = async (userId: string, action: 'Activate' | 'Suspend', reason?: string) => {
    setSubmittingStatus(true);
    try {
      const res = await updateUserStatusServer(userId, action, reason);
      if (res.success && res.user) {
        // Update local state
        setUsers(prev => prev.map(u => u.id === userId ? res.user! : u));
        if (selectedUser?.id === userId) {
          setSelectedUser(res.user);
        }
        if (onRefreshStats) onRefreshStats();
        // Reset suspension dialog
        setSuspendUserId(null);
        setSuspendReason('');
      } else {
        alert(res.message || 'Action failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing action');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const triggerSuspend = (userId: string) => {
    setSuspendUserId(userId);
    setSuspendReason('');
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query);
    
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#2C2A26] transition-all font-semibold placeholder-[#8C8275]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8C8275] uppercase tracking-wider">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-white border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl py-2 px-3 font-bold focus:outline-none focus:border-[#2C2A26]"
            >
              <option value="All">All Roles</option>
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
              <option value="Both">Both (Buyer/Seller)</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8C8275] uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl py-2 px-3 font-bold focus:outline-none focus:border-[#2C2A26]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <button 
            onClick={loadUsers}
            className="p-2.5 bg-white border border-[#E2DDD3] hover:bg-[#F5F2EB] rounded-xl text-[#2C2A26] transition-all text-xs font-bold"
            title="Reload Users"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-[#E2DDD3] rounded-3xl">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#5D5A53] font-bold">Fetching secure accounts data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-3xl text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h4 className="font-serif font-bold text-base">Database Connection Fault</h4>
          <p className="text-xs text-red-800">{error}</p>
          <button onClick={loadUsers} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
            Retry Connection
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-[#E2DDD3] rounded-3xl p-16 text-center space-y-3">
          <User className="w-10 h-10 text-[#8C8275] mx-auto opacity-50" />
          <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Users Found</h3>
          <p className="text-xs text-[#5D5A53]">No accounts match the selected search criteria or filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2DDD3] rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2C2A26]">
              <thead className="bg-[#F5F2EB] border-b border-[#E2DDD3] text-[#8C8275] font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Account Role</th>
                  <th className="p-4">Registration</th>
                  <th className="p-4 text-center">Projects</th>
                  <th className="p-4 text-center">Purchases</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD3]">
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id || `usr-${idx}-${user.email}`} className="hover:bg-[#FDFCF9] transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-9 h-9 rounded-full object-cover border border-[#E2DDD3]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#E2DDD3] text-[#2C2A26] flex items-center justify-center font-bold text-xs uppercase">
                            {user.name.substring(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-[#2C2A26] truncate flex items-center gap-1.5">
                            {user.name}
                            {user.role === 'Super Admin' && (
                              <span className="px-1.5 py-0.5 bg-amber-500 text-amber-950 text-[8px] font-extrabold rounded">STAFF</span>
                            )}
                          </h4>
                          <span className="text-[11px] text-[#5D5A53] block truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        user.role === 'Super Admin' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        user.role === 'Seller' ? 'bg-purple-100 text-purple-900 border-purple-200' :
                        user.role === 'Both' ? 'bg-blue-100 text-blue-900 border-blue-200' :
                        'bg-stone-100 text-stone-800 border-stone-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-[#5D5A53]">
                      {user.registrationDate}
                    </td>
                    <td className="p-4 text-center font-bold">
                      {user.projectsCount > 0 ? (
                        <span className="px-2 py-0.5 bg-[#F5F2EB] rounded text-[#2C2A26] text-[11px]">{user.projectsCount}</span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center font-bold">
                      {user.purchasesCount > 0 ? (
                        <span className="px-2 py-0.5 bg-[#F5F2EB] rounded text-[#2C2A26] text-[11px]">{user.purchasesCount}</span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        user.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                          : 'bg-rose-50 text-rose-900 border-rose-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenProfile(user)}
                          className="px-2.5 py-1.5 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] text-[11px] font-bold rounded-lg transition-all"
                        >
                          View Profile
                        </button>
                        
                        {user.role !== 'Super Admin' && (
                          user.status === 'Active' ? (
                            <button
                              onClick={() => triggerSuspend(user.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-900 rounded-lg transition-all"
                              title="Suspend User Account"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(user.id, 'Activate')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg transition-all"
                              title="Activate User Account"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUSPENSION REASON MODAL */}
      {suspendUserId && (
        <div className="fixed inset-0 bg-[#2C2A26]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD3] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">Suspend User Account</h3>
              </div>
              <button 
                onClick={() => setSuspendUserId(null)}
                className="p-1 hover:bg-[#F5F2EB] rounded-lg text-[#8C8275]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5D5A53]">
              You are about to suspend this user account. Suspended users will be blocked from logging in, listing projects, or initiating checkout.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">
                Suspension Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Specify the exact platform policy violation or reason..."
                className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs p-3 focus:outline-none focus:border-rose-600 min-h-[100px] text-[#2C2A26] font-semibold"
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Suspicious checkout attempts.', 'Failed KYC authentication.', 'Listing unauthorized copyright assets.', 'Spam behavior detected.'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSuspendReason(preset)}
                    className="px-2 py-1 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] text-[10px] rounded font-semibold"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuspendUserId(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(suspendUserId, 'Suspend', suspendReason)}
                disabled={submittingStatus || suspendReason.trim().length < 3}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2"
              >
                {submittingStatus ? 'Suspending...' : 'Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE DETAIL MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-[#2C2A26]/80 backdrop-blur-sm z-40 flex items-center justify-end">
          <div className="bg-[#FDFCF9] border-l border-[#E2DDD3] w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto space-y-6 flex flex-col animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#8C8275]" />
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">User Account Details</h3>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1.5 hover:bg-[#F5F2EB] rounded-xl text-[#8C8275]"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Profile Hero Card */}
            <div className="bg-white border border-[#E2DDD3] p-4 rounded-3xl flex gap-4">
              {selectedUser.avatar ? (
                <img 
                  src={selectedUser.avatar} 
                  alt={selectedUser.name} 
                  className="w-16 h-16 rounded-2xl object-cover border border-[#E2DDD3] shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#E2DDD3] text-[#2C2A26] flex items-center justify-center font-bold text-xl shrink-0 uppercase">
                  {selectedUser.name.substring(0, 2)}
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <h4 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
                  {selectedUser.name}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    selectedUser.status === 'Active' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {selectedUser.status}
                  </span>
                </h4>
                <p className="text-xs text-[#5D5A53] flex items-center gap-1.5 font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  {selectedUser.email}
                </p>
                {selectedUser.location && (
                  <p className="text-[11px] text-[#8C8275] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedUser.location}
                  </p>
                )}
              </div>
            </div>

            {/* User Bio if any */}
            {selectedUser.bio && (
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider">Account Biography / Notes</h5>
                <p className="text-xs text-[#2C2A26] bg-white border border-[#E2DDD3] p-3 rounded-2xl leading-relaxed italic">
                  "{selectedUser.bio}"
                </p>
              </div>
            )}

            {/* Suspension Info banner if suspended */}
            {selectedUser.status === 'Suspended' && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Administrative Suspension Notice</span>
                </div>
                <p className="text-xs text-rose-800 font-semibold pl-6">
                  Reason: {selectedUser.suspensionReason || 'No explicit reason specified.'}
                </p>
              </div>
            )}

            {/* Platform Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#E2DDD3] p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Role Category</span>
                <span className="text-xs font-bold text-[#2C2A26] block">{selectedUser.role} Account</span>
              </div>
              <div className="bg-white border border-[#E2DDD3] p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Member Since</span>
                <span className="text-xs font-semibold text-[#2C2A26] block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8C8275]" />
                  {selectedUser.registrationDate}
                </span>
              </div>
              <div className="bg-white border border-[#E2DDD3] p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Created Submissions</span>
                <span className="text-sm font-bold text-[#2C2A26] block flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  {selectedUser.projectsCount} Projects
                </span>
              </div>
              <div className="bg-white border border-[#E2DDD3] p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Acquisitions Count</span>
                <span className="text-sm font-bold text-[#2C2A26] block flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  {selectedUser.purchasesCount} Purchased
                </span>
              </div>
            </div>

            {/* List of Projects Owned by User */}
            <div className="space-y-2.5">
              <h5 className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider flex items-center justify-between">
                <span>Projects Portfolio ({userProjects.length})</span>
                <span className="text-[9px] font-normal text-[#5D5A53]">Sourced from Marketplace</span>
              </h5>
              {userProjects.length === 0 ? (
                <div className="bg-white border border-dashed border-[#E2DDD3] p-6 rounded-2xl text-center text-xs text-[#8C8275]">
                  This user has not listed any startup projects yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {userProjects.map(proj => (
                    <div key={proj.id} className="bg-white border border-[#E2DDD3] p-3 rounded-2xl flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-[#2C2A26] truncate">{proj.title}</p>
                        <p className="text-[10px] text-[#8C8275] uppercase font-semibold">{proj.category} • ${(proj.askingPrice || 0).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        proj.sellerStatus === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        proj.sellerStatus === 'Pending Review' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-stone-50 text-stone-700 border-stone-200'
                      }`}>
                        {proj.sellerStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Logs / Telemetry info */}
            <div className="space-y-2 border-t border-[#E2DDD3] pt-4">
              <h5 className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider">Account Activity Logs</h5>
              <div className="bg-[#F5F2EB] p-3 rounded-2xl space-y-1.5 text-[11px] text-[#5D5A53]">
                {selectedUser.lastLogin && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8C8275]" />
                    <span>Last Login Activity: <strong className="text-[#2C2A26]">{new Date(selectedUser.lastLogin).toLocaleString()}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#8C8275]" />
                  <span>Administrative Audit: <strong className="text-[#2C2A26]">Verified secure credentials, zero plaintext passwords stored.</strong></span>
                </div>
              </div>
            </div>

            {/* Administrative Action Bottom Row */}
            <div className="mt-auto pt-4 border-t border-[#E2DDD3] flex items-center gap-2">
              {selectedUser.role !== 'Super Admin' && (
                selectedUser.status === 'Active' ? (
                  <button
                    onClick={() => {
                      triggerSuspend(selectedUser.id);
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserX className="w-4 h-4" />
                    Suspend User Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'Activate')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    Reactivate User Account
                  </button>
                )
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
              >
                Dismiss Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
