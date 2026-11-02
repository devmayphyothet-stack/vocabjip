import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  KeyRound,
  Layers,
  MessageSquare,
  PenTool,
  UploadCloud,
  Users
} from 'lucide-react';
import { useAuth } from '../context/auth-context';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  pendingReviewCount?: number;
}

export function Sidebar({ activeView, setActiveView, pendingReviewCount = 0 }: SidebarProps) {
  const { isAdmin } = useAuth();

  const contributorNav = [
    {
      id: 'vocab',
      label: 'Vocab Studio',
      subtitle: 'Everyday → Academic words',
      icon: BookOpen,
    },
    {
      id: 'patterns',
      label: 'Pattern Studio',
      subtitle: 'TOPIK 51-54 Sentence Patterns',
      icon: PenTool,
    },
    {
      id: 'prompts',
      label: 'Essay Prompts',
      subtitle: 'Q53 & Q54 Task Prompts',
      icon: FileText,
    },
    {
      id: 'bulk',
      label: 'Bulk Excel Import',
      subtitle: 'Paste from Sheets or CSV',
      icon: UploadCloud,
    },
    {
      id: 'submissions',
      label: 'My Submissions',
      subtitle: 'Track review & revision status',
      icon: Layers,
    },
  ];

  const adminNav = [
    {
      id: 'review',
      label: 'Review Queue',
      subtitle: 'Inspect & Approve to Mobile',
      icon: CheckCircle2,
      badge: pendingReviewCount,
    },
    {
      id: 'invitations',
      label: 'Contributor Invites',
      subtitle: 'Magic links for teachers',
      icon: KeyRound,
    },
    {
      id: 'feedback',
      label: 'Mobile Feedback',
      subtitle: 'Student bug reports & ideas',
      icon: MessageSquare,
    },
    {
      id: 'analytics',
      label: 'Analytics & Leaderboard',
      subtitle: 'Top mentors & coverage',
      icon: BarChart3,
    },
    {
      id: 'users',
      label: 'Manage Contributors',
      subtitle: 'Review & manage contributors',
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-[#FAF9F5] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* If Admin: Show ONLY Admin Moderation Suite */}
        {isAdmin ? (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              <span>Admin Management</span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            </div>

            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-start justify-between px-3 py-2.5 rounded-xl text-left transition ${isActive
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900 font-medium'
                      }`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                      <div>
                        <div className="text-xs font-semibold leading-tight">{item.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ) : (
          /* If Contributor: Show ONLY Contributor Content Creation Workspace */
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Contributor Workspace</span>
            </div>

            <nav className="space-y-1">
              {contributorNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition ${isActive
                        ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-bold'
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 font-medium'
                      }`}>
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-semibold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 text-center text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-slate-600">
          {isAdmin ? 'VocabJip Admin Console' : 'VocabJip Publishing Cloud'}
        </p>
        <p>{isAdmin ? 'Review & publish TOPIK lessons' : 'Syncs directly to Myanmar TOPIK learners'}</p>
      </div>
    </aside>
  );
}

