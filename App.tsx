import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './components/Button';
import { FrameCard } from './components/FrameCard';
import { analyzeFrameWithGemini } from './services/geminiService';
import { VideoFrame, FrameQuality, ShotType, FilterState, ProcessingStats } from './types';
import { createRoot } from 'react-dom/client';

const MAX_FRAMES_TO_EXTRACT = 12; // Limit for demo purposes to avoid hitting API rate limits instantly
const FRAME_SAMPLE_INTERVAL = 2; // Extract a frame every X seconds

export default function App() {
  // State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  
  const [filters, setFilters] = useState<FilterState>({
    minQuality: 'All',
    showPeopleOnly: false,
    shotType: 'All',
  });

  // Refs for video processing
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stats calculation
  const stats: ProcessingStats = {
    totalFrames: frames.length,
    analyzedFrames: frames.filter(f => f.analysis !== null).length,
    keepers: frames.filter(f => f.isSelected).length
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setFrames([]); // Reset frames
    }
  };

  // Extract Frames Logic
  const startExtraction = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsExtracting(true);
    setExtractionProgress(0);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Wait for metadata
    if (video.readyState < 2) {
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });
    }

    const duration = video.duration;
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    // Set canvas size (downscale slightly for AI performance if 4k)
    const MAX_WIDTH = 1280;
    const scale = Math.min(1, MAX_WIDTH / width);
    canvas.width = width * scale;
    canvas.height = height * scale;

    const extractedFrames: VideoFrame[] = [];
    let currentTime = 0;
    
    // Extraction Loop
    while (currentTime < duration && extractedFrames.length < MAX_FRAMES_TO_EXTRACT) {
      // Seek
      video.currentTime = currentTime;
      await new Promise(r => video.onseeked = r);

      // Draw
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Export to base64
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      const newFrame: VideoFrame = {
        id: crypto.randomUUID(),
        timestamp: currentTime,
        imageUrl,
        analysis: null,
        isSelected: false,
        isProcessing: true,
      };

      extractedFrames.push(newFrame);
      setFrames(prev => [...prev, newFrame]);
      
      // Trigger AI Analysis for this frame immediately
      processFrameAI(newFrame);

      currentTime += FRAME_SAMPLE_INTERVAL;
      setExtractionProgress(Math.min(100, (currentTime / duration) * 100));
    }

    setIsExtracting(false);
  };

  // AI Processing Logic
  const processFrameAI = async (frame: VideoFrame) => {
    try {
      const result = await analyzeFrameWithGemini(frame.imageUrl);
      
      setFrames(currentFrames => currentFrames.map(f => {
        if (f.id === frame.id) {
          // Auto-select if Excellent
          const shouldAutoSelect = result.quality === FrameQuality.EXCELLENT;
          return { ...f, analysis: result, isProcessing: false, isSelected: shouldAutoSelect };
        }
        return f;
      }));
    } catch (e) {
      console.error("Frame processing failed", e);
      setFrames(currentFrames => currentFrames.map(f => 
        f.id === frame.id ? { ...f, isProcessing: false } : f
      ));
    }
  };

  // Toggle Selection
  const toggleFrameSelection = (id: string) => {
    setFrames(current => current.map(f => 
      f.id === id ? { ...f, isSelected: !f.isSelected } : f
    ));
  };

  // Filtering Logic
  const filteredFrames = frames.filter(frame => {
    if (!frame.analysis && isExtracting) return true; // Show all while extracting
    if (!frame.analysis) return false;

    // Quality Filter
    if (filters.minQuality !== 'All') {
      const qualityOrder = { [FrameQuality.FAIR]: 1, [FrameQuality.GOOD]: 2, [FrameQuality.EXCELLENT]: 3, [FrameQuality.PENDING]: 0 };
      const minVal = qualityOrder[filters.minQuality];
      const frameVal = qualityOrder[frame.analysis.quality];
      if (frameVal < minVal) return false;
    }

    // People Filter
    if (filters.showPeopleOnly && frame.analysis.people.length === 0) return false;

    // Type Filter
    if (filters.shotType !== 'All' && frame.analysis.shotType !== filters.shotType) return false;

    return true;
  });

  // Export Logic (Mock)
  const handleExport = () => {
    const selectedCount = stats.keepers;
    if (selectedCount === 0) return;
    alert(`Exporting ${selectedCount} high-resolution frames to your library...`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col">
      {/* Hidden Video Processor */}
      <video ref={videoRef} src={videoUrl || ""} className="hidden" crossOrigin="anonymous" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              FramePerfect AI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {videoUrl && (
               <div className="text-sm text-gray-400">
                  <span className="text-white font-medium">{stats.analyzedFrames}</span> analyzed 
                  <span className="mx-2">•</span>
                  <span className="text-blue-400 font-medium">{stats.keepers}</span> keepers
               </div>
             )}
             <Button 
                variant="primary" 
                size="sm" 
                disabled={stats.keepers === 0}
                onClick={handleExport}
              >
                Export Selected
             </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload State */}
        {!videoUrl && (
          <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload a Video</h2>
            <p className="text-gray-400 mb-8 max-w-md text-center">
              Drag and drop your footage here, or click to browse. We'll analyze it to find the perfect shots.
            </p>
            <div className="relative">
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button size="lg">Select Video File</Button>
            </div>
          </div>
        )}

        {/* Work Area */}
        {videoUrl && (
          <div className="space-y-8">
            
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800">
               <div className="flex items-center gap-4 w-full md:w-auto">
                 {frames.length === 0 || isExtracting ? (
                    <div className="flex items-center gap-3 w-full">
                       <Button onClick={startExtraction} disabled={isExtracting} className="whitespace-nowrap">
                         {isExtracting ? 'Extracting...' : 'Start Extraction'}
                       </Button>
                       {isExtracting && (
                         <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden max-w-[200px]">
                           <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${extractionProgress}%` }}></div>
                         </div>
                       )}
                    </div>
                 ) : (
                   <Button variant="secondary" onClick={() => { setFrames([]); setVideoUrl(null); }}>
                     Upload New Video
                   </Button>
                 )}
               </div>

               {/* Filters */}
               <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mr-2">Filter By:</span>
                  
                  <select 
                    className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.minQuality}
                    onChange={(e) => setFilters(prev => ({ ...prev, minQuality: e.target.value as any }))}
                  >
                    <option value="All">Any Quality</option>
                    <option value={FrameQuality.GOOD}>Good+</option>
                    <option value={FrameQuality.EXCELLENT}>Excellent Only</option>
                  </select>

                  <select 
                    className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.shotType}
                    onChange={(e) => setFilters(prev => ({ ...prev, shotType: e.target.value as any }))}
                  >
                    <option value="All">All Types</option>
                    <option value={ShotType.CANDID}>Candids</option>
                    <option value={ShotType.POSE}>Poses</option>
                  </select>

                  <button 
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${filters.showPeopleOnly ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                    onClick={() => setFilters(prev => ({ ...prev, showPeopleOnly: !prev.showPeopleOnly }))}
                  >
                    People Only
                  </button>
               </div>
            </div>

            {/* Gallery Grid */}
            {frames.length > 0 ? (
               <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredFrames.map(frame => (
                      <FrameCard 
                        key={frame.id} 
                        frame={frame} 
                        onToggleSelect={toggleFrameSelection} 
                      />
                    ))}
                  </div>
                  {filteredFrames.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                      No frames match your filters.
                    </div>
                  )}
               </div>
            ) : (
              !isExtracting && (
                <div className="text-center py-20 bg-gray-900/20 rounded-xl border border-dashed border-gray-800">
                   <p className="text-gray-500">Click "Start Extraction" to analyze your video.</p>
                </div>
              )
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}
