import React from 'react';
import { EnhancementType, VideoFrame } from '../types';

interface EnhanceOptionsModalProps {
  frame?: VideoFrame; // Optional for batch mode
  onSelect: (type: EnhancementType) => void;
  onClose: () => void;
}

const ENHANCEMENT_OPTIONS = [
  {
    type: EnhancementType.RESTORE,
    label: 'Standard Restore',
    description: 'Balanced enhancement for general quality.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    type: EnhancementType.UNBLUR,
    label: 'Unblur & Sharpen',
    description: 'Fix motion blur and focus issues.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  {
    type: EnhancementType.REMOVE_BG,
    label: 'Remove Background',
    description: 'Isolate the subject on a clean background.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    type: EnhancementType.CINEMATIC,
    label: 'Cinematic Lighting',
    description: 'Dramatic color grading and contrast.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    )
  },
  {
    type: EnhancementType.BOKEH,
    label: 'Portrait Bokeh',
    description: 'Blur background to emphasize subject.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export const EnhanceOptionsModal: React.FC<EnhanceOptionsModalProps> = ({ frame, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl transform scale-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
             <h3 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
               {frame ? 'Magical Enhancements' : 'Batch Enhancement'}
             </h3>
             <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            {frame 
              ? 'Select an AI model effect to apply to this frame. The original will be preserved.' 
              : 'Select an AI model effect to apply to all selected frames. This may take a moment.'}
        </p>

        <div className="space-y-3">
            {ENHANCEMENT_OPTIONS.map((option) => (
                <button
                    key={option.type}
                    onClick={() => onSelect(option.type)}
                    className="w-full text-left p-4 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500/50 transition-all flex items-center gap-4 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-lg shrink-0">
                      {option.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-bold text-gray-200 group-hover:text-white">{option.label}</div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-400">{option.description}</div>
                    </div>

                    <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};