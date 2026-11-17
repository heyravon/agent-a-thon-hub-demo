export type Round = 'test-primary-1' | 'test-primary-2' | 'test-primary-3' | 'test-final-1' | 'test-final-2' | 'test-final-3' | 'primary' | 'final';

export const ROUND_LABELS: Record<Round, string> = {
  'test-primary-1': 'Test Primary 1',
  'test-primary-2': 'Test Primary 2',
  'test-primary-3': 'Test Primary 3',
  'test-final-1': 'Test Final 1',
  'test-final-2': 'Test Final 2',
  'test-final-3': 'Test Final 3',
  'primary': 'Primary Round',
  'final': 'Final Round',
};

export const ROUNDS: Round[] = ['test-primary-1', 'test-primary-2', 'test-primary-3', 'test-final-1', 'test-final-2', 'test-final-3', 'primary', 'final'];
export const TEST_ROUNDS: Round[] = ['test-primary-1', 'test-primary-2', 'test-primary-3', 'test-final-1', 'test-final-2', 'test-final-3'];
export const OFFICIAL_ROUNDS: Round[] = ['primary', 'final'];

// Which round feeds into which for top-8 advancement
export const PRIMARY_ROUNDS: Round[] = ['test-primary-1', 'test-primary-2', 'test-primary-3', 'primary'];
export const FINAL_ROUNDS: Round[] = ['test-final-1', 'test-final-2', 'test-final-3', 'final'];

// Given a final round, returns the corresponding primary round to pull top 8 from
export const ADVANCEMENT_MAP: Partial<Record<Round, Round>> = {
  'test-final-1': 'test-primary-1',
  'test-final-2': 'test-primary-2',
  'test-final-3': 'test-primary-3',
  'final': 'primary',
};

export const FINALISTS_COUNT = 4;

// Maps a round to its paired group (primary+final share registrations)
export function getRoundGroup(round: Round): string {
  if (round === 'test-primary-1' || round === 'test-final-1') return 'test-1';
  if (round === 'test-primary-2' || round === 'test-final-2') return 'test-2';
  if (round === 'test-primary-3' || round === 'test-final-3') return 'test-3';
  return 'official';
}

export interface JudgingCategory {
  id: string;
  name: string;
  maxScore: number;
  description: string;
}

export const JUDGING_CATEGORIES: JudgingCategory[] = [
  { id: 'problem', name: 'Problem Definition & Idea', maxScore: 20, description: 'Clear target user, specific and realistic use case, well-defined problem.' },
  { id: 'system-prompt', name: 'System Prompt Design', maxScore: 15, description: 'Clear role definition, explicit grounding instructions, clear connector usage instructions, guardrails included.' },
  { id: 'knowledge', name: 'Knowledge Integration', maxScore: 15, description: 'Agent clearly references the knowledge source, responses are grounded and relevant, no obvious fabrication.' },
  { id: 'connector', name: 'Technical Execution (Connector)', maxScore: 25, description: 'Correct connector selected, properly configured, successfully executes during demo, action meaningfully tied to the use case.' },
  { id: 'creativity', name: 'Creativity & Innovation', maxScore: 10, description: 'Thoughtful design, creative application of connectors and knowledge, differentiated solution.' },
  { id: 'demo', name: 'Demo & Communication', maxScore: 15, description: 'Clear explanation, confident walkthrough, professional presentation.' },
];

export const MAX_TOTAL_SCORE = JUDGING_CATEGORIES.reduce((sum, c) => sum + c.maxScore, 0);

export interface CategoryScore {
  categoryId: string;
  score: number;
  comment: string;
}

export interface ScoreEntry {
  id: string;
  judgeName: string;
  judgeEmail: string;
  teamNumber: number;
  round: Round;
  categoryScores: CategoryScore[];
  totalScore: number;
  timestamp: string;
}

export interface Judge {
  name: string;
  email: string;
}

export interface AppConfig {
  numberOfTeams: number;
  lockedRounds: Round[];
  activeRound: Round;
  competitionDayMode: boolean;
}

export interface TeamRanking {
  teamNumber: number;
  averageScore: number;
  numberOfJudges: number;
  totalScoreSum: number;
  highestSingleScore: number;
}

export interface Team {
  id: string;
  teamNumber: number;
  teamName: string;
  projectName: string;
  description: string;
  members: string[];
  photoUrl: string;
  submittedAt: string;
  roundGroup: string;
}
