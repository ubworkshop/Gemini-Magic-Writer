import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Sparkles, Loader2, PenTool, Mail, Share2, Lightbulb, Newspaper, Globe, Cpu, BookOpen, Film, Feather, Terminal } from 'lucide-react';
import { FileAttachment } from '../types';
import { PROMPT_TEMPLATES, SUGGESTED_PROMPTS } from '../constants';

interface DraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, files: FileAttachment[]) => void;
  isGenerating: boolean;
}

export const DraftDialog: React.FC<DraftDialogProps> = ({ isOpen, onClose, onSubmit, isGenerating }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileAttachment[] = [];
      const fileCount = e.target.files.length;
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Extract base64 data part
          const base64Data = base64String.split(',')[1];
          newFiles.push({
            name: file.name,
            mimeType: file.type,
            data: base64Data
          });
          if (newFiles.length === fileCount) {
            setFiles(prev => [...prev, ...newFiles]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() && files.length === 0) return;
    onSubmit(prompt, files);
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'PenTool': return <PenTool className="w-4 h-4" />;
      case 'Mail': return <Mail className="w-4 h-4" />;
      case 'Share2': return <Share2 className="w-4 h-4" />;
      case 'Newspaper': return <Newspaper className="w-4 h-4" />;
      case 'Globe': return <Globe className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Film': return <Film className="w-4 h-4" />;
      case 'Feather': return <Feather className="w-4 h-4" />;
      case 'Terminal': return <Terminal className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">New AI Draft</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Templates Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Choose a Template</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROMPT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setPrompt(template.prompt)}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group text-left"
                    disabled={isGenerating}
                  >
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-white group-hover:text-purple-600 transition-colors shadow-sm">
                      {getIcon(template.icon)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-700 text-sm group-hover:text-purple-900">{template.label}</div>
                      <div className="text-xs text-slate-400 group-hover:text-purple-700/60 line-clamp-1">{template.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prompt</label>
                <div className="relative">
                  <textarea 
                      className="w-full h-32 p-4 text-slate-700 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none text-base bg-slate-50/30"
                      placeholder="Describe what you want to write..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isGenerating}
                  />
                  {prompt === '' && (
                     <div className="absolute bottom-3 right-3 flex gap-2">
                        {SUGGESTED_PROMPTS.slice(0, 1).map((s, i) => (
                           <button 
                             key={i}
                             onClick={() => setPrompt(s)}
                             className="text-xs bg-white border border-gray-200 text-slate-400 px-2 py-1 rounded-md hover:text-purple-600 hover:border-purple-200 transition-colors shadow-sm"
                           >
                             Try: "{s.substring(0, 20)}..."
                           </button>
                        ))}
                     </div>
                  )}
                </div>
                
                {/* Suggestions Pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                   <div className="flex items-center gap-1 text-xs text-slate-400 mr-1">
                      <Lightbulb className="w-3 h-3" />
                      <span>Ideas:</span>
                   </div>
                   {SUGGESTED_PROMPTS.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                      >
                        {suggestion.length > 40 ? suggestion.substring(0, 40) + '...' : suggestion}
                      </button>
                   ))}
                </div>
            </div>

            {/* File Attachments */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Reference Materials</label>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                        disabled={isGenerating}
                    >
                        <Upload className="w-3 h-3" /> Add files
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
                
                {files.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {files.map((file, idx) => (
                            <div key={idx} className="relative group p-2 border border-gray-200 rounded-lg flex items-center gap-2 bg-gray-50">
                                {file.mimeType.startsWith('image/') ? (
                                    <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                        <img src={`data:${file.mimeType};base64,${file.data}`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <FileText className="w-8 h-8 text-gray-400 p-1" />
                                )}
                                <span className="text-xs text-gray-600 truncate flex-1">{file.name}</span>
                                <button 
                                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow border border-gray-200 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center gap-3 text-gray-400 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer group"
                    >
                        <div className="p-2 bg-slate-50 rounded-full group-hover:bg-white transition-colors">
                            <ImageIcon className="w-5 h-5 opacity-50 group-hover:text-purple-500 group-hover:opacity-100" />
                        </div>
                        <span className="text-sm">Attach images for context</span>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isGenerating}
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                disabled={isGenerating || (!prompt && files.length === 0)}
                className="group relative px-6 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium shadow-lg hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden"
            >
                {isGenerating ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Draft...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-300 group-hover:animate-pulse" />
                        Generate Draft
                    </span>
                )}
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10"></div>
            </button>
        </div>
      </div>
    </div>
  );
};