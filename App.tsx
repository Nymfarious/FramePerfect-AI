import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from './components/Button';
import { FrameCard } from './components/FrameCard';
import { DetailModal } from './components/DetailModal';
import { EnhanceOptionsModal } from './components/EnhanceOptionsModal';
import { PipelineStatus } from './components/PipelineStatus';
import { analyzeFrameWithGemini, enhanceFrameWithGemini } from './services/geminiService';
import { exportProjectToZip } from './services/exportService';
import { saveProject, loadProject, clearProject } from './services/storageService';
import { VideoFrame, FrameQuality, FilterState, ProcessingStats, ShotType, ScanSettings, EnhancementType } from './types';

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [projectName, setProjectName] = useState('My Project');
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [isBatchEnhancing, setIsBatchEnhancing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // UI States
  const [showFilters, setShowFilters] = useState(false);
  const [libraryView, setLibraryView] = useState<'all' | 'library'>('all'); // Main view toggle
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'enhanced' | 'original'>('all'); // Sub-filter for library

  const [scanSettings, setScanSettings] = useState<ScanSettings>({
    range: 'full',
    interval: 3,
  });

  const [filters, setFilters] = useState<FilterState>({
    minQuality: 'All',
    shotType: 'All',
    activeTags: [],
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load from IndexedDB on mount
  useEffect(() => {
    const initLoad = async () => {
      try {
        const loadedFrames = await loadProject();
        if (loadedFrames && loadedFrames.length > 0) {
           const sanitizedFrames = loadedFrames.map((f: any) => ({
            ...f,
            analysis: f.analysis ? {
              ...f.analysis,
              tags: f.analysis.tags || [],
              people: f.analysis.people || [],
              technicalAdvice: f.analysis.technicalAdvice || "No advice available",
              compositionScore: f.analysis.compositionScore ?? 5,
            } : null,
            appliedEnhancements: f.appliedEnhancements || []
          }));
          setFrames(sanitizedFrames);
          setVideoUrl("restored");
        }
      } catch (e) {
        console.error("Failed to load project from DB", e);
      }
    };
    initLoad();
  }, []);

  // Save to IndexedDB whenever frames change
  useEffect(() => {
    if (frames.length > 0) {
      saveProject(frames).catch(e => console.error("Failed to save to DB", e));
    }
  }, [frames]);

  const stats: ProcessingStats = {
    totalFrames: frames.length,
    analyzedFrames: frames.filter(f => f.analysis !== null).length,
    keepers: frames.filter(f => f.isSelected).length
  };

  const selectedFrames = useMemo(() => frames.filter(f => f.isSelected), [frames]);

  const smartChips = useMemo(() => {
    const allTags = new Set<string>();
    frames.forEach(f => {
      (f.analysis?.tags || []).forEach(t => allTags.add(t));
      if (f.analysis?.subjectId) allTags.add(f.analysis.subjectId.replace(/_/g, " "));
    });
    return Array.from(allTags).slice(0, 8);
  }, [frames]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getScanRangeLabel = () => {
    if (videoDuration === 0) return "";
    let start = 0;
    let end = videoDuration;
    let label = "Full Video";

    switch (scanSettings.range) {
        case 'first_half': end = videoDuration / 2; label = "First Half"; break;
        case 'second_half': start = videoDuration / 2; label = "Second Half"; break;
        case 'q1': end = videoDuration * 0.25; label = "Q1"; break;
        case 'q2': start = videoDuration * 0.25; end = videoDuration * 0.5; label = "Q2"; break;
        case 'q3': start = videoDuration * 0.5; end = videoDuration * 0.75; label = "Q3"; break;
        case 'q4': start = videoDuration * 0.75; label = "Q4"; break;
    }

    return `(${label}: ${formatDuration(start)} - ${formatDuration(end)})`;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setFrames([]); 
      setFilters({ minQuality: 'All', shotType: 'All', activeTags: [] });
      setVideoDuration(0);
      await clearProject();
    }
  };

  const startExtraction = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (videoUrl === 'restored') {
      alert("Please upload the video file again to extract new frames.");
      setVideoUrl(null);
      return;
    }
    
    setIsExtracting(true);
    setExtractionProgress(0);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (video.readyState < 2) {
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });
    }

    const duration = video.duration;
    
    let startTime = 0;
    let endTime = duration;
    
    switch (scanSettings.range) {
        case 'first_half': endTime = duration / 2; break;
        case 'second_half': startTime = duration / 2; break;
        case 'q1': endTime = duration * 0.25; break;
        case 'q2': startTime = duration * 0.25; endTime = duration * 0.5; break;
        case 'q3': startTime = duration * 0.5; endTime = duration * 0.75; break;
        case 'q4': startTime = duration * 0.75; break;
        default: break;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    const MAX_WIDTH = 1280;
    const scale = Math.min(1, MAX_WIDTH / width);
    canvas.width = width * scale;
    canvas.height = height * scale;

    let currentTime = startTime;
    const interval = Math.max(1, scanSettings.interval);
    
    const maxFrames = 50; 
    let count = 0;

    while (currentTime < endTime && count < maxFrames) {
      video.currentTime = currentTime;
      await new Promise(r => video.onseeked = r);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      const newFrame: VideoFrame = {
        id: crypto.randomUUID(),
        timestamp: currentTime,
        imageUrl,
        analysis: null,
        isSelected: false,
        isProcessing: true,
        appliedEnhancements: []
      };

      setFrames(prev => [...prev, newFrame]);
      processFrameAI(newFrame);

      currentTime += interval;
      count++;
      setExtractionProgress(Math.min(100, ((currentTime - startTime) / (endTime - startTime)) * 100));
    }

    setIsExtracting(false);
  };

  const processFrameAI = async (frame: VideoFrame) => {
    try {
      const result = await analyzeFrameWithGemini(frame.imageUrl);
      setFrames(currentFrames => currentFrames.map(f => {
        if (f.id === frame.id) {
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

  const handleEnhanceSelection = async (frame: VideoFrame, advice: string, type: EnhancementType | EnhancementType[]) => {
    setFrames(curr => curr.map(f => f.id === frame.id ? { ...f, isEnhancing: true } : f));

    try {
      // Handle both single and array types for backward compatibility or direct calls
      const types = Array.isArray(type) ? type : [type];
      const enhancedBase64 = await enhanceFrameWithGemini(frame.imageUrl, advice, types);

      setFrames(curr => curr.map(f => {
        if (f.id === frame.id) {
          return { 
            ...f, 
            isEnhancing: false, 
            enhancedUrl: enhancedBase64 || undefined,
            isSelected: true,
            appliedEnhancements: [...(f.appliedEnhancements || []), ...types.map(t => t.toString())], 
            analysis: f.analysis ? { ...f.analysis, quality: FrameQuality.EXCELLENT } : null
          };
        }
        return f;
      }));
    } catch (error) {
       console.error("Enhancement failed", error);
       setFrames(curr => curr.map(f => f.id === frame.id ? { ...f, isEnhancing: false } : f));
    }
  };

  const handleSaveVersion = async (frame: VideoFrame) => {
    if (!frame.enhancedUrl) return;

    // Create a new frame entry from the enhanced version
    const newFrame: VideoFrame = {
        id: crypto.randomUUID(),
        timestamp: frame.timestamp,
        imageUrl: frame.enhancedUrl, // The enhanced image becomes the base for the new frame
        analysis: frame.analysis ? { ...frame.analysis, quality: FrameQuality.EXCELLENT } : null,
        isSelected: true,
        isProcessing: false,
        isEnhancing: false,
        appliedEnhancements: frame.appliedEnhancements,
        enhancedUrl: undefined // Reset enhanced URL for the new frame so it can be enhanced again
    };

    setFrames(prev => [newFrame, ...prev]);
    // Note: We don't close the modal, allowing the user to continue editing the original if they want
    alert("Enhanced version saved to library as a new frame!");
  };

  const handleBatchEnhance = async (type: EnhancementType) => {
    setIsBatchEnhancing(false);
    
    const targetIds = selectedFrames.map(f => f.id);
    setFrames(curr => curr.map(f => targetIds.includes(f.id) ? { ...f, isEnhancing: true } : f));

    for (const frame of selectedFrames) {
        if (!frame.analysis) continue;
        try {
            const enhancedBase64 = await enhanceFrameWithGemini(frame.imageUrl, frame.analysis.technicalAdvice, [type]);
            setFrames(curr => curr.map(f => {
                if (f.id === frame.id) {
                    return { 
                        ...f, 
                        isEnhancing: false, 
                        enhancedUrl: enhancedBase64 || undefined,
                        analysis: f.analysis ? { ...f.analysis, quality: FrameQuality.EXCELLENT } : null,
                        appliedEnhancements: [...(f.appliedEnhancements || []), type],
                    };
                }
                return f;
            }));
        } catch (e) {
            setFrames(curr => curr.map(f => f.id === frame.id ? { ...f, isEnhancing: false } : f));
        }
    }
  };

  const toggleFrameSelection = (id: string) => {
    setFrames(current => current.map(f => 
      f.id === id ? { ...f, isSelected: !f.isSelected } : f
    ));
  };

  const clearSelection = () => {
    setFrames(current => current.map(f => ({ ...f, isSelected: false })));
  };

  const toggleTagFilter = (tag: string) => {
    setFilters(prev => {
      const isActive = prev.activeTags.includes(tag);
      return {
        ...prev,
        activeTags: isActive ? prev.activeTags.filter(t => t !== tag) : [...prev.activeTags, tag]
      };
    });
  };

  const handleExport = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }
    setIsExporting(true);
    try {
      await exportProjectToZip(frames, projectName);
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredFrames = frames.filter(frame => {
    // 1. Library View Filter (Keepers Only)
    if (libraryView === 'library') {
        if (!frame.isSelected) return false;
    }

    // 2. Sub-filter (Enhanced vs Original)
    if (libraryFilter === 'enhanced' && !frame.appliedEnhancements?.length) return false;
    if (libraryFilter === 'original' && frame.appliedEnhancements?.length) return false;

    // 3. Extraction / Processing Check
    if (!frame.analysis && isExtracting) return true;
    if (!frame.analysis) return false;

    // 4. Quality & Tag Filters
    if (filters.minQuality !== 'All') {
      const qualityOrder = { [FrameQuality.FAIR]: 1, [FrameQuality.GOOD]: 2, [FrameQuality.EXCELLENT]: 3, [FrameQuality.PENDING]: 0 };
      if (qualityOrder[frame.analysis.quality] < qualityOrder[filters.minQuality]) return false;
    }
    if (filters.shotType !== 'All' && frame.analysis.shotType !== filters.shotType) return false;
    if (filters.activeTags.length > 0) {
      const frameTags = [...(frame.analysis.tags || []), frame.analysis.subjectId?.replace(/_/g, " ") || ""];
      if (!filters.activeTags.some(tag => frameTags.some(ft => ft.toLowerCase().includes(tag.toLowerCase())))) return false;
    }
    return true;
  });

  const selectedFrame = frames.find(f => f.id === selectedFrameId);
  const selectedIndex = filteredFrames.findIndex(f => f.id === selectedFrameId);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col font-sans pb-20">
      <video 
        ref={videoRef} 
        src={videoUrl && videoUrl !== 'restored' ? videoUrl : ""} 
        className="hidden" 
        crossOrigin="anonymous" 
        muted 
        playsInline 
        onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Modal */}
      {selectedFrame && (
        <DetailModal 
          frame={selectedFrame} 
          onClose={() => setSelectedFrameId(null)} 
          onEnhance={handleEnhanceSelection} 
          onSaveVersion={handleSaveVersion}
          onToggleSelect={toggleFrameSelection}
          onNext={selectedIndex < filteredFrames.length - 1 ? () => setSelectedFrameId(filteredFrames[selectedIndex + 1].id) : undefined}
          onPrev={selectedIndex > 0 ? () => setSelectedFrameId(filteredFrames[selectedIndex - 1].id) : undefined}
        />
      )}

      {/* Batch Modal */}
      {isBatchEnhancing && (
        <EnhanceOptionsModal 
          onClose={() => setIsBatchEnhancing(false)}
          onSelect={handleBatchEnhance}
        />
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
               </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">FramePerfect AI</h1>
          </div>
          <div className="flex items-center gap-4">
            {videoUrl && (
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Name your project..."
                  className="bg-black/20 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 outline-none w-48 transition-all"
                />
                <Button variant="primary" size="sm" disabled={stats.keepers === 0 || isExporting} onClick={handleExport} isLoading={isExporting}>
                  {isExporting ? 'Packaging...' : 'Download Library'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* State 1: Project Setup */}
        {!videoUrl && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
               <h2 className="text-2xl font-bold text-white mb-2">Start New Project</h2>
               <p className="text-gray-400 text-sm mb-8">Import your video footage to begin.</p>
               <div className="mb-6">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Project Name</label>
                 <input 
                    type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Summer Vacation 2025"
                 />
               </div>
               <div className="relative group cursor-pointer">
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                 <div className="relative bg-gray-800 border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl p-8 flex flex-col items-center justify-center transition-all">
                    <svg className="w-10 h-10 text-gray-500 mb-3 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="text-sm font-medium text-gray-300">Click to Import Video</span>
                    <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                 </div>
               </div>
               <p className="mt-4 text-xs text-gray-500 text-center">Drag and drop supported.</p>
            </div>
          </div>
        )}

        {/* State 2: Work Area */}
        {videoUrl && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Control Bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl">
               <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  
                  {/* Left: Scan Controls */}
                  <div className="flex items-center gap-4 flex-wrap">
                      {videoUrl !== 'restored' && !isExtracting && frames.length === 0 ? (
                         <>
                           <div className="flex items-center gap-4">
                              {videoDuration > 0 && (
                                <div className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                   Duration: <span className="text-white">{formatDuration(videoDuration)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
                                <select 
                                  className="bg-transparent text-xs text-white outline-none px-2 py-1"
                                  value={scanSettings.range}
                                  onChange={e => setScanSettings({...scanSettings, range: e.target.value as any})}
                                >
                                  <option value="full">Full Video</option>
                                  <option value="first_half">First Half</option>
                                  <option value="second_half">Second Half</option>
                                  <option value="q1">Q1 (0-25%)</option>
                                  <option value="q2">Q2 (25-50%)</option>
                                  <option value="q3">Q3 (50-75%)</option>
                                  <option value="q4">Q4 (75-100%)</option>
                                </select>
                                <div className="w-px h-4 bg-gray-600"></div>
                                <select 
                                  className="bg-transparent text-xs text-white outline-none px-2 py-1"
                                  value={scanSettings.interval}
                                  onChange={e => setScanSettings({...scanSettings, interval: parseInt(e.target.value)})}
                                >
                                  <option value={1}>Every 1s</option>
                                  <option value={2}>Every 2s</option>
                                  <option value={3}>Every 3s</option>
                                  <option value={5}>Every 5s</option>
                                </select>
                              </div>
                           </div>

                           <Button 
                             onClick={startExtraction} 
                             className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20"
                           >
                             Start Intelligent Scan
                           </Button>
                         </>
                      ) : isExtracting ? (
                          <div className="text-sm text-blue-400 font-mono animate-pulse font-bold">
                              System Busy...
                          </div>
                      ) : (
                          <div className="flex items-center gap-3">
                            <Button variant="secondary" size="sm" onClick={async () => { 
                                 if(confirm("Clear frames and start over?")) {
                                   setFrames([]); 
                                   setFilters({ minQuality: 'All', shotType: 'All', activeTags: [] });
                                   await clearProject();
                                   if (videoUrl === 'restored') {
                                      setVideoUrl(null);
                                      setProjectName('My Project');
                                   }
                                 }
                              }}>
                              New Scan
                            </Button>
                          </div>
                      )}
                  </div>

                  {/* Right: Toggle Filters */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setLibraryView(libraryView === 'all' ? 'library' : 'all')}
                      className={`text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${libraryView === 'library' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'text-gray-400 hover:text-white'}`}
                    >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                       View Library ({stats.keepers})
                    </button>

                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${showFilters ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                  </div>
               </div>

               {/* Expandable Filter Drawer */}
               {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-800 animate-in slide-in-from-top-2 duration-200">
                     <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 uppercase font-bold">Quality:</span>
                            <select 
                                className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1 outline-none"
                                value={filters.minQuality}
                                onChange={(e) => setFilters(prev => ({ ...prev, minQuality: e.target.value as any }))}
                            >
                                <option value="All">All</option>
                                <option value={FrameQuality.GOOD}>Good+</option>
                                <option value={FrameQuality.EXCELLENT}>Excellent</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 uppercase font-bold">Type:</span>
                            <select 
                                className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1 outline-none"
                                value={filters.shotType}
                                onChange={(e) => setFilters(prev => ({ ...prev, shotType: e.target.value as any }))}
                            >
                                <option value="All">All</option>
                                <option value={ShotType.CANDID}>Candid</option>
                                <option value={ShotType.POSE}>Posed</option>
                            </select>
                        </div>
                        <div className="h-6 w-px bg-gray-800 mx-2"></div>
                        <div className="flex flex-wrap gap-2">
                            {smartChips.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTagFilter(tag)}
                                    className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                                        filters.activeTags.includes(tag) 
                                        ? 'bg-blue-600 text-white border-blue-500' 
                                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* PIPELINE VISUALIZATION */}
            {(isExtracting || stats.analyzedFrames < stats.totalFrames) && (
                <PipelineStatus 
                   isExtracting={isExtracting}
                   extractionProgress={extractionProgress}
                   analyzedCount={stats.analyzedFrames}
                   totalFrames={stats.totalFrames}
                   isProcessing={stats.analyzedFrames < stats.totalFrames}
                />
            )}

            {/* Gallery */}
            <div>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
                 <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {libraryView === 'library' ? 'Your Keepers' : 'Extracted Library'}
                      {/* Scan Range Label */}
                      {!isExtracting && frames.length > 0 && (
                          <span className="text-xs font-mono font-normal text-gray-500 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded ml-2">
                             {getScanRangeLabel()}
                          </span>
                      )}
                    </h2>
                    <span className="text-xs text-gray-500 font-mono mt-1">Showing {filteredFrames.length} frames</span>
                 </div>

                 {/* Library Filters */}
                 <div className="flex items-center bg-gray-900 p-1 rounded-lg border border-gray-800">
                     <button 
                       onClick={() => setLibraryFilter('all')}
                       className={`text-xs px-3 py-1 rounded-md transition-all ${libraryFilter === 'all' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                     >
                       All
                     </button>
                     <button 
                       onClick={() => setLibraryFilter('original')}
                       className={`text-xs px-3 py-1 rounded-md transition-all ${libraryFilter === 'original' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                     >
                       Originals
                     </button>
                     <button 
                       onClick={() => setLibraryFilter('enhanced')}
                       className={`text-xs px-3 py-1 rounded-md transition-all ${libraryFilter === 'enhanced' ? 'bg-purple-900/50 text-purple-300 shadow border border-purple-500/30' : 'text-gray-400 hover:text-purple-300'}`}
                     >
                       Enhanced
                     </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredFrames.map(frame => (
                    <FrameCard 
                      key={frame.id} 
                      frame={frame} 
                      onToggleSelect={toggleFrameSelection} 
                      onClick={(f) => setSelectedFrameId(f.id)}
                      onEnhanceClick={(f, e) => {
                          e.stopPropagation();
                          setSelectedFrameId(f.id);
                      }}
                    />
                  ))}
              </div>
              
              {filteredFrames.length === 0 && !isExtracting && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                     {libraryView === 'library' ? 'No keepers selected yet.' : 'No frames match filters.'}
                  </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Selection Action Bar */}
        {selectedFrames.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-4">
             <div className="text-sm font-medium text-white whitespace-nowrap">
                <span className="text-blue-400 font-bold">{selectedFrames.length}</span> selected
             </div>
             <div className="h-4 w-px bg-gray-700"></div>
             <button 
                onClick={clearSelection}
                className="text-xs font-medium text-gray-400 hover:text-white transition-colors uppercase tracking-wide"
             >
                Clear
             </button>
             <Button 
                size="sm"
                onClick={() => setIsBatchEnhancing(true)}
                className="rounded-full px-5 shadow-lg shadow-blue-900/30"
             >
                ✨ Batch Enhance
             </Button>
          </div>
        )}
      </main>
    </div>
  );
}