import React, { useState } from 'react';

// Represents a single dynamic field in our Admin CRM Form
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // for 'select' type
}

const DEFAULT_FIELDS: FormField[] = [
  { id: 'full_name', label: 'Full Name', type: 'text', required: true },
  { id: 'phone', label: 'Primary Phone', type: 'text', required: true },
  { id: 'city', label: 'City', type: 'text', required: false },
  { id: 'caste', label: 'Caste', type: 'text', required: false }
];

export const FormBuilder = () => {
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Form Adding State
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    const newField: FormField = {
       id: newFieldLabel.toLowerCase().replace(/\s+/g, '_'),
       label: newFieldLabel,
       type: newFieldType,
       required: false
    };
    setFields([...fields, newField]);
    setNewFieldLabel('');
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  // --- HTML5 Drag and Drop Handlers ---
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    
    // Reorder the array
    const newFields = [...fields];
    const draggedItem = newFields[draggedIdx];
    
    newFields.splice(draggedIdx, 1);
    newFields.splice(idx, 0, draggedItem);
    
    setDraggedIdx(idx);
    setFields(newFields);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    // Real App: Save to Supabase `admin_settings` table here
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex gap-8 flex-col lg:flex-row mt-6">
       
       {/* Left Side: Builder */}
       <div className="flex-1">
         <h2 className="text-xl font-black text-gray-900 mb-2">Drag & Drop Form Builder</h2>
         <p className="text-xs text-gray-500 font-medium mb-6">Customize the Add Profile form. Changes apply to all staff admins.</p>
         
         {/* Field List (Draggable) */}
         <div className="space-y-3 mb-8 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
           {fields.map((field, idx) => (
             <div 
               key={field.id}
               draggable
               onDragStart={() => handleDragStart(idx)}
               onDragEnter={() => handleDragEnter(idx)}
               onDragEnd={handleDragEnd}
               onDragOver={e => e.preventDefault()}
               className={`flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm border cursor-move transition-transform ${draggedIdx === idx ? 'opacity-50 scale-[0.98] border-brand' : 'border-gray-200 hover:border-gray-300'}`}
             >
                <div className="text-gray-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-800">{field.label}</h4>
                  <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{field.type}</span>
                </div>
                <button title="Remove" onClick={() => removeField(field.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
             </div>
           ))}
         </div>

         {/* Add New Field Tool */}
         <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="New Field Name (e.g. Income)"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-brand/20 font-medium text-sm"
            />
            <select 
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 font-bold uppercase tracking-widest text-[10px]"
            >
               <option value="text">Text</option>
               <option value="number">Number</option>
               <option value="date">Date</option>
               <option value="textarea">Long Text</option>
            </select>
            <button onClick={addField} className="px-6 py-3 bg-gray-900 text-white font-bold tracking-widest text-[11px] rounded-xl uppercase hover:bg-black transition-colors">Add</button>
         </div>
       </div>

       {/* Right Side: Live Form Preview */}
       <div className="w-full lg:w-80 border-l lg:pl-8 border-gray-100 flex flex-col pt-4 lg:pt-0">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs">Live Preview</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex-1 rounded-2xl bg-gray-50 border shadow-inner p-5 space-y-4 relative">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 pointer-events-none rounded-2xl z-10"></div>
             {fields.map(f => (
               <div key={`preview-${f.id}`} className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{f.label} {f.required && '*'}</label>
                 <div className="w-full h-10 bg-white border border-gray-200 rounded-lg shadow-sm"></div>
               </div>
             ))}
          </div>
          <button className="w-full mt-4 bg-brand text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md">Save Schema</button>
       </div>
    </div>
  );
}
