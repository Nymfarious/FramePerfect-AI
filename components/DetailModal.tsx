import React, { useEffect } from 'react';
import { VideoFrame, FrameQuality } from '../types';
import { Button } from './Button';

interface DetailModalProps {
  frame: VideoFrame;
  onClose: () => void;
  onEnhance: (frame: VideoFrame) => void;
  onToggleSelect: (id: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ frame, onClose, onEnhance, onToggleSelect, onNext, onPrev }) => {
  const { analysis, imageUrl, enhancedUrl, isEnhancing, isSelected } = frame;
  const displayImage = enhancedUrl || imageUrl;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  // Parse advice into bullets
  const advicePoints = analysis?.technicalAdvice 
    ? analysis.technicalAdvice.split('.').map(s => s.trim()).filter(s => s.length > 0)
    : ["No specific advice available."];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gray-900 w-full max-w-7xl h-[90vh] rounded-2xl border border-gray-700 overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
        
        {/* Navigation Overlays */}
        {onPrev && (
            <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all hidden md:block">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
        )}
        {onNext && (
            <button onClick={onNext} className="absolute right-4 md:right-[416px] top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all hidden md:block">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        )}

        {/* Left: Image Area (Handles Side-by-Side) */}
        <div className="flex-1 bg-black relative flex items-center justify-center p-4 overflow-hidden">
          {enhancedUrl ? (
             // Side by Side Mode
             <div className="flex gap-4 w-full h-full items-center justify-center">
                 {/* Original */}
                 <div className="relative flex-1 h-full flex items-center justify-center group/orig">
                    <img 
                      src={imageUrl} 
                      alt="Original" 
                      className="max-h-full max-w-full object-contain opacity-80 group-hover/orig:opacity-100 transition-opacity" 
                    />
                    <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full border border-white/20">Original</div>
                 </div>
                 
                 {/* Divider */}
                 <div className="w-px h-1/2 bg-gray-700 hidden md:block"></div>

                 {/* Enhanced */}
                 <div className="relative flex-1 h-full flex items-center justify-center group/enh">
                    <img 
                      src={enhancedUrl} 
                      alt="Enhanced" 
                      className="max-h-full max-w-full object-contain shadow-[0_0_30px_rgba(168,85,247,0.2)]" 
                    />
                     <div className="absolute top-4 left-4 bg-purple-600/90 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-lg">
                       ✨ Enhanced
                     </div>
                 </div>
             </div>
          ) : (
             // Single Image Mode
             <img 
               src={imageUrl} 
               alt="Detail view" 
               className="max-h-full max-w-full object-contain shadow-2xl" 
             />
          )}

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-gray-800 text-white rounded-full transition-colors z-30"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Right: Sidebar Analysis */}
        <div className="w-full md:w-[400px] bg-gray-900 border-l border-gray-800 p-6 flex flex-col overflow-y-auto shrink-0 z-30 shadow-2xl">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Image Enhancer</h2>
            <div className={`px-3 py-1 rounded text-sm font-bold border ${
                analysis?.quality === FrameQuality.EXCELLENT ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 
                analysis?.quality === FrameQuality.GOOD ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 
                'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
            }`}>
              {analysis?.quality || 'Analyzing...'}
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Composition</div>
              <div className="text-2xl font-mono font-bold text-white">{analysis?.compositionScore || '-'}<span className="text-gray-500 text-sm">/10</span></div>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
               <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Time</div>
               <div className="text-2xl font-mono font-bold text-white">{frame.timestamp.toFixed(2)}<span className="text-gray-500 text-sm">s</span></div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-6 mb-8 flex-1">
             <div>
               <h3 className="text-sm font-bold text-gray-200 mb-2">Curator's Notes</h3>
               <p className="text-gray-400 text-sm leading-relaxed">{analysis?.qualityReason}</p>
             </div>

             <div>
               <h3 className="text-sm font-bold text-gray-200 mb-2">Technical Advice</h3>
               <div className="bg-blue-900/10 border border-blue-900/50 rounded-lg p-4">
                 <ul className="space-y-2">
                    {advicePoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-200">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                            {point}
                        </li>
                    ))}
                 </ul>
               </div>
             </div>

             <div>
               <h3 className="text-sm font-bold text-gray-200 mb-2">Detected Concepts</h3>
               <div className="flex flex-wrap gap-2">
                 {analysis?.tags?.map((tag, i) => (
                   <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-700">
                     #{tag}
                   </span>
                 ))}
                 {analysis?.people?.map((p, i) => (
                    <span key={`p-${i}`} className="px-2 py-1 bg-gray-700 rounded text-xs text-white border border-gray-600">
                      @{p}
                    </span>
                 ))}
               </div>
             </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 mt-auto pt-6 border-t border-gray-800">
             {!enhancedUrl ? (
                <Button 
                  variant="primary" 
                  className="w-full justify-between group" 
                  onClick={() => onEnhance(frame)}
                  isLoading={isEnhancing}
                  disabled={isEnhancing}
                >
                  <span>✨ Magical Enhancements</span>
                  {!isEnhancing && <span className="opacity-60 text-xs font-normal">AI Re-imagining</span>}
                </Button>
             ) : (
                <div className="text-center p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm mb-2">
                  Image Enhanced successfully!
                </div>
             )}

             <Button 
               variant={isSelected ? 'danger' : 'secondary'} 
               className="w-full"
               onClick={() => onToggleSelect(frame.id)}
             >
               {isSelected ? 'Remove from Selection' : 'Select as Keeper'}
             </Button>

             <div className="flex justify-between items-center text-xs text-gray-500 pt-2 font-mono">
                <span>Navigate: Arrow Keys</span>
                <span>Close: ESC</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};