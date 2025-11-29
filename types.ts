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

export interface AIAnalysis {
  quality: FrameQuality;
  qualityReason: string;
  people: string[]; // List of perceived names or descriptors e.g., "Person A", "Child"
  shotType: ShotType;
  tags: string[];
}

export interface VideoFrame {
  id: string;
  timestamp: number;
  imageUrl: string; // Base64 data URL
  analysis: AIAnalysis | null;
  isSelected: boolean;
  isProcessing: boolean;
}

export interface FilterState {
  minQuality: FrameQuality | 'All';
  showPeopleOnly: boolean;
  shotType: ShotType | 'All';
}

export interface ProcessingStats {
  totalFrames: number;
  analyzedFrames: number;
  keepers: number;
}
