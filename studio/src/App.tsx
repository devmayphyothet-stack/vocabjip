import React, { useState, useEffect } from 'react';
import { useAuth } from './context/auth-context';
import { supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { VocabStudioView } from './views/VocabStudioView';
import { PatternStudioView } from './views/PatternStudioView';
import { QuizStudioView } from './views/QuizStudioView';
import { EssayPromptStudioView } from './views/EssayPromptStudioView';
import { StudentEssayReviewView } from './views/StudentEssayReviewView';
import { BulkImportView } from './views/BulkImportView';
import { MySubmissionsView } from './views/MySubmissionsView';
import { AdminReviewView } from './views/AdminReviewView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminInvitationsView } from './views/AdminInvitationsView';
import { AdminFeedbackView } from './views/AdminFeedbackView';
import { AdminAnalyticsView } from './views/AdminAnalyticsView';
import { AdminAiSettingsView } from './views/AdminAiSettingsView';
import { LoginView } from './views/LoginView';
import { Loader2 } from 'lucide-react';

export function AppContent() {
  const { user, loading, isAdmin, isContributor, refreshProfile, signOut } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [activeView, setActiveView] = useState<string>('');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        // If current view is a contributor view, switch to admin default
        const contributorViews = ['vocab', 'patterns', 'quizzes', 'prompts', 'bulk', 'submissions'];
        if (!activeView || contributorViews.includes(activeView)) {
          setActiveView('review');
        }
      } else {
        // If current view is an admin view, switch to contributor default
        const adminViews = ['review', 'invitations', 'feedback', 'analytics', 'users', 'ai-settings'];
        if (!activeView || adminViews.includes(activeView)) {
          setActiveView('vocab');
        }
      }
    }
  }, [user, isAdmin]);

  const fetchPendingCount = async () => {
    if (!isAdmin) return;
    try {
      const [{ count: vCount }, { count: pCount }, { count: qCount }] = await Promise.all([
        supabase.from('vocabularies').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('sentence_patterns').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('quiz_steps').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      ]);
      setPendingCount((vCount || 0) + (pCount || 0) + (qCount || 0));
    } catch (e) {
      console.warn('Count fetch error:', e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPendingCount();
    }
  }, [isAdmin, activeView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading VocabJip Studio...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!isAdmin && !isContributor) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FBFBF9] p-6">
      <form className="max-w-md space-y-4" onSubmit={async event => {
        event.preventDefault(); setInviteError('');
        const { error } = await supabase.rpc('redeem_contributor_invitation', { invite_code: inviteCode.trim().toUpperCase() });
        if (error) { setInviteError(error.message); return; }
        sessionStorage.removeItem('vocabjip_pending_invite');
        await refreshProfile();
      }}>
        <h1 className="text-xl font-bold">Contributors access</h1>
        <p>Your account needs a Contributors invitation to use Studio.</p>
        <label className="block">Invitation code<input className="block border rounded p-3 w-full" value={inviteCode} onChange={event => setInviteCode(event.target.value)} required /></label>
        {inviteError && <p role="alert">{inviteError}</p>}
        <button className="bg-blue-600 text-white rounded p-3" type="submit">Redeem invitation</button>
        <button className="ml-4" type="button" onClick={() => { void signOut(); }}>Sign out</button>
      </form>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        pendingReviewCount={pendingCount}
      />

      {/* Main Layout: Sidebar + View Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          pendingReviewCount={pendingCount}
        />

        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {activeView === 'vocab' && <VocabStudioView onSubmitted={fetchPendingCount} />}
          {activeView === 'patterns' && <PatternStudioView onSubmitted={fetchPendingCount} />}
          {activeView === 'quizzes' && <QuizStudioView onSubmitted={fetchPendingCount} />}
          {activeView === 'prompts' && <EssayPromptStudioView onSubmitted={fetchPendingCount} />}
          {activeView === 'essay-reviews' && <StudentEssayReviewView onReviewCompleted={fetchPendingCount} />}
          {activeView === 'bulk' && <BulkImportView onSubmitted={fetchPendingCount} />}
          {activeView === 'submissions' && <MySubmissionsView />}
          {activeView === 'review' && <AdminReviewView onReviewDone={fetchPendingCount} />}
          {activeView === 'invitations' && <AdminInvitationsView />}
          {activeView === 'feedback' && <AdminFeedbackView />}
          {activeView === 'analytics' && <AdminAnalyticsView />}
          {activeView === 'users' && <AdminUsersView />}
          {activeView === 'ai-settings' && <AdminAiSettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}

