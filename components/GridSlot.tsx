import React, { useState, useRef } from 'react';
import { MoreVertical, X, Sparkles, Upload, Crop, Wand2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { BingoImage, AppTheme } from '../types';
import { generateNanoBananaImage } from '../services/geminiService';

interface GridSlotProps {
  item: BingoImage;
  index: number;
  theme: AppTheme;
  apiKey?: string;
  onUpdate: (id: string, updates: Partial<BingoImage>) => void;
  onDelete: (id: string) => void;
}

export const GridSlot: React.FC<GridSlotProps> = ({ item, index, theme, apiKey, onUpdate, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Prompting / Generation State
  const [isPrompting, setIsPrompting] = useState(false);
  const [isRestyling, setIsRestyling] = useState(false);
  const [promptText, setPromptText] = useState('');
  
  // Cropping State
  const [isCropping, setIsCropping] = useState(false);
  const [cropScale, setCropScale] = useState(1);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cropImageRef = useRef<HTMLImageElement>(null);

  const [error, setError] = useState<string | null>(null);

  const activeUrl = item.url;
  const hasHistory = item.history.length > 1;

  // -- History Helper --
  const addToHistory = (newUrl: string, updates: Partial<BingoImage> = {}) => {
    const newHistory = item.history.slice(0, item.historyIndex + 1);
    newHistory.push(newUrl);
    
    onUpdate(item.id, {
      url: newUrl,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      ...updates
    });
  };

  const navigateHistory = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? item.historyIndex - 1 : item.historyIndex + 1;
    if (newIndex >= 0 && newIndex < item.history.length) {
      onUpdate(item.id, {
        historyIndex: newIndex,
        url: item.history[newIndex]
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const result = ev.target.result as string;
          onUpdate(item.id, { 
            url: result, 
            originalUrl: result,
            history: [result],
            historyIndex: 0,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    
    const isStyleTransfer = isRestyling && !!activeUrl;
    
    setIsPrompting(false);
    setIsRestyling(false);
    onUpdate(item.id, { isLoading: true });
    setMenuOpen(false);
    setError(null);

    try {
      const base64 = await generateNanoBananaImage(
        promptText, 
        isStyleTransfer ? activeUrl : undefined,
        apiKey
      );
      
      if (isStyleTransfer) {
        addToHistory(base64, { prompt: promptText, isLoading: false });
      } else {
        onUpdate(item.id, { 
          url: base64, 
          prompt: promptText, 
          isLoading: false, 
          originalUrl: base64,
          history: [base64],
          historyIndex: 0
        });
      }

    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Failed to generate";
      
      if (errMsg.includes("403") || errMsg.includes("Key")) {
         setError("API Key Invalid. Please check settings.");
      } else if (errMsg.includes("429")) {
         if (apiKey && apiKey.length > 5) {
            setError("Your Custom Key Quota Exceeded.");
         } else {
            setError("Shared Quota Exceeded. Try adding your own Key.");
         }
      } else {
         setError(errMsg.slice(0, 50) + (errMsg.length > 50 ? "..." : ""));
      }
      onUpdate(item.id, { isLoading: false });
    }
  };

  const openRestyle = () => {
    setIsRestyling(true);
    setPromptText('');
    setMenuOpen(false);
  };

  const openCrop = () => {
    setIsCropping(true);
    setCropScale(0.7);
    setCropPos({ x: 0, y: 0 });
    setMenuOpen(false);
  };

  const handleDownload = () => {
    if (!activeUrl) return;
    const link = document.createElement('a');
    link.href = activeUrl;
    link.download = `bingo-slot-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMenuOpen(false);
  };

  const handleCropSave = () => {
    const img = cropImageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const aspectWidth = 600; 
    const aspectHeight = 600; 
    canvas.width = aspectWidth;
    canvas.height = aspectHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.translate(cropPos.x * 2, cropPos.y * 2); 
      ctx.scale(cropScale, cropScale);
      
      const scaleFactor = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const drawW = img.naturalWidth * scaleFactor;
      const drawH = img.naturalHeight * scaleFactor;
      
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      
      const newUrl = canvas.toDataURL('image/jpeg', 0.95);
      addToHistory(newUrl);
    }
    setIsCropping(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPos.x, y: e.clientY - cropPos.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCropPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <div 
      className={`relative aspect-[3/4] rounded-2xl overflow-hidden transition-all group bg-white flex flex-col ${
        activeUrl 
          ? 'border-2 border-transparent shadow-sm hover:shadow-md' 
          : 'border-2 border-dashed hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
      }`}
      style={{ borderColor: activeUrl ? 'transparent' : theme.primary }}
    >
      <div 
        className="relative flex-1 w-full overflow-hidden bg-gray-50"
        onClick={() => {
           if (!activeUrl && !item.isLoading) {
              const fileInput = document.getElementById(`file-upload-${index}`);
              fileInput?.click();
           }
        }}
      >
        {item.isLoading && (
          <div className="absolute inset-0 z-20 bg-white/80 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
            <span className="text-xs font-semibold mt-2 text-gray-600">Working...</span>
          </div>
        )}

        {!activeUrl && !item.isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center cursor-pointer">
             <div className="flex items-center gap-6 mb-3">
               <label className="cursor-pointer group/icon flex flex-col items-center gap-1 transition-transform hover:scale-110" title="Upload Image">
                  <input id={`file-upload-${index}`} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  <Upload size={28} className="text-gray-400 group-hover/icon:text-blue-500 transition-colors" />
               </label>
               <button 
                  onClick={(e) => { e.stopPropagation(); setIsPrompting(true); setMenuOpen(false); }}
                  className="group/icon flex flex-col items-center gap-1 transition-transform hover:scale-110"
                  title="Generate with AI"
               >
                  <Sparkles size={28} className="text-gray-400 group-hover/icon:text-purple-500 transition-colors" />
               </button>
             </div>
             <span className="text-sm font-medium text-gray-400 select-none">Slot {index + 1}</span>
          </div>
        )}

        {activeUrl && (
          <>
            <img src={activeUrl} alt={`Slot ${index + 1}`} className="w-full h-full object-cover" />
            
            {hasHistory && (
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigateHistory('prev'); }}
                    disabled={item.historyIndex <= 0}
                    className="p-1 rounded-full text-white hover:bg-white/20 disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[10px] font-mono text-white px-1">
                    v{item.historyIndex + 1}/{item.history.length}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigateHistory('next'); }}
                    disabled={item.historyIndex >= item.history.length - 1}
                    className="p-1 rounded-full text-white hover:bg-white/20 disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
               </div>
            )}
          </>
        )}

        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className={`p-1 rounded-full shadow-sm hover:bg-white transition-colors backdrop-blur-sm ${
                  activeUrl ? 'bg-white/90 text-gray-700' : 'bg-gray-50 text-gray-400 hover:text-gray-600'
              }`}
            >
              <MoreVertical size={16} />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-xl border border-gray-200 py-1 text-sm z-30 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                 {activeUrl ? (
                   <>
                     <button 
                        onClick={openRestyle}
                        className="text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <Wand2 size={14} className="text-purple-500" />
                        <span>Restyle (AI)</span>
                     </button>
                     <button 
                        onClick={openCrop}
                        className="text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <Crop size={14} className="text-blue-500" />
                        <span>Crop / Zoom</span>
                     </button>
                     <button 
                        onClick={handleDownload}
                        className="text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <Download size={14} className="text-teal-600" />
                        <span>Download Image</span>
                     </button>
                   </>
                 ) : (
                    <button 
                      onClick={() => { setIsPrompting(true); setMenuOpen(false); }}
                      className="text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                    >
                      <Sparkles size={14} className="text-purple-500" />
                      <span>Generate New</span>
                    </button>
                 )}
                 
                 <label className="text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer text-gray-700 border-t border-gray-100">
                    <Upload size={14} className="text-gray-500" />
                    <span>{activeUrl ? 'Replace Image' : 'Upload Image'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                 </label>
                 
                 {activeUrl && (
                   <button 
                      onClick={() => { onDelete(item.id); setMenuOpen(false); }}
                      className="text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-500 border-t border-gray-100"
                    >
                      <X size={14} />
                      <span>Remove</span>
                   </button>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-12 bg-white border-t border-gray-100 flex items-center px-2 relative z-20">
        <input 
          type="text"
          value={item.caption || ''}
          onChange={(e) => onUpdate(item.id, { caption: e.target.value })}
          onFocus={handleFocus}
          placeholder="Add caption..."
          className="w-full text-center text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-400"
          onClick={(e) => e.stopPropagation()} 
        />
      </div>

      {(isPrompting || isRestyling) && (
        <div className="absolute inset-0 bg-slate-900/95 z-40 flex flex-col p-3 justify-center text-white">
          <h4 className="text-sm font-bold mb-2 text-white flex items-center gap-2">
            {isRestyling ? <Wand2 size={14}/> : <Sparkles size={14}/>}
            {isRestyling ? 'Restyle Image' : 'Generate New'}
          </h4>
          <p className="text-xs text-gray-400 mb-2">
            {isRestyling ? 'Describe the new style.' : 'Describe what to generate.'}
          </p>
          <textarea 
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={isRestyling ? "Make it look like a 3D render..." : "A cute robot eating a banana..."}
            className="w-full text-sm border border-slate-700 rounded p-2 mb-2 h-20 resize-none focus:outline-none focus:ring-1 bg-slate-800 text-white placeholder-gray-500"
            style={{ focusRingColor: theme.primary }}
          />
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => { setIsPrompting(false); setIsRestyling(false); }} 
              className="text-xs px-3 py-1 rounded text-gray-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              onClick={handleGenerate}
              disabled={!promptText.trim()}
              className="text-xs px-3 py-1 rounded text-white shadow-sm disabled:opacity-50 font-medium"
              style={{ backgroundColor: theme.primary }}
            >
              {isRestyling ? 'Transform' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {isCropping && activeUrl && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-sm w-full">
               <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Crop & Zoom</h3>
                  <button onClick={() => setIsCropping(false)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
               </div>
               
               <div 
                  className="relative w-full bg-gray-100 overflow-hidden cursor-move touch-none"
                  style={{ height: '400px' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
               >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-10 w-[280px] h-[280px]" />
                  </div>
                  
                  <div 
                    className="absolute top-1/2 left-1/2 w-full h-full flex items-center justify-center"
                    style={{ 
                      transform: `translate(-50%, -50%) translate(${cropPos.x}px, ${cropPos.y}px) scale(${cropScale})`
                    }}
                  >
                     <img 
                        ref={cropImageRef}
                        src={activeUrl} 
                        alt="crop-target"
                        className="max-w-none max-h-none"
                        style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                        draggable={false}
                     />
                  </div>
               </div>
               
               <div className="p-4 bg-white border-t space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Zoom</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="4" 
                      step="0.1" 
                      value={cropScale}
                      onChange={(e) => setCropScale(parseFloat(e.target.value))}
                      className="w-full mt-1 accent-blue-600"
                    />
                  </div>
                  <button 
                    onClick={handleCropSave}
                    className="w-full py-2 rounded-lg text-white font-bold shadow-md hover:brightness-110 transition-all"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Save Crop
                  </button>
               </div>
            </div>
         </div>
      )}

      {error && (
        <div className="absolute bottom-2 left-2 right-2 bg-red-100 text-red-600 text-xs p-2 rounded border border-red-200 z-50 break-words shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
};
