import React, { useEffect, useState } from 'react';
import { VideoFrame, FrameQuality, EnhancementType } from '../types';
import { Button } from './Button';

interface DetailModalProps {
  frame: VideoFrame;
  onClose: () => void;
  onEnhance: (frame: VideoFrame, selectedAdvice: string, style: EnhancementType) => void;
  onSaveVersion?: (frame: VideoFrame) => void;
  onToggleSelect: (id: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const STYLE_OPTIONS = [
  { type: EnhancementType.RESTORE, label: 'Standard' },
  { type: EnhancementType.UNBLUR, label: 'Unblur' },
  { type: EnhancementType.CINEMATIC, label: 'Cinematic' },
  { type: EnhancementType.BOKEH, label: 'Bokeh' },
  { type: EnhancementType.REMOVE_BG, label: 'Remove BG' },
];

export const DetailModal: React.FC<DetailModalProps> = ({ frame, onClose, onEnhance, onSaveVersion, onToggleSelect, onNext, onPrev }) => {
  const { analysis, imageUrl, enhancedUrl, isEnhancing, isSelected, appliedEnhancements } = frame;
  
  const adviceList = analysis?.technicalAdvice 
    ? analysis.technicalAdvice.split('.').map(s => s.trim()).filter(s => s.length > 0)
    : [];

  const [selectedAdvice, setSelectedAdvice] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<EnhancementType>(EnhancementType.RESTORE);

  useEffect(() => {
    if (adviceList.length > 0 && selectedAdvice.length === 0) {
      setSelectedAdvice(adviceList.slice(0, 3)); 
    }
  }, [analysis]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  const toggleAdvice = (item: string) => {
    setSelectedAdvice(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleApplyEnhance = () => {
    const combinedAdvice = selectedAdvice.join('. ');
    onEnhance(frame, combinedAdvice, selectedStyle);
  };

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

        {/* Left: Image Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center p-4 overflow-hidden min-h-0 min-w-0">
          {enhancedUrl ? (
             // Side by Side Mode
             <div className="flex gap-4 w-full h-full items-center justify-center">
                 {/* Original */}
                 <div className="relative flex-1 h-full flex items-center justify-center group/orig min-w-0 min-h-0">
                    <img 
                      src={imageUrl} 
                      alt="Original" 
                      className="max-h-full max-w-full object-contain opacity-80 group-hover/orig:opacity-100 transition-opacity" 
                    />
                    <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 z-10">Original</div>
                 </div>
                 
                 {/* Divider */}
                 <div className="w-px h-1/2 bg-gray-700 hidden md:block shrink-0"></div>

                 {/* Enhanced */}
                 <div className="relative flex-1 h-full flex items-center justify-center group/enh min-w-0 min-h-0">
                    <img 
                      src={enhancedUrl} 
                      alt="Enhanced" 
                      className="max-h-full max-w-full object-contain shadow-[0_0_30px_rgba(168,85,247,0.2)]" 
                    />
                     <div className="absolute top-4 left-4 bg-purple-600/90 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-lg z-10">
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
          
          <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Composition</div>
              <div className="text-xl font-mono font-bold text-white">{analysis?.compositionScore || '-'}<span className="text-gray-500 text-sm">/10</span></div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
               <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Time</div>
               <div className="text-xl font-mono font-bold text-white">{frame.timestamp.toFixed(2)}<span className="text-gray-500 text-sm">s</span></div>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
             {/* 1. Checklist */}
             <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center justify-between">
                 <span>Select Improvements to Apply</span>
                 <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">{selectedAdvice.length} selected</span>
               </h3>
               <div className="bg-black/20 rounded-xl p-2 border border-gray-800 space-y-1">
                 {adviceList.map((point, i) => (
                    <label key={i} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ${selectedAdvice.includes(point) ? 'bg-blue-900/20 border border-blue-800/50' : 'hover:bg-gray-800 border border-transparent'}`}>
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                          checked={selectedAdvice.includes(point)}
                          onChange={() => toggleAdvice(point)}
                        />
                        <span className={`text-sm leading-snug ${selectedAdvice.includes(point) ? 'text-blue-200' : 'text-gray-400'}`}>
                           {point}
                        </span>
                    </label>
                 ))}
               </div>
             </div>

             {/* 2. Style Chips */}
             <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Creative Style</h3>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => setSelectedStyle(opt.type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedStyle === opt.type 
                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/40' 
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
             </div>

             {/* History */}
             {appliedEnhancements && appliedEnhancements.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Applied Enhancements</h3>
                  <div className="flex flex-col gap-1">
                    {appliedEnhancements.map((e, i) => (
                      <div key={i} className="text-xs text-green-400 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
             )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-6 border-t border-gray-800 space-y-4 bg-gray-900 z-10">
             <Button 
                variant="primary" 
                className="w-full justify-between group py-3 shadow-lg shadow-blue-900/20" 
                onClick={handleApplyEnhance}
                isLoading={isEnhancing}
                disabled={isEnhancing || selectedAdvice.length === 0}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Magical Enhancements
                </span>
                {!isEnhancing && <span className="text-xs font-normal opacity-70 border-l border-white/20 pl-3">Apply {selectedAdvice.length} fixes</span>}
              </Button>

              <div className="flex items-center justify-between gap-4">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-green-500 border-green-500' : 'bg-gray-800 border-gray-600 group-hover:border-gray-500'}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>Keep this frame</span>
                    <input type="checkbox" className="hidden" checked={isSelected} onChange={() => onToggleSelect(frame.id)} />
                 </label>

                 <div className="flex gap-2">
                   {enhancedUrl && onSaveVersion && (
                      <Button variant="secondary" size="sm" onClick={() => onSaveVersion(frame)} className="px-4">
                        Save Copy
                      </Button>
                   )}
                   <Button variant="secondary" size="sm" onClick={onClose} className="px-6">
                     {enhancedUrl ? "Done" : "Close"}
                   </Button>
                 </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};