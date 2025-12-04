export interface BingoImage {
  id: string;
  url: string | null;
  caption?: string; 
  
  // Version Control
  history: string[]; // Array of base64 strings or URLs
  historyIndex: number; // Current position in history
  
  originalUrl?: string | null; // Keep reference to the very first upload
  prompt?: string;
  isLoading?: boolean;
}

export interface AppTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export const DEFAULT_THEME: AppTheme = {
  primary: '#3b82f6', // blue-500
  secondary: '#1e40af', // blue-800
  accent: '#fbbf24', // amber-400
  background: '#f3f4f6', // gray-100
};
