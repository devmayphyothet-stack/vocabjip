import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FeedbackRecord, FeedbackStatus } from '../types';
import { 
  MessageSquare, 
  Star, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Tag, 
  Sparkles,
  Search,
  Filter,
  Check,
  ChevronRight
} from 'lucide-react';

export function AdminFeedbackView() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setFeedbacks(data as FeedbackRecord[]);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: FeedbackStatus) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('user_feedback')
        .update({ status: newStatus })
        .eq('id', id);

      if (!error) {
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (statusFilter !== 'all' && (f.status || 'new') !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (f.title + ' ' + f.message + ' ' + (f.email || '')).toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const newCount = feedbacks.filter(f => (f.status || 'new') === 'new').length;
  const inProgressCount = feedbacks.filter(f => f.status === 'in_progress').length;
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length;
  const avgRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, cur) => acc + (cur.rating || 5), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const getCategoryBadgeClass = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'bug':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'feature':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'content':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Student & Community Voice</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mobile User Feedback</h1>
          <p className="text-slate-500 text-xs mt-1">
            Review bug reports, feature requests, and vocabulary improvement feedback sent from the mobile app.
          </p>
        </div>

        <button
          onClick={fetchFeedbacks}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition self-start md:self-auto">
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</div>
          <div className="text-2xl font-black text-slate-900">{feedbacks.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Star Rating</div>
          <div className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
            <span>{avgRating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New (Unread)</div>
          <div className="text-2xl font-black text-blue-600">{newCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved</div>
          <div className="text-2xl font-black text-emerald-600">{resolvedCount}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex rounded-xl bg-slate-200/60 p-1 w-fit">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}>
            All ({feedbacks.length})
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'new' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}>
            New ({newCount})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'in_progress' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}>
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'resolved' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}>
            Resolved ({resolvedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
            Loading feedbacks...
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p>No feedbacks match your filter.</p>
          </div>
        ) : (
          filteredFeedbacks.map(f => {
            const currentStatus = f.status || 'new';

            return (
              <div 
                key={f.id} 
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getCategoryBadgeClass(f.category)}`}>
                      {f.category}
                    </span>

                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= (f.rating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <span className="text-xs font-bold text-slate-800">{f.title}</span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={currentStatus}
                      disabled={updatingId === f.id}
                      onChange={(e) => handleUpdateStatus(f.id, e.target.value as FeedbackStatus)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition ${
                        currentStatus === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : currentStatus === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                      <option value="new">Status: New</option>
                      <option value="in_progress">Status: In Progress</option>
                      <option value="resolved">Status: Resolved</option>
                      <option value="closed">Status: Closed</option>
                    </select>

                    {f.email && (
                      <a
                        href={`mailto:${f.email}?subject=Regarding your VocabJip feedback: ${encodeURIComponent(f.title)}`}
                        className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition"
                        title="Reply via Email">
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {f.message}
                </p>

                {/* Footer metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1 pt-1">
                  <div>
                    Submitted by: <strong className="text-slate-600">{f.email || 'Anonymous Student'}</strong>
                  </div>
                  <div>
                    {new Date(f.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
