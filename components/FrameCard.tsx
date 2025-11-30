import React from 'react';
import { VideoFrame, FrameQuality, ShotType } from '../types';

interface FrameCardProps {
  frame: VideoFrame;
  onToggleSelect: (id: string) => void;
  onClick: (frame: VideoFrame) => void;
  onEnhanceClick: (frame: VideoFrame, e: React.MouseEvent) => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({ frame, onToggleSelect, onClick, onEnhanceClick }) => {
  const { analysis, isProcessing, isSelected, imageUrl, enhancedUrl, isEnhancing } = frame;
  const displayImage = enhancedUrl || imageUrl;

  const qualityColor = (q?: FrameQuality) => {
    switch (q) {
      case FrameQuality.EXCELLENT: return 'bg-emerald-500 text-white';
      case FrameQuality.GOOD: return 'bg-blue-500 text-white';
      case FrameQuality.FAIR: return 'bg-yellow-500 text-black';
      default: return 'bg-gray-600 text-gray-300';
    }
  };

  return (
    <div 
      className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? 'ring-4 ring-blue-500' : 'hover:shadow-2xl hover:scale-[1.02]'}`}
      onClick={() => onClick(frame)}
    >
      {/* Image Layer */}
      <div className="aspect-[4/3] bg-gray-900 relative">
        <img 
          src={displayImage} 
          alt={`Frame at ${frame.timestamp}`} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${isProcessing || isEnhancing ? 'opacity-50 grayscale' : 'opacity-100'}`} 
          loading="lazy"
        />
        
        {enhancedUrl && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg z-10">
            ✨ ENHANCED
          </div>
        )}

        {/* TOP LEFT OVERLAYS (Tags) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
            {analysis?.quality && (
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm ${qualityColor(analysis.quality)}`}>
                    {analysis.quality}
                </span>
            )}
            {analysis?.tags && analysis.tags.slice(0, 1).map((tag, i) => (
                 <span key={i} className="bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded shadow-sm border border-white/10 uppercase">
                    {tag}
                 </span>
            ))}
            {analysis?.shotType && analysis.shotType !== ShotType.UNKNOWN && (
                 <span className="bg-gray-900/80 backdrop-blur-md text-gray-300 text-[10px] font-medium px-2 py-1 rounded shadow-sm border border-white/10 uppercase">
                    {analysis.shotType}
                 </span>
            )}
        </div>

        {/* CENTER OVERLAY BUTTON (AI Restore) */}
        {/* Visible on hover or if frame is analyzed but not enhanced yet */}
        {!isProcessing && !isEnhancing && analysis && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                <button 
                    onClick={(e) => onEnhanceClick(frame, e)}
                    className="bg-white text-indigo-900 font-bold text-xs px-4 py-2 rounded-full shadow-xl hover:bg-indigo-50 transform hover:scale-105 transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI RESTORE
                </button>
            </div>
        )}

        {/* Processing Spinner Overlay */}
        {(isProcessing || isEnhancing) && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 backdrop-blur-sm">
             <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Bottom Info Gradient */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 flex justify-between items-end">
             <div className="text-white">
                <div className="text-[10px] font-mono opacity-60">{frame.timestamp.toFixed(2)}s</div>
                <div className="text-xs font-medium truncate max-w-[120px]">
                    {analysis?.people && analysis.people.length > 0 ? analysis.people.join(", ") : "Unknown"}
                </div>
             </div>
             
             {/* Selection Circle */}
             <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/50 hover:border-white'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(frame.id);
                }}
              >
                 {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};