export interface User {
  id: string;
  name: string;
  email: string;
  cycleLength: number; // default e.g. 28 days
  periodLength: number; // default e.g. 5 days
  notificationSettings: {
    periodReminder: boolean;
    fertileReminder: boolean;
    dailyTips: boolean;
  };
}

export type FlowIntensity = 'Light' | 'Medium' | 'Heavy' | 'Very Heavy';

export interface CycleRecord {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD (optional)
  flowIntensity: FlowIntensity;
  symptoms: string[];
  mood: string;
  notes?: string;
  createdAt: string;
}

export interface Prediction {
  id: string;
  userId: string;
  predictedStart: string; // YYYY-MM-DD
  predictedEnd: string;   // YYYY-MM-DD
  ovulationDate: string;  // YYYY-MM-DD
  fertileStart: string;   // YYYY-MM-DD
  fertileEnd: string;     // YYYY-MM-DD
}

export interface Article {
  id: string;
  title: string;
  category: 'Education' | 'Nutrition' | 'Fitness' | 'Mind';
  content: string;
  readTime: string;
  imageUrl: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  articleId: string;
}

export type ThemeType = 'blossom' | 'monochrome' | 'stealth';
