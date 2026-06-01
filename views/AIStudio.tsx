import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const AIStudio: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('Rajputana Heritage');

  const themes = [
    { name: 'Rajputana Heritage', icon: '🏰', prompt: 'A luxurious Rajputana palace interior with ornate carvings and warm lighting' },
    { name: 'Traditional Mandap', icon: '💍', prompt: 'A beautiful traditional Indian wedding mandap decorated with marigold flowers and silk drapes' },
    { name: 'Divine Temple', icon: '🛕', prompt: 'A serene ancient Hindu temple courtyard at sunset' },
    { name: 'Royal Garden', icon: '⛲', prompt: 'A lush royal garden with fountains and marble pathways' },
    { name: 'Modern Elegant', icon: '🏢', prompt: 'A modern high-end penthouse interior with clean lines and luxury decor' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY });
      const theme = themes.find(t => t.name === selectedTheme);

      // Extract the actual mimeType from the data URL (e.g., image/jpeg, image/png)
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: image.split(',')[1],
                mimeType: mimeType,
              },
            },
            {
              text: `Can you replace the background of this person to be a ${theme?.prompt}? Ensure the lighting on the person matches the new environment. Keep the person's pose and appearance exactly as is.`,
            },
          ],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setResult(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-rose-50 text-brand px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-4">
          ✨ Powered by VivahAI
        </div>
        <h1 className="text-5xl font-black text-gray-900 mb-4">Heritage Studio</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
          Transform your profile pictures with AI. Replace your background with traditional and luxurious themes to stand out.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-black">Step 1: Upload Photo</h2>
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border-4 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center group cursor-pointer">
              {image ? (
                <img src={image} className="w-full h-full object-cover" alt="User upload" />
              ) : (
                <div className="text-center p-8">
                  <span className="text-5xl mb-4 block">📸</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Click to upload or drag & drop</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-black">Step 2: Select Heritage Theme</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTheme(t.name)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${selectedTheme === t.name ? 'border-brand bg-rose-50 text-brand shadow-lg' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="font-bold text-sm text-left">{t.name}</span>
                </button>
              ))}
            </div>
            <button
              disabled={!image || loading}
              onClick={handleGenerate}
              className="w-full bg-brand text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-rose-200 hover:bg-rose-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating Heritage Magic...' : 'Generate New Look'}
            </button>
          </div>
        </div>

        <div className="sticky top-24">
          <div className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl overflow-hidden aspect-[3/4]">
            {result ? (
              <div className="h-full flex flex-col">
                <img src={result} className="w-full h-full object-cover rounded-[2rem]" alt="AI Result" />
                <div className="flex gap-4 mt-4">
                  <button className="flex-1 bg-white text-gray-900 py-3 rounded-xl font-bold">Use as Profile Picture</button>
                  <button className="flex-1 bg-white/20 text-white py-3 rounded-xl font-bold">Download</button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-5xl animate-bounce">✨</div>
                <h3 className="text-2xl font-black text-white">Your AI Masterpiece</h3>
                <p className="text-gray-400">Select a photo and a theme on the left to see the magic happen.</p>
              </div>
            )}
          </div>
          <div className="mt-8 p-6 bg-blue-50 text-blue-800 rounded-3xl text-sm flex gap-4">
            <span className="text-2xl">💡</span>
            <p className="leading-relaxed"><strong>Pro Tip:</strong> Use a clear selfie with good lighting. AI works best when the subject is clearly separated from the background.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;