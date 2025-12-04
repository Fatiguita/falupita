import React, { useState, useEffect, useRef } from 'react';
import { GridSlot } from './components/GridSlot';
import { ThemePicker } from './components/ThemePicker';
import { PrintLayout } from './components/PrintLayout';
import { BingoImage, AppTheme, DEFAULT_THEME } from './types';
import { Download, RefreshCcw, Layers, Minus, Plus, Loader2, Copy, Archive, Upload, Key, X, CheckCircle2, ExternalLink } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import JSZip from 'jszip';
// @ts-ignore
import saveAs from 'file-saver';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);
  
  // CHANGED: Defaults set to 1 as requested for GitHub version
  const [sheetCount, setSheetCount] = useState(1); 
  const [copies, setCopies] = useState(1); 
  
  // API Key State - BYOK Logic
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('falupita_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(''); 
  
  // Initialize slots
  const [images, setImages] = useState<BingoImage[]>(() => {
    return Array.from({ length: 1 * 9 }).map((_, i) => ({
      id: `slot-${i}-${Date.now()}`,
      url: null,
      history: [],
      historyIndex: -1
    }));
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force modal on first load if no key
  useEffect(() => {
    if (!apiKey) {
        setShowKeyModal(true);
    }
  }, []);

  useEffect(() => {
    setImages(prev => {
      const targetSize = sheetCount * 9;
      if (prev.length === targetSize) return prev;
      if (prev.length < targetSize) {
         const needed = targetSize - prev.length;
         const newSlots = Array.from({ length: needed }).map((_, i) => ({
            id: `slot-${prev.length + i}-${Date.now()}`,
            url: null,
            history: [],
            historyIndex: -1
         }));
         return [...prev, ...newSlots];
      } else {
         return prev.slice(0, targetSize);
      }
    });
  }, [sheetCount]);

  useEffect(() => {
    if (showKeyModal) {
      setTempKey(apiKey);
    }
  }, [showKeyModal, apiKey]);

  const updateImage = (id: string, updates: Partial<BingoImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const deleteImage = (id: string) => {
    updateImage(id, { url: null, prompt: undefined, originalUrl: null, history: [], historyIndex: -1 });
  };

  const handleSaveSession = async () => {
    setIsSavingSession(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("images");
      const sessionSlots = images.map((img, index) => {
        const meta: any = {
          id: img.id,
          caption: img.caption,
          prompt: img.prompt,
          historyIndex: img.historyIndex,
          url: null, history: [], originalUrl: null
        };
        const saveFile = (dataUrl: string | null, name: string) => {
          if (!dataUrl || !folder) return null;
          const parts = dataUrl.split(',');
          if (parts.length !== 2) return null;
          const base64 = parts[1];
          const mime = dataUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
          const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : 'png';
          const filename = `${name}.${ext}`;
          folder.file(filename, base64, { base64: true });
          return `images/${filename}`;
        };
        if (img.url) meta.url = saveFile(img.url, `slot-${index}-current`);
        if (img.originalUrl) meta.originalUrl = saveFile(img.originalUrl, `slot-${index}-original`);
        meta.history = img.history.map((hUrl, hIdx) => saveFile(hUrl, `slot-${index}-hist-${hIdx}`)).filter(Boolean);
        return meta;
      });
      const exportData = {
        app: "Falupita",
        version: "1.0",
        createdAt: new Date().toISOString(),
        theme,
        settings: { sheetCount, copies },
        slots: sessionSlots
      };
      zip.file("session.json", JSON.stringify(exportData, null, 2));
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `falupita-session-${new Date().toISOString().slice(0,10)}.zip`);
    } catch (error) {
      console.error("Session Save Failed:", error);
      alert("Failed to save session.");
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleSessionImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsLoadingSession(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const sessionFile = zip.file("session.json");
      if (!sessionFile) throw new Error("Invalid session file");
      const sessionText = await sessionFile.async("text");
      const sessionData = JSON.parse(sessionText);
      if (sessionData.theme) setTheme(sessionData.theme);
      if (sessionData.settings) {
        setSheetCount(sessionData.settings.sheetCount || 1);
        setCopies(sessionData.settings.copies || 1);
      }
      const loadImage = async (path: string | null) => {
        if (!path) return null;
        const fileInZip = zip.file(path);
        if (!fileInZip) return null;
        const base64 = await fileInZip.async("base64");
        const ext = path.split('.').pop()?.toLowerCase();
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        return `data:${mime};base64,${base64}`;
      };
      const restoredImages = await Promise.all(sessionData.slots.map(async (slot: any) => {
        const url = await loadImage(slot.url);
        const originalUrl = await loadImage(slot.originalUrl);
        const history = await Promise.all((slot.history || []).map((path: string) => loadImage(path)));
        return { ...slot, url, originalUrl, history: history.filter(Boolean), historyIndex: slot.historyIndex ?? -1 };
      }));
      setImages(restoredImages);
    } catch (error) {
      console.error("Import Failed:", error);
      alert("Failed to load session.");
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const elements = printRef.current.querySelectorAll('.print-sheet');
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let pageIndex = 0;
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const type = el.getAttribute('data-type');
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const iterations = type === 'bingo-card' ? copies : 1;
        for (let c = 0; c < iterations; c++) {
           if (pageIndex > 0) doc.addPage();
           doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
           pageIndex++;
        }
      }
      doc.save('falupita-cards.pdf');
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Failed to generate PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const val = tempKey.trim();
    setApiKey(val);
    localStorage.setItem('falupita_api_key', val);
    setShowKeyModal(false);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setTempKey('');
    localStorage.removeItem('falupita_api_key');
    setShowKeyModal(false);
  };

  const filledCount = images.filter(i => i.url).length;
  const isBusy = isGeneratingPDF || isSavingSession || isLoadingSession;

  return (
    <div className="min-h-screen transition-colors duration-300 text-gray-800 font-sans relative" style={{ backgroundColor: theme.background }}>
      <input type="file" ref={fileInputRef} className="hidden" accept=".zip" onChange={handleSessionImport} />
      
      {isBusy && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 size={48} className="animate-spin mb-4" />
          <h2 className="text-xl font-bold">Processing...</h2>
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Key size={18} className="text-yellow-600" />
                    Nano Banana API Key Needed
                 </h3>
                 {apiKey && <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>}
              </div>
              <div className="p-6">
                 <p className="text-sm text-gray-600 mb-4">
                    To use Falupita, you need a paid <strong>Gemini Nano Banana</strong> compatible key.
                 </p>
                 <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-600 font-medium text-sm hover:underline mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100"
                 >
                    <ExternalLink size={16} /> Get Key from Google AI Studio
                 </a>
                 <form onSubmit={handleSaveApiKey}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Paste Key Here</label>
                    <input 
                       type="password" 
                       value={tempKey}
                       onChange={(e) => setTempKey(e.target.value)}
                       placeholder="AIzaSy..."
                       className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
                    />
                    <div className="flex gap-2 justify-end">
                       {apiKey && (
                           <button type="button" onClick={handleClearApiKey} className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">Clear</button>
                       )}
                       <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">Save & Continue</button>
                    </div>
                 </form>
                 <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    Stored locally in your browser.
                 </div>
              </div>
           </div>
        </div>
      )}

      <header className="shadow-sm sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md" style={{ backgroundColor: theme.primary }}>
              F
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-tight">Falupita</h1>
              <p className="text-xs text-gray-500 font-medium">Interactive Bingo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
             <div className="flex flex-col items-end mr-1">
                 <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <button onClick={() => setSheetCount(Math.max(1, sheetCount - 1))} className="p-1 hover:bg-white rounded-md text-gray-600"><Minus size={14} /></button>
                    <div className="flex items-center gap-1 px-1 min-w-[3rem] justify-center">
                      <Layers size={14} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-700">{sheetCount}</span>
                    </div>
                    <button onClick={() => setSheetCount(Math.min(10, sheetCount + 1))} className="p-1 hover:bg-white rounded-md text-gray-600"><Plus size={14} /></button>
                 </div>
                 <span className="text-[10px] text-gray-400 mt-0.5 hidden sm:inline-block">Unique shuffled sheets</span>
             </div>

             <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
                <button onClick={() => setCopies(Math.max(1, copies - 1))} className="p-1 hover:bg-white rounded-md text-gray-600"><Minus size={14} /></button>
                <div className="flex items-center gap-1 px-1 min-w-[3rem] justify-center">
                  <Copy size={14} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">{copies}</span>
                </div>
                <button onClick={() => setCopies(Math.min(10, copies + 1))} className="p-1 hover:bg-white rounded-md text-gray-600"><Plus size={14} /></button>
             </div>
             
             <div className="relative">
                <button
                    onClick={() => setShowKeyModal(true)}
                    className={`p-2 rounded-full shadow-lg transition-transform hover:scale-105 ${apiKey ? 'bg-yellow-50 text-yellow-600 ring-2 ring-yellow-200' : 'bg-gray-200 text-gray-500'}`}
                >
                    <Key size={20} />
                </button>
                {apiKey && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm border-2 border-white"><CheckCircle2 size={10} /></div>
                )}
             </div>

             <ThemePicker currentTheme={theme} setTheme={setTheme} />
             
             <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
               <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full text-gray-600 hover:bg-white hover:text-blue-600"><Upload size={20} /></button>
               <div className="w-px h-6 bg-gray-300 mx-1"></div>
               <button onClick={handleSaveSession} disabled={filledCount === 0 || isBusy} className="p-2 rounded-full text-gray-600 hover:bg-white hover:text-blue-600 disabled:opacity-50"><Archive size={20} /></button>
             </div>

             <button 
                onClick={handleDownloadPDF}
                disabled={filledCount === 0 || isBusy}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm sm:text-base"
                style={{ backgroundColor: theme.secondary }}
             >
                <Download size={18} />
                <span className="hidden sm:inline">PDF</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Card Editor</h2>
            <p className="text-gray-500 text-sm mt-1">
              Fill the {images.length} slots below. <span className="font-medium text-blue-600">{images.length - filledCount} remaining</span>.
            </p>
          </div>
          {filledCount > 0 && (
             <button onClick={() => images.forEach(img => deleteImage(img.id))} className="text-xs text-red-500 hover:text-red-700 underline flex items-center gap-1"><RefreshCcw size={12} /> Reset Board</button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-12">
           {images.map((img, index) => (
             <GridSlot key={img.id} index={index} item={img} theme={theme} apiKey={apiKey} onUpdate={updateImage} onDelete={deleteImage} />
           ))}
        </div>
      </main>

      <PrintLayout ref={printRef} images={images} theme={theme} sheetCount={sheetCount} isGeneratingPDF={isGeneratingPDF} />
    </div>
  );
}
