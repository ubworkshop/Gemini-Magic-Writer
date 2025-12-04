import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Menu, 
  Download, 
  Settings, 
  Sparkles, 
  ChevronLeft,
  FileText,
  CheckCircle2,
  Cloud,
  Loader2
} from 'lucide-react';
import { DraftDialog } from './components/DraftDialog';
import { MagicMenu } from './components/MagicMenu';
import { Tooltip } from './components/Tooltip';
import { RichEditor } from './components/RichEditor';
import { SettingsDialog } from './components/SettingsDialog';
import { RewriteMode, FileAttachment, AppSettings } from './types';
import { generateDraftStream, rewriteSelectionStream } from './services/geminiService';
import { DEFAULT_SETTINGS } from './constants';

const STORAGE_KEY = 'gemini_writer_doc_v1';

const App: React.FC = () => {
  // --- State ---
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDraftDialogOpen, setDraftDialogOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Magic Menu State
  const [selectedText, setSelectedText] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [isMagicStreaming, setIsMagicStreaming] = useState(false);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef<{ title: string; content: string } | null>(null);

  // --- Effects ---

  // Load initial data from LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.title !== undefined) setTitle(parsed.title);
        if (parsed.content !== undefined) setContent(parsed.content);
        // Sync ref to prevent immediate re-save on mount
        lastSavedRef.current = { 
            title: parsed.title || '', 
            content: parsed.content || '' 
        };
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  // Auto-save logic
  useEffect(() => {
    // Don't save if nothing changed from last save
    if (
        lastSavedRef.current && 
        lastSavedRef.current.title === title && 
        lastSavedRef.current.content === content
    ) {
        return;
    }

    setSaveStatus('unsaved');

    const handler = setTimeout(() => {
      setSaveStatus('saving');
      
      const dataToSave = { 
          title, 
          content, 
          lastModified: new Date().toISOString() 
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      lastSavedRef.current = { title, content };
      
      // Small artificial delay so user sees "Saving..." briefly
      setTimeout(() => setSaveStatus('saved'), 600);
    }, 2000); // 2 second debounce

    return () => clearTimeout(handler);
  }, [content, title]);

  // --- Handlers ---

  // Handle Selection Change from RichEditor
  const handleSelectionChange = useCallback((rect: DOMRect | null, text: string) => {
    if (rect && text) {
        setSelectedText(text);
        setMenuPosition({
            x: rect.left,
            y: rect.bottom + window.scrollY
        });
    } else {
        setMenuPosition(null);
        setSelectedText('');
    }
  }, []);

  // Handle Text File Download
  const handleDownload = () => {
    if (!editorRef.current) return;
    
    // Simple text conversion: Get innerText. 
    // For a more robust app, we might convert HTML to Markdown.
    const textContent = editorRef.current.innerText;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set filename
    const filename = title.trim() ? `${title.trim()}.txt` : 'draft.txt';
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // AI: Generate New Draft
  const handleDraftSubmit = async (prompt: string, files: FileAttachment[]) => {
    setIsGenerating(true);
    setContent(''); // Clear previous
    
    try {
      await generateDraftStream(prompt, files, appSettings, (chunk) => {
        setContent(prev => prev + chunk);
        // Auto scroll to bottom during generation
        if (editorRef.current) {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      });
      setDraftDialogOpen(false);
    } catch (e) {
      alert("Failed to generate draft. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  // AI: Rewrite Selection
  const handleRewrite = async (mode: RewriteMode, customPrompt?: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const originalText = selection.toString();
    const fullText = editorRef.current?.innerText || "";
    
    let instruction = "";
    switch(mode) {
      case RewriteMode.IMPROVE: instruction = "Improve clarity, flow, and grammar."; break;
      case RewriteMode.SHORTEN: instruction = "Shorten this text significantly while keeping key info."; break;
      case RewriteMode.EXPAND: instruction = "Expand on this with more detail and descriptive language."; break;
      case RewriteMode.TONE_PROFESSIONAL: instruction = "Rewrite to sound more professional and authoritative."; break;
      case RewriteMode.CUSTOM: instruction = customPrompt || "Improve this."; break;
    }

    setIsMagicStreaming(true);

    // Prepare for streaming replacement
    // We insert a temporary span to stream results into
    range.deleteContents();
    const span = document.createElement('span');
    span.className = "bg-purple-50 text-purple-900 border-b-2 border-purple-200 animate-pulse";
    range.insertNode(span);
    
    // Collapse selection to end to avoid messing up typing if user tries to interrupt (blocking input would be better but simple for now)
    selection.removeAllRanges();

    try {
      let accumulatedHtml = "";
      await rewriteSelectionStream(originalText, fullText, instruction, appSettings, (chunk) => {
        accumulatedHtml += chunk;
        span.innerHTML = accumulatedHtml;
      });

      // Finalize: Replace the temporary span with the actual HTML content
      // We need to parse the accumulated HTML and replace the span with those nodes
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = accumulatedHtml;
      
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      
      if (span.parentNode) {
        span.parentNode.replaceChild(fragment, span);
      }
      
      // Update React state to match DOM
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }

      setMenuPosition(null);

    } catch (e) {
      console.error(e);
      alert("Error rewriting text");
      // Revert if possible or just leave as is (could implement undo here)
      if (span.parentNode) {
          span.textContent = originalText; // Fallback
      }
    } finally {
      setIsMagicStreaming(false);
    }
  };

  // Sidebar Toggle
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Render Save Indicator
  const renderSaveStatus = () => {
      switch(saveStatus) {
          case 'saving':
              return (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving...
                  </span>
              );
          case 'saved':
              return (
                  <span className="flex items-center gap-1.5 text-xs text-green-600/70 transition-colors duration-500">
                      <Cloud className="w-3 h-3" />
                      Saved
                  </span>
              );
          case 'unsaved':
          default:
              return (
                <span className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Cloud className="w-3 h-3" />
                    Unsaved
                </span>
              );
      }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      
      {/* Sidebar */}
      <div 
        className={`${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'} bg-slate-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 relative z-20`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 h-16">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-slate-800 tracking-tight">Gemini Writer</span>
        </div>

        <div className="p-3">
            <button 
                onClick={() => setDraftDialogOpen(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700 hover:shadow-md transition-all group"
            >
                <Plus className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                New Smart Draft
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Recent</h3>
            {/* Mock History Items */}
            <div className="group flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-md hover:bg-white hover:shadow-sm cursor-pointer transition-all">
                <FileText className="w-4 h-4 text-slate-400 group-hover:text-purple-500" />
                <span className="truncate">Project Titan Proposal</span>
            </div>
            <div className="group flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-md hover:bg-white hover:shadow-sm cursor-pointer transition-all">
                <FileText className="w-4 h-4 text-slate-400 group-hover:text-purple-500" />
                <span className="truncate">Q3 Marketing Strategy</span>
            </div>
             <div className="group flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-md hover:bg-white hover:shadow-sm cursor-pointer transition-all">
                <FileText className="w-4 h-4 text-slate-400 group-hover:text-purple-500" />
                <span className="truncate">Blog: AI Future</span>
            </div>
        </div>

        <div className="p-4 border-t border-gray-100 text-xs text-center text-slate-400">
            Powered by Google Gemini
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
        
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-transparent hover:border-gray-100 transition-colors shrink-0 z-10">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-700 transition-colors">
                    {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1"></div>
                <div className="flex flex-col">
                    <span className="text-sm text-slate-800 font-medium leading-none">
                        {isGenerating ? 'Generating Draft...' : (title || 'Untitled Document')}
                    </span>
                    <div className="mt-1">
                        {renderSaveStatus()}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <Tooltip content="Download as TXT">
                    <button 
                        onClick={handleDownload}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </Tooltip>
                 <Tooltip content="Settings">
                    <button 
                        onClick={() => setSettingsOpen(true)}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </Tooltip>
                 <button className="ml-2 flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                    Publish
                </button>
            </div>
        </header>

        {/* Editor Area */}
        <main className="flex-1 overflow-y-auto relative flex justify-center bg-white">
            <div className="w-full max-w-3xl px-8 py-12 pb-32">
                 {/* Title Input */}
                 <input 
                    type="text" 
                    placeholder="Document Title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-4xl font-serif font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 focus:outline-none bg-transparent mb-6"
                 />
                 
                {/* Rich Editor */}
                <RichEditor 
                    editorRef={editorRef}
                    content={content}
                    onChange={setContent}
                    onSelectionChange={handleSelectionChange}
                    isGenerating={isGenerating}
                />
            </div>
        </main>

        {/* Magic Menu (Floating) */}
        <MagicMenu 
            position={menuPosition} 
            selectedText={selectedText}
            onRewrite={handleRewrite}
            onClose={() => setMenuPosition(null)}
            isStreaming={isMagicStreaming}
        />

        {/* Dialogs */}
        <DraftDialog 
            isOpen={isDraftDialogOpen} 
            onClose={() => setDraftDialogOpen(false)} 
            onSubmit={handleDraftSubmit}
            isGenerating={isGenerating}
        />

        <SettingsDialog
            isOpen={isSettingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={appSettings}
            onSave={setAppSettings}
        />
        
      </div>
    </div>
  );
};

export default App;