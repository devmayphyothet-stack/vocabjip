export type AuthMode = 'signin' | 'signup' | 'recovery';

export interface UserProfile {
  id: string;
  email: string;
  avatarKey?: string;
  bio?: string;
  koreanBackground?: string;
  role?: 'user' | 'contributor' | 'admin';
  displayName: string;
  targetLevel: string; // e.g. "TOPIK II Level 4"
  streakDays: number;
  dailyGoal: number; // e.g. 3
  dailyCompleted: number; // e.g. 2
  createdAt: string;
}

export interface PendingOtpSession {
  email: string;
  displayName?: string;
  password?: string; // used internally for auto-login if needed
  type: 'signup' | 'recovery';
  sentAt: number; // epoch ms
  expiresAt: number; // epoch ms (sentAt + 10 mins)
  resendAvailableAt: number; // epoch ms (sentAt + 60s)
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  pendingOtp: PendingOtpSession | null;
}

