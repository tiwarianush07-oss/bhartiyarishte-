import React, { useState, useRef } from 'react';

export const SmartPhotoCropper = ({ onCropped }: { onCropped: (url: string) => void }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setIsScanning(true);
    setScanComplete(false);

    // Simulate AI Face Detection and Auto-Crop
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      // We pass the URL back to the parent conceptually. 
      // In a real app we'd draw to canvas and extract a Blob.
      onCropped(url); 
    }, 2000);
  };

  const triggerSelect = () => fileInputRef.current?.click();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-500/20 relative overflow-hidden transition-all mt-6">
       <input 
          type="file" 
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
       />

       <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
       </div>
       
       <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-2">
         <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Image Quality AI</span>
         Smart Photo Processor
       </h3>
       <p className="text-xs text-gray-500 font-medium mb-6">Automatically detects faces, corrects lighting, and compresses profile photos before upload.</p>

       {!photoUrl ? (
          <button 
             onClick={triggerSelect}
             className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors bg-gray-50 hover:bg-emerald-50/50"
          >
             Select Profile Photo to Process
          </button>
       ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-[200px] mx-auto border-4 border-gray-100 shadow-xl">
             <img src={photoUrl} className={`w-full h-full object-cover transition-all duration-1000 ${isScanning ? 'opacity-50 grayscale blur-sm scale-110' : 'opacity-100 grayscale-0 blur-0 scale-100'}`} alt="Processing" />
             
             {isScanning && (
                <>
                   <div className="absolute inset-0 bg-emerald-500/20 animate-pulse"></div>
                   <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-[scan_2s_ease-in-out_infinite]"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="bg-black/80 text-emerald-400 text-[10px] uppercase tracking-[0.3em] font-black px-4 py-2 rounded-full border border-emerald-500/30">Detecting Face...</span>
                   </div>
                </>
             )}

             {scanComplete && (
                <div className="absolute inset-0 ring-4 ring-emerald-500 ring-inset flex items-end justify-center pb-4 bg-gradient-to-t from-black/60 to-transparent">
                   <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest drop-shadow-md">
                     <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     Optimized
                   </div>
                </div>
             )}
          </div>
       )}

       {scanComplete && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => setPhotoUrl(null)} className="text-[10px] text-gray-400 font-bold uppercase hover:text-rose-500 transition-colors">Replace Photo</button>
          </div>
       )}
    </div>
  );
};
