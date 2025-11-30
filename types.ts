export enum FrameQuality {
  FAIR = 'Fair',
  GOOD = 'Good',
  EXCELLENT = 'Excellent',
  PENDING = 'Pending'
}

export enum ShotType {
  POSE = 'Pose',
  CANDID = 'Candid',
  UNKNOWN = 'Unknown'
}

export enum EnhancementType {
  RESTORE = 'Restore (Standard)',
  UNBLUR = 'Unblur & Sharpen',
  REMOVE_BG = 'Remove Background',
  CINEMATIC = 'Cinematic Lighting',
  BOKEH = 'Portrait Bokeh'
}

export interface AIAnalysis {
  quality: FrameQuality;
  qualityReason: string;
  people: string[]; // List of perceived names or descriptors e.g., "Person A", "Child"
  shotType: ShotType;
  tags: string[];
  compositionScore: number; // 1-10
  technicalAdvice: string; // e.g., "Slightly underexposed, fix contrast"
  subjectId?: string; // e.g., "Person_Blue_Shirt" for clustering
}

export interface VideoFrame {
  id: string;
  timestamp: number;
  imageUrl: string; // Base64 data URL
  analysis: AIAnalysis | null;
  isSelected: boolean;
  isProcessing: boolean;
  enhancedUrl?: string; // URL of the AI enhanced version
  isEnhancing?: boolean;
}

export interface FilterState {
  minQuality: FrameQuality | 'All';
  shotType: ShotType | 'All';
  activeTags: string[]; // List of currently selected smart tags
}

export interface ProcessingStats {
  totalFrames: number;
  analyzedFrames: number;
  keepers: number;
}

export interface ScanSettings {
  range: 'full' | 'first_half' | 'second_half' | 'q1' | 'q2' | 'q3' | 'q4';
  interval: number; // seconds
}