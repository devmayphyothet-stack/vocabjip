import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { InvitationRecord } from '../types';
import { 
  Send, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Clock, 
  UserCheck, 
  KeyRound, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export function AdminInvitationsView() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Invite modal/form state
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [targetRole, setTargetRole] = useState<'contributor' | 'admin'>('contributor');
  const [expiryDays, setExpiryDays] = useState<'7' | '30' | 'never'>('30');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedLink, setNewlyCreatedLink] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setInvitations(data as InvitationRecord[]);
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'INV-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const code = generateRandomCode();
      let expiresAt: string | null = null;
      if (expiryDays !== 'never') {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(expiryDays, 10));
        expiresAt = d.toISOString();
      }

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          code,
          invited_email: invitedEmail.trim() || null,
          role: targetRole,
          notes: notes.trim() || null,
          created_by: user?.id,
          expires_at: expiresAt,
          is_used: false,
        })
        .select()
        .single();

      if (error) {
        alert('Failed to create invitation: ' + error.message);
        return;
      }

      const fullLink = `${window.location.origin}?invite=${code}`;
      setNewlyCreatedLink(fullLink);
      setNotes('');
      setInvitedEmail('');
      await fetchInvitations();
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDeleteInvite = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation code?')) return;
    try {
      await supabase.from('invitations').delete().eq('id', id);
      setInvitations(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting invitation:', err);
    }
  };

  const filteredList = invitations.filter(inv => {
    if (filter === 'active') return !inv.is_used;
    if (filter === 'used') return inv.is_used;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4" />
            <span>Community Onboarding</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contributor Invitations</h1>
          <p className="text-slate-500 text-xs mt-1">
            Generate magic invitation codes for TOPIK teachers, university mentors, and advanced learners.
          </p>
        </div>

        <button
          onClick={() => {
            setNewlyCreatedLink(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0">
          <Plus className="w-4 h-4" />
          <span>Generate Invite Code</span>
        </button>
      </div>

      {/* Filter Tabs & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex rounded-xl bg-slate-200/60 p-1 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}>
            All ({invitations.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}>
            Active ({invitations.filter(i => !i.is_used).length})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'used' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}>
            Used ({invitations.filter(i => i.is_used).length})
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Tip: Anyone with a valid link gets automatically assigned as a <strong className="text-slate-600">Contributor</strong>.
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading invitations...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <KeyRound className="w-8 h-8 mx-auto text-slate-300" />
            <p>No invitations found in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code / Link</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Target / Note</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map(inv => {
                  const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();
                  const link = `${window.location.origin}?invite=${inv.code}`;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {inv.code}
                          </span>
                          {!inv.is_used && (
                            <button
                              onClick={() => handleCopy(link, inv.id)}
                              title="Copy Magic Invite Link"
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-md transition flex items-center gap-1 text-[11px]">
                              {copiedCode === inv.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          inv.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {inv.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {inv.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px] truncate">
                        <div className="font-medium text-slate-800">
                          {inv.invited_email || inv.notes || <span className="text-slate-400 italic">Open invitation</span>}
                        </div>
                        {inv.invited_email && inv.notes && (
                          <div className="text-[11px] text-slate-400 truncate">{inv.notes}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {inv.is_used ? (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-medium">
                            <Check className="w-3 h-3 text-slate-400" />
                            Redeemed
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-md text-[11px] font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Ready to Use
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {inv.expires_at ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(inv.expires_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          'No expiry'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!inv.is_used && (
                          <button
                            onClick={() => handleDeleteInvite(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Revoke Invite">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Generate Invitation */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Generate Invitation Code</h3>
                <p className="text-xs text-slate-500">Create an onboarding link for a new contributor or reviewer</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1">
                ✕
              </button>
            </div>

            {newlyCreatedLink ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Invitation Created Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Share this magic onboarding link with the teacher/contributor:
                  </p>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-emerald-300">
                    <input
                      type="text"
                      readOnly
                      value={newlyCreatedLink}
                      className="w-full text-xs font-mono text-slate-700 bg-transparent outline-none"
                    />
                    <button
                      onClick={() => handleCopy(newlyCreatedLink, 'modal')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0">
                      {copiedCode === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === 'modal' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Target Role (အခန်းကဏ္ဍ)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetRole('contributor')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        targetRole === 'contributor'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      <UserCheck className="w-4 h-4" />
                      <span>Contributor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetRole('admin')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        targetRole === 'admin'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Invited Email (Optional - သီးသန့်ပေးပို့လိုပါက ထည့်ပါ)
                  </label>
                  <input
                    type="email"
                    value={invitedEmail}
                    onChange={(e) => setInvitedEmail(e.target.value)}
                    placeholder="e.g. teacher.su@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Internal Note / Name (မှတ်ချက် / အမည်)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Sayama Su Myat - TOPIK Level 6 Teacher in Seoul"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Expiration (သက်တမ်း)
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="never">Never Expires</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <Sparkles className="w-4 h-4" />
                    <span>{creating ? 'Creating...' : 'Create Invite Link'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
