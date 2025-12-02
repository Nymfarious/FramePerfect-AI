import React from 'react';

interface PipelineStatusProps {
  isExtracting: boolean;
  extractionProgress: number;
  analyzedCount: number;
  totalFrames: number;
  isProcessing: boolean;
}

export const PipelineStatus: React.FC<PipelineStatusProps> = ({ 
  isExtracting, 
  extractionProgress, 
  analyzedCount, 
  totalFrames,
  isProcessing
}) => {
  const isAnalysisComplete = totalFrames > 0 && analyzedCount === totalFrames && !isExtracting;
  const isClustering = isAnalysisComplete && !isProcessing; // Simple simulation logic

  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl mb-8 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
        Pipeline Active
      </h3>
      
      <div className="space-y-4">
        {/* Step 1: Sampler */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExtracting ? 'bg-blue-900/50 text-blue-400' : 'bg-emerald-900/30 text-emerald-500'}`}>
              {isExtracting ? (
                 <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              ) : (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <div>
              <div className={`text-sm font-bold ${isExtracting ? 'text-blue-400' : 'text-gray-300'}`}>Frame Sampler Agent</div>
              <div className="text-xs text-gray-500">
                {isExtracting 
                  ? `Scanning video stream... ${Math.round(extractionProgress)}%` 
                  : `Extracted ${totalFrames} candidates`
                }
              </div>
            </div>
          </div>
          {isExtracting && (
             <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${extractionProgress}%` }}></div>
             </div>
          )}
        </div>

        {/* Step 2: Analyzer */}
        <div className={`flex items-center justify-between transition-opacity duration-500 ${totalFrames === 0 ? 'opacity-30' : 'opacity-100'}`}>
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${!isAnalysisComplete ? 'bg-purple-900/50 text-purple-400' : 'bg-emerald-900/30 text-emerald-500'}`}>
                {!isAnalysisComplete && totalFrames > 0 ? (
                   <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : isAnalysisComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                )}
             </div>
             <div>
               <div className={`text-sm font-bold ${!isAnalysisComplete && totalFrames > 0 ? 'text-purple-400' : 'text-gray-300'}`}>Vision Analyzer Agent</div>
               <div className="text-xs text-gray-500">
                  {isAnalysisComplete 
                    ? 'Analysis complete' 
                    : `Analyzing frames... ${analyzedCount}/${totalFrames}`
                  }
               </div>
             </div>
          </div>
        </div>

        {/* Step 3: Clusterer */}
        <div className={`flex items-center justify-between transition-opacity duration-500 ${!isAnalysisComplete ? 'opacity-30' : 'opacity-100'}`}>
           <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isAnalysisComplete ? 'bg-indigo-900/50 text-indigo-400' : 'bg-gray-800 text-gray-600'}`}>
                 {isAnalysisComplete ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                 ) : (
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                 )}
              </div>
              <div>
                <div className={`text-sm font-bold ${isAnalysisComplete ? 'text-indigo-400' : 'text-gray-300'}`}>Clustering Agent</div>
                <div className="text-xs text-gray-500">
                   {isAnalysisComplete ? 'Updating smart tags & groups...' : 'Pending analysis...'}
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
