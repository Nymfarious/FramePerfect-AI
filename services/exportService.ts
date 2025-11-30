import JSZip from 'jszip';
import { VideoFrame } from '../types';

export const exportProjectToZip = async (frames: VideoFrame[], projectName: string) => {
  const zip = new JSZip();
  // Sanitize project name
  const safeName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'frameperfect_export';
  const folder = zip.folder(safeName);
  
  if (!folder) throw new Error("Could not create folder");

  // Filter for keepers only
  const keepers = frames.filter(f => f.isSelected);
  
  // 1. Create a Metadata Manifest
  const manifest = keepers.map(f => ({
    id: f.id,
    timestamp: f.timestamp,
    quality: f.analysis?.quality,
    score: f.analysis?.compositionScore,
    tags: f.analysis?.tags,
    advice: f.analysis?.technicalAdvice,
    people: f.analysis?.people,
    shotType: f.analysis?.shotType,
    isEnhanced: !!f.enhancedUrl
  }));

  folder.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 2. Add Images
  keepers.forEach((frame, index) => {
    // Use enhanced version if available, otherwise original
    const imageData = frame.enhancedUrl || frame.imageUrl;
    
    // Remove Base64 header to get raw bytes
    const base64Data = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    
    // Naming convention: timestamp_quality.png
    const filename = `frame_${frame.timestamp.toFixed(2)}s_${frame.analysis?.quality || 'ungraded'}.png`;
    
    folder.file(filename, base64Data, { base64: true });
  });

  // 3. Generate Zip
  const content = await zip.generateAsync({ type: "blob" });
  
  // 4. Trigger Download
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};