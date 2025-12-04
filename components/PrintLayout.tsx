import React, { forwardRef } from 'react';
import { Scissors } from 'lucide-react';
import { BingoImage, AppTheme } from '../types';

interface PrintLayoutProps {
  images: BingoImage[];
  theme: AppTheme;
  sheetCount: number;
  isGeneratingPDF: boolean;
}

const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const PrintLayout = forwardRef<HTMLDivElement, PrintLayoutProps>(({ images, theme, sheetCount, isGeneratingPDF }, ref) => {
  const allActiveImages = images.filter(img => img.url);
  
  const renderBingoCard = (index: number) => {
    const start = index * 9;
    const end = start + 9;
    const sheetImages = images.slice(start, end);
    let filledSlots = shuffle<BingoImage>(sheetImages);

    return (
      <div 
        key={`sheet-${index}`} 
        className="print-sheet w-full flex flex-col items-center justify-center p-12 bg-white"
        style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}
        data-type="bingo-card"
      >
        <div className="mb-10 text-center">
            <h1 className="text-6xl font-bold uppercase tracking-widest" style={{ color: theme.secondary }}>BINGO</h1>
            <p className="text-lg text-gray-500 mt-4">Game Sheet #{index + 1}</p>
        </div>
        
        <div 
          className="grid grid-cols-3 gap-4 border-[6px] p-6 rounded-2xl w-full max-w-[180mm]"
          style={{ borderColor: theme.primary, backgroundColor: theme.background }}
        >
          {filledSlots.map((img, idx) => (
            <div 
              key={idx} 
              className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden border-2 flex flex-col shadow-sm"
              style={{ borderColor: theme.secondary }}
            >
              <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center bg-gray-50">
                {img && img.url ? (
                  <img src={img.url} alt="bingo-slot" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-200 font-bold text-4xl select-none opacity-20 rotate-45">FREE</div>
                )}
              </div>
              {img && img.url && (
                <div className="h-auto min-h-[15%] py-2 px-1 flex items-center justify-center border-t border-gray-100">
                  <span className="text-center font-bold text-gray-800 text-sm leading-tight break-words w-full">
                    {img.caption || ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-12 text-center text-sm text-gray-400">
           Generated with Falupita
        </div>
      </div>
    );
  };

  const renderTokenSheet = () => {
    return (
      <div 
        className="print-sheet w-full p-12 bg-white"
        style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}
        data-type="tokens"
      >
        <div className="mb-8 text-center border-b pb-4">
            <h2 className="text-4xl font-bold uppercase" style={{ color: theme.secondary }}>Tokens</h2>
            <p className="text-lg text-gray-500 flex items-center justify-center gap-2 mt-2">
               <Scissors size={20} /> Cut out these cards to draw from the bag
            </p>
        </div>
        <div className="grid grid-cols-3 gap-0 border-t border-l border-dashed border-gray-400">
          {allActiveImages.map((img) => (
             <div key={img.id} className="aspect-[3/4] relative p-4 border-r border-b border-dashed border-gray-400 flex flex-col items-center justify-center break-inside-avoid">
                <div className="w-full h-full rounded-md overflow-hidden bg-white shadow-sm border border-gray-100 p-2 flex flex-col gap-2">
                    <div className="flex-1 relative overflow-hidden rounded">
                       <img src={img.url!} alt="token" className="w-full h-full object-contain" />
                    </div>
                    {img.caption && <p className="text-center font-bold text-sm text-gray-800 leading-tight pb-1">{img.caption}</p>}
                </div>
                <div className="absolute top-2 left-2 opacity-30 text-gray-600"><Scissors size={14} /></div>
             </div>
          ))}
        </div>
      </div>
    );
  };

  const containerClass = isGeneratingPDF ? "fixed top-0 left-0 z-[-50] opacity-100 pointer-events-none" : "hidden";

  return (
    <div ref={ref} className={containerClass}>
        {Array.from({ length: sheetCount }).map((_, i) => renderBingoCard(i))}
        {allActiveImages.length > 0 && renderTokenSheet()}
    </div>
  );
});

PrintLayout.displayName = "PrintLayout";
