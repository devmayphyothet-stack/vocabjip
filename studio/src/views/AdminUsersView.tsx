import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { Users, Shield, PenTool, User as UserIcon, Search, CheckCircle2, UserPlus } from 'lucide-react';

export function AdminUsersView() {
  const { user: currentAdmin, isAdmin } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setUsers(data as UserProfile[]);
      }
    } catch (e) {
      console.warn('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setUpdatingId(targetUserId);
    setSuccessNote(null);
    try {
      const { error } = await supabase.rpc('set_profile_role', { target_user_id: targetUserId, new_role: newRole });

      if (error) throw error;
      setSuccessNote(`User role updated to ${newRole.toUpperCase()} successfully.`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error updating role');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.display_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  if (!isAdmin) {
    return <div className="p-12 text-center text-slate-500">Admin Access Required.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Roles & Contributors</h1>
          <p className="text-sm text-slate-500 mt-1">
            ကျောင်းသား/သူများအား Contributor သို့မဟုတ် Admin အဖြစ် Role သတ်မှတ်ပေးခြင်း
          </p>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {successNote && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Profiles</div>
            <div className="text-xl font-extrabold text-slate-900">{users.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Approved Contributors</div>
            <div className="text-xl font-extrabold text-emerald-700">
              {users.filter((u) => u.role === 'contributor').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Core Admin</div>
            <div className="text-xl font-extrabold text-purple-700">
              {users.filter((u) => u.role === 'admin').length}
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Display Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentAdmin?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.display_name || 'TOPIK Learner'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{u.email}</td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Shield className="w-3 h-3" /> ADMIN
                        </span>
                      ) : u.role === 'contributor' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <PenTool className="w-3 h-3" /> CONTRIBUTOR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                          <UserIcon className="w-3 h-3" /> Student
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isSelf || u.role === 'admin' ? (
                        <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-1 rounded-md border border-purple-200">
                          Sole Admin
                        </span>
                      ) : (
                        <select
                          disabled={updatingId === u.id}
                          value={u.role || 'user'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="user">Student (App Learner)</option>
                          <option value="contributor">Contributor (Content Creator)</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

