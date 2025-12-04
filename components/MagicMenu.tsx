import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, AlignLeft, Minimize2, Maximize2, Type, Send } from 'lucide-react';
import { RewriteMode } from '../types';

interface MagicMenuProps {
  position: { x: number; y: number } | null;
  selectedText: string;
  onRewrite: (mode: RewriteMode, customPrompt?: string) => void;
  onClose: () => void;
  isStreaming: boolean;
}

export const MagicMenu: React.FC<MagicMenuProps> = ({ position, selectedText, onRewrite, onClose, isStreaming }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Close when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!position) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      onRewrite(RewriteMode.CUSTOM, customPrompt);
      setCustomPrompt('');
      setShowCustomInput(false);
    }
  };

  if (isStreaming) {
     return (
        <div 
        className="fixed z-50 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-xl border border-purple-100 animate-pulse"
        style={{ left: position.x, top: position.y + 10 }}
      >
        <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
        <span className="text-sm font-medium text-purple-900">Gemini is writing...</span>
      </div>
     )
  }

  return (
    <div 
      className="fixed z-50 flex flex-col bg-white rounded-xl shadow-2xl border border-gray-100 ring-1 ring-black/5 overflow-hidden transition-all duration-200 ease-out origin-top-left max-w-sm"
      style={{ left: Math.min(position.x, window.innerWidth - 300), top: position.y + 12 }}
    >
      {/* Header / Context */}
      <div className="bg-slate-50 px-3 py-2 border-b border-gray-100 flex items-center justify-between">
         <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            AI Edit
         </span>
         <span className="text-xs text-slate-400 truncate max-w-[120px]">"{selectedText.substring(0, 15)}..."</span>
      </div>

      {!showCustomInput ? (
        <div className="p-1 grid grid-cols-1 gap-0.5 min-w-[200px]">
          <button 
            onClick={() => onRewrite(RewriteMode.IMPROVE)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors text-left"
          >
            <Zap className="w-4 h-4" />
            Improve Writing
          </button>
          <button 
            onClick={() => onRewrite(RewriteMode.SHORTEN)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors text-left"
          >
            <Minimize2 className="w-4 h-4" />
            Shorten
          </button>
          <button 
            onClick={() => onRewrite(RewriteMode.EXPAND)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors text-left"
          >
            <Maximize2 className="w-4 h-4" />
            Expand
          </button>
          <button 
            onClick={() => onRewrite(RewriteMode.TONE_PROFESSIONAL)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors text-left"
          >
            <AlignLeft className="w-4 h-4" />
            Make Professional
          </button>
          <div className="h-px bg-gray-100 my-1"></div>
          <button 
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors text-left"
          >
            <Type className="w-4 h-4" />
            Ask Gemini...
          </button>
        </div>
      ) : (
        <form onSubmit={handleCustomSubmit} className="p-2">
           <div className="relative">
            <input
                autoFocus
                type="text"
                className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                placeholder="Ex: Make it sound like Shakespeare..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        e.stopPropagation(); // prevent closing the whole menu if just cancelling input
                        setShowCustomInput(false);
                    }
                }}
            />
            <button 
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-purple-600 hover:bg-purple-100 rounded"
            >
                <Send className="w-3.5 h-3.5" />
            </button>
           </div>
           <button 
            type="button" 
            onClick={() => setShowCustomInput(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
           >
            Back to presets
           </button>
        </form>
      )}
    </div>
  );
};
