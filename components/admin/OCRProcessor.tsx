import React, { useState } from 'react';
import { scanDocumentWithGemini } from '../../services/ocrService';
import { sanitizeOCRData } from '../../utils/ocrSanitizer';

/**
 * OCRProcessor extracts text from an uploaded Biodata Image/PDF
 * and maps it directly into standard form fields using Gemini AI.
 */
export const OCRProcessor = ({ onExtracted }: { onExtracted: (data: any) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = async (f: File) => {
    if (!f.type.includes('image/') && !f.type.includes('pdf')) {
      alert("Please upload an image or PDF file.");
      return;
    }
    
    setFile(f);
    if (f.type.includes('image/')) {
       setPreviewUrl(URL.createObjectURL(f));
    } else {
       setPreviewUrl(null); // No immediate PDF preview, could render if needed.
    }

    setIsProcessing(true);
    
    try {
       const extractedData = await scanDocumentWithGemini(f);
       
       // STRICT MAPPING: Sanitize the AI output to prevent undefined/NaN DB inserts
       const sanitizedData = sanitizeOCRData(extractedData);
       
       onExtracted(sanitizedData);
    } catch (err: any) {
       alert(err.message || "Failed to process image.");
    } finally {
       setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand/20 relative overflow-hidden transition-all">
       <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-24 h-24 text-brand" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
       </div>
       
       <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-2">
         <span className="bg-brand text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">AI Vision</span>
         Auto-Fill from Form
       </h3>
       <p className="text-xs text-gray-500 font-medium mb-6">Upload a scanned biodata image or PDF to instantly populate the form fields below.</p>

       <div 
         onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
         onDragEnter={e => { e.preventDefault(); e.stopPropagation(); }}
         onDragLeave={e => { e.preventDefault(); e.stopPropagation(); }}
         onDrop={handleFileDrop}
         className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${isProcessing ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-brand/50 hover:bg-gray-50'}`}
       >
          <input 
            type="file" 
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isProcessing}
          />
          
          {isProcessing ? (
             <div className="flex flex-col items-center animate-pulse py-4">
                <div className="w-12 h-12 rounded-full border-4 border-brand border-t-transparent animate-spin mb-4"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand">Extracting Text via AI...</p>
             </div>
          ) : previewUrl ? (
             <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md mb-4 border-2 border-white">
                   <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                </div>
                <p className="text-xs font-bold text-gray-500">Tap or Drop to upload a different file</p>
             </div>
          ) : (
             <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-inner">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-sm font-bold text-gray-700">Drag & Drop biodata here</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">Works with images & PDFs</p>
             </div>
          )}
       </div>
    </div>
  );
};
