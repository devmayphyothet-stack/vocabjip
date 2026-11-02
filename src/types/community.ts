export interface CommunityEssay {
  id: string;
  userId: string;
  authorName: string;
  type: 'Q53' | 'Q54' | 'statement';
  title: string;
  content: string;
  scoreEstimate: string; // e.g. "37 / 50" or "24 / 30"
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface ReportReason {
  id: string;
  label: string;
  description: string;
}

export const REPORT_REASONS: ReportReason[] = [
  {
    id: 'privacy',
    label: 'Private Information',
    description: 'Contains personal phone numbers, addresses, or private details.',
  },
  {
    id: 'misleading',
    label: 'Copied or Misleading Content',
    description: 'Plagiarized from standard textbook without attribution or inaccurate facts.',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate Language',
    description: 'Offensive language or disrespectful content.',
  },
  {
    id: 'other',
    label: 'Other Issues',
    description: 'Other concerns regarding community guidelines.',
  },
];

