import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Sparkles, Hash } from 'lucide-react';
import { PLACEHOLDER_TEXT } from '../constants';

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  onSelectionChange: (rect: DOMRect | null, text: string) => void;
  isGenerating: boolean;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export const RichEditor: React.FC<RichEditorProps> = ({ 
  content, 
  onChange, 
  onSelectionChange, 
  isGenerating,
  editorRef 
}) => {
  // Use a ref to track if the last change was internal to avoid cursor jumps
  const isInternalChange = useRef(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
        if (editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }
    // Reset internal change flag after effect
    isInternalChange.current = false;
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html === '<br>' ? '' : html);
    }
    checkSelection();
  };

  const checkSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      onSelectionChange(null, '');
      return;
    }

    const text = selection.toString().trim();
    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      onSelectionChange(rect, text);
    } else {
      onSelectionChange(null, '');
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput(); // Sync state
    }
  };

  return (
    <div className="relative w-full max-w-3xl flex flex-col items-center">
      <style>{`
        .with-line-numbers {
          counter-reset: line-counter;
        }
        .with-line-numbers p,
        .with-line-numbers h1,
        .with-line-numbers h2,
        .with-line-numbers h3,
        .with-line-numbers h4,
        .with-line-numbers blockquote,
        .with-line-numbers li,
        .with-line-numbers div:not([data-ignore]) { 
            counter-increment: line-counter;
            position: relative;
        }
        .with-line-numbers p::before,
        .with-line-numbers h1::before,
        .with-line-numbers h2::before,
        .with-line-numbers h3::before,
        .with-line-numbers h4::before,
        .with-line-numbers blockquote::before,
        .with-line-numbers li::before,
        .with-line-numbers div:not([data-ignore])::before {
            content: counter(line-counter);
            position: absolute;
            left: -3.5rem; /* Gutter width inside the padding */
            width: 2.5rem;
            text-align: right;
            color: #cbd5e1;
            font-size: 0.75rem;
            line-height: inherit;
            font-family: monospace;
            user-select: none;
            pointer-events: none;
            font-variant-numeric: tabular-nums;
        }
        /* Adjust for list indentation if needed, though simple absolute works for general block numbering */
        .with-line-numbers li::before {
             left: -4.5rem; /* Push back further for indented lists */
        }
      `}</style>

      {/* Floating Toolbar */}
      <div 
        role="toolbar" 
        aria-label="Text formatting options"
        className="sticky top-0 z-30 mb-6 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full shadow-sm flex items-center gap-1 transition-all no-print"
      >
        <ToolbarButton 
            icon={<Heading1 className="w-4 h-4" />} 
            onClick={() => execCommand('formatBlock', 'H1')} 
            label="Heading 1"
        />
        <ToolbarButton 
            icon={<Heading2 className="w-4 h-4" />} 
            onClick={() => execCommand('formatBlock', 'H2')} 
            label="Heading 2"
        />
        <div role="separator" className="w-px h-4 bg-gray-200 mx-1" aria-hidden="true" />
        <ToolbarButton 
            icon={<Bold className="w-4 h-4" />} 
            onClick={() => execCommand('bold')} 
            label="Bold"
            shortcut="Ctrl+B"
        />
        <ToolbarButton 
            icon={<Italic className="w-4 h-4" />} 
            onClick={() => execCommand('italic')} 
            label="Italic"
            shortcut="Ctrl+I"
        />
        <ToolbarButton 
            icon={<Quote className="w-4 h-4" />} 
            onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} 
            label="Quote"
        />
        <div role="separator" className="w-px h-4 bg-gray-200 mx-1" aria-hidden="true" />
        <ToolbarButton 
            icon={<List className="w-4 h-4" />} 
            onClick={() => execCommand('insertUnorderedList')} 
            label="Bullet List"
            shortcut="Ctrl+Shift+8"
        />
        <ToolbarButton 
            icon={<ListOrdered className="w-4 h-4" />} 
            onClick={() => execCommand('insertOrderedList')} 
            label="Numbered List"
            shortcut="Ctrl+Shift+7"
        />
        <div role="separator" className="w-px h-4 bg-gray-200 mx-1" aria-hidden="true" />
        <ToolbarButton 
            icon={<Hash className="w-4 h-4" />} 
            onClick={() => setShowLineNumbers(!showLineNumbers)} 
            label="Toggle Line Numbers"
            active={showLineNumbers}
        />
      </div>

      <div className="relative w-full group">
        <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onMouseUp={checkSelection}
            onKeyUp={checkSelection}
            onBlur={checkSelection}
            className={`
                w-full min-h-[calc(100vh-300px)] outline-none text-lg leading-relaxed text-slate-700 font-serif 
                selection:bg-purple-100 selection:text-purple-900 
                empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 
                cursor-text prose prose-slate max-w-none 
                prose-headings:font-serif prose-h1:text-4xl prose-h1:mb-4 prose-h2:text-2xl prose-h2:mt-6 
                prose-p:my-3 prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic
                transition-all duration-300
                ${showLineNumbers ? 'with-line-numbers pl-14 sm:pl-16' : ''}
            `}
            data-placeholder={PLACEHOLDER_TEXT}
            spellCheck={false}
            role="textbox"
            aria-multiline="true"
            aria-label="Rich text editor"
        />
        
        {/* Empty State Prompt (Only show if truly empty) */}
        {!content && !isGenerating && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 no-print" aria-hidden="true">
                    <div className="inline-flex items-center gap-2 text-slate-300 text-sm mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Pro Tip</span>
                    </div>
                    <p className="text-slate-400 text-sm">Select any text to activate Magic Edit</p>
            </div>
        )}
      </div>
    </div>
  );
};

const ToolbarButton: React.FC<{ icon: React.ReactNode; onClick: () => void; label: string; shortcut?: string; active?: boolean }> = ({ icon, onClick, label, shortcut, active }) => (
  <button 
    type="button"
    onMouseDown={(e) => e.preventDefault()} // Prevent focus loss for mouse users
    onClick={onClick}
    className={`
        p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50
        ${active ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-purple-600 hover:bg-purple-50'}
    `}
    title={shortcut ? `${label} (${shortcut})` : label}
    aria-label={label}
    aria-keyshortcuts={shortcut}
    aria-pressed={active}
  >
    {icon}
  </button>
);