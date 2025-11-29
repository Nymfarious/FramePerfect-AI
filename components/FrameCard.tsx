import React from 'react';
import { VideoFrame, FrameQuality, ShotType } from '../types';

interface FrameCardProps {
  frame: VideoFrame;
  onToggleSelect: (id: string) => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({ frame, onToggleSelect }) => {
  const { analysis, isProcessing, isSelected, imageUrl } = frame;

  const qualityColor = (q?: FrameQuality) => {
    switch (q) {
      case FrameQuality.EXCELLENT: return 'bg-emerald-500 text-emerald-950 border-emerald-400';
      case FrameQuality.GOOD: return 'bg-blue-500 text-blue-950 border-blue-400';
      case FrameQuality.FAIR: return 'bg-yellow-500 text-yellow-950 border-yellow-400';
      default: return 'bg-gray-600 text-gray-300 border-gray-500';
    }
  };

  return (
    <div 
      className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-800 hover:border-gray-600'}`}
      onClick={() => onToggleSelect(frame.id)}
    >
      {/* Image Layer */}
      <div className="aspect-[4/3] bg-gray-900 relative">
        <img 
          src={imageUrl} 
          alt={`Frame at ${frame.timestamp}`} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${isProcessing ? 'opacity-50 grayscale' : 'opacity-100'}`} 
          loading="lazy"
        />
        
        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Selection Checkbox */}
        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-black/40 border-white/60 group-hover:border-white'}`}>
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Time Stamp */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-mono">
          {frame.timestamp.toFixed(2)}s
        </div>
      </div>

      {/* Info Layer */}
      <div className="p-3 bg-gray-800">
        <div className="flex justify-between items-start mb-2">
            {/* Quality Badge */}
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${qualityColor(analysis?.quality)}`}>
              {analysis?.quality || 'Analyzing...'}
            </span>
            
            {/* Type Badge */}
            {analysis?.shotType && analysis.shotType !== ShotType.UNKNOWN && (
               <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                 {analysis.shotType}
               </span>
            )}
        </div>

        {/* Details */}
        <div className="space-y-1">
          <p className="text-xs text-gray-300 line-clamp-1">
            {analysis?.qualityReason || "Waiting for AI..."}
          </p>
          
          {/* People/Tags */}
          {analysis && (
            <div className="flex flex-wrap gap-1 mt-2">
              {analysis.people.slice(0, 2).map((p, i) => (
                <span key={i} className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                  {p}
                </span>
              ))}
              {analysis.tags.slice(0, 2).map((t, i) => (
                <span key={i} className="text-[10px] bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
