
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
  Loader2,
  FileJson,
  FileCode,
  Printer,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { DraftDialog } from './components/DraftDialog';
import { MagicMenu } from './components/MagicMenu';
import { Tooltip } from './components/Tooltip';
import { RichEditor } from './components/RichEditor';
import { SettingsDialog } from './components/SettingsDialog';
import { RewriteMode, FileAttachment, AppSettings, DocumentMetadata } from './types';
import { generateDraftStream, rewriteSelectionStream } from './services/geminiService';
import { DEFAULT_SETTINGS } from './constants';
import { htmlToMarkdown } from './utils/converters';

const LEGACY_STORAGE_KEY = 'gemini_writer_doc_v1';
const RECENTS_KEY = 'gemini_writer_recents_v1';
const DOC_PREFIX = 'gemini_writer_doc_';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const App: React.FC = () => {
  // --- State ---
  const [docId, setDocId] = useState<string>(() => generateId());
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  
  const [recentDocs, setRecentDocs] = useState<DocumentMetadata[]>([]);
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDraftDialogOpen, setDraftDialogOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isExportMenuOpen, setExportMenuOpen] = useState(false);
  
  // Magic Menu State
  const [selectedText, setSelectedText] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [isMagicStreaming, setIsMagicStreaming] = useState(false);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef<{ id: string; title: string; content: string } | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Load Recent Docs List and Migrate Legacy Data
  useEffect(() => {
    // 1. Load Recents Index
    try {
      const savedRecents = localStorage.getItem(RECENTS_KEY);
      if (savedRecents) {
        setRecentDocs(JSON.parse(savedRecents));
      }
    } catch (e) {
      console.error("Failed to load recents", e);
    }

    // 2. Check for Legacy Single-Doc Data and Migrate if needed
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData) {
      try {
        const parsed = JSON.parse(legacyData);
        if (parsed.content || parsed.title) {
          const newId = generateId();
          const newDoc = {
            id: newId,
            title: parsed.title || 'Untitled Migration',
            content: parsed.content || '',
            lastModified: new Date().toISOString()
          };
          
          // Save in new format
          localStorage.setItem(`${DOC_PREFIX}${newId}`, JSON.stringify(newDoc));
          
          // Add to recents (deferred to next render cycle via state or manual update)
          const newMeta: DocumentMetadata = {
            id: newId,
            title: newDoc.title,
            lastModified: newDoc.lastModified,
            preview: newDoc.content.substring(0, 100).replace(/<[^>]*>/g, '')
          };
          
          setRecentDocs(prev => {
             const updated = [newMeta, ...prev];
             localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
             return updated;
          });

          // Load it
          setDocId(newId);
          setTitle(newDoc.title);
          setContent(newDoc.content);
          lastSavedRef.current = { id: newId, title: newDoc.title, content: newDoc.content };

          // Clear legacy
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return; // Stop further loading logic
        }
      } catch (e) {
        console.error("Migration failed", e);
      }
    }
    
    // 3. If no legacy migration, try to load the most recent doc if available, or just start blank
    const savedRecents = localStorage.getItem(RECENTS_KEY);
    if (savedRecents) {
        const list: DocumentMetadata[] = JSON.parse(savedRecents);
        if (list.length > 0) {
            loadDocument(list[0].id);
        }
    }
  }, []);

  // Save Document Function
  const saveDocument = useCallback(() => {
    const currentTitle = title.trim() || 'Untitled Document';
    const timestamp = new Date().toISOString();
    
    // 1. Save Content
    const docData = {
        id: docId,
        title: currentTitle,
        content: content,
        lastModified: timestamp
    };
    localStorage.setItem(`${DOC_PREFIX}${docId}`, JSON.stringify(docData));

    // 2. Update Recents Index
    setRecentDocs(prev => {
        // Remove existing entry for this ID if it exists
        const filtered = prev.filter(d => d.id !== docId);
        
        // Create new metadata
        // Strip HTML tags for preview
        const plainText = editorRef.current?.innerText || content.replace(/<[^>]*>/g, '') || '';
        const preview = plainText.substring(0, 60) + (plainText.length > 60 ? '...' : '');
        
        const newMeta: DocumentMetadata = {
            id: docId,
            title: currentTitle,
            lastModified: timestamp,
            preview
        };
        
        const updatedList = [newMeta, ...filtered];
        localStorage.setItem(RECENTS_KEY, JSON.stringify(updatedList));
        return updatedList;
    });

    lastSavedRef.current = { id: docId, title, content };
    setSaveStatus('saved');
  }, [docId, title, content]);

  // Auto-save Effect
  useEffect(() => {
    // Don't save if nothing changed or if just switched docs (handled by loadDocument)
    if (
        lastSavedRef.current && 
        lastSavedRef.current.id === docId &&
        lastSavedRef.current.title === title && 
        lastSavedRef.current.content === content
    ) {
        return;
    }

    setSaveStatus('unsaved');

    const handler = setTimeout(() => {
      setSaveStatus('saving');
      saveDocument();
    }, 2000); // 2 second debounce

    return () => clearTimeout(handler);
  }, [content, title, docId, saveDocument]);

  // Click outside listener for export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers ---

  const createNewDocument = () => {
      // Force save current if needed before switching
      if (saveStatus === 'unsaved') {
          saveDocument();
      }
      
      const newId = generateId();
      setDocId(newId);
      setTitle('');
      setContent('');
      lastSavedRef.current = { id: newId, title: '', content: '' };
      // Note: It will be added to recents list only after first auto-save or edit
  };

  const loadDocument = (id: string) => {
      if (id === docId) return;

      // Force save current before switching
      if (saveStatus === 'unsaved') {
          saveDocument();
      }

      try {
          const data = localStorage.getItem(`${DOC_PREFIX}${id}`);
          if (data) {
              const parsed = JSON.parse(data);
              setDocId(parsed.id);
              setTitle(parsed.title);
              setContent(parsed.content);
              lastSavedRef.current = { id: parsed.id, title: parsed.title, content: parsed.content };
              
              // Mobile/Sidebar UX: on mobile maybe close sidebar, but keeping open for now
          } else {
              console.error("Document data not found for id:", id);
              // Clean up ghost entry
              setRecentDocs(prev => {
                  const updated = prev.filter(d => d.id !== id);
                  localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
                  return updated;
              });
          }
      } catch (e) {
          console.error("Failed to load document", e);
      }
  };

  const deleteDocument = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to delete this document?")) return;

      // Remove from localStorage
      localStorage.removeItem(`${DOC_PREFIX}${id}`);
      
      // Update List
      setRecentDocs(prev => {
          const updated = prev.filter(d => d.id !== id);
          localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
          return updated;
      });

      // If we deleted the active doc, switch to another or new
      if (id === docId) {
          const remaining = recentDocs.filter(d => d.id !== id);
          if (remaining.length > 0) {
              loadDocument(remaining[0].id);
          } else {
              createNewDocument();
          }
      }
  };

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

  // Helper to trigger download
  const downloadFile = (data: string, filename: string, type: string) => {
      const blob = new Blob([data], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'txt' | 'md' | 'html' | 'pdf') => {
    setExportMenuOpen(false);
    const fileNameBase = title.trim() || 'draft';

    if (format === 'pdf') {
        window.print();
        return;
    }

    if (!editorRef.current) return;

    if (format === 'txt') {
        // Plain text
        const textContent = editorRef.current.innerText;
        downloadFile(textContent, `${fileNameBase}.txt`, 'text/plain');
    } else if (format === 'md') {
        // Markdown
        const html = editorRef.current.innerHTML;
        const markdown = htmlToMarkdown(html);
        downloadFile(markdown, `${fileNameBase}.md`, 'text/markdown');
    } else if (format === 'html') {
        // HTML
        const htmlBody = editorRef.current.innerHTML;
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
        h1 { font-size: 2.5em; margin-bottom: 0.5em; }
        h2 { font-size: 1.8em; margin-top: 1.5em; }
        img { max-width: 100%; height: auto; }
        blockquote { border-left: 4px solid #ddd; padding-left: 1em; margin-left: 0; color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${htmlBody}
</body>
</html>`;
        downloadFile(fullHtml, `${fileNameBase}.html`, 'text/html');
    }
  };

  // AI: Generate New Draft
  const handleDraftSubmit = async (prompt: string, files: FileAttachment[]) => {
    // If we are already editing a non-empty doc, create a new one first
    if (content.trim().length > 0 || title.trim().length > 0) {
        createNewDocument();
    }
    
    setIsGenerating(true);
    setDraftDialogOpen(false);
    
    // Set a temporary title based on prompt
    const tempTitle = prompt.split(' ').slice(0, 5).join(' ') + '...';
    setTitle(tempTitle);

    try {
      await generateDraftStream(prompt, files, appSettings, (chunk) => {
        setContent(prev => prev + chunk);
        // Auto scroll to bottom during generation
        if (editorRef.current) {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      });
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
    range.deleteContents();
    const span = document.createElement('span');
    span.className = "bg-purple-50 text-purple-900 border-b-2 border-purple-200 animate-pulse";
    range.insertNode(span);
    
    // Collapse selection to end
    selection.removeAllRanges();

    try {
      let accumulatedHtml = "";
      await rewriteSelectionStream(originalText, fullText, instruction, appSettings, (chunk) => {
        accumulatedHtml += chunk;
        span.innerHTML = accumulatedHtml;
      });

      // Finalize: Replace the temporary span with the actual HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = accumulatedHtml;
      
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      
      if (span.parentNode) {
        span.parentNode.replaceChild(fragment, span);
      }
      
      // Update React state
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }

      setMenuPosition(null);

    } catch (e) {
      console.error(e);
      alert("Error rewriting text");
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
        className={`${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full'} bg-slate-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 relative z-20 no-print`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 h-16 shrink-0">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-slate-800 tracking-tight">Gemini Writer</span>
        </div>

        <div className="p-3 shrink-0">
            <button 
                onClick={() => {
                  setDraftDialogOpen(true);
                  // Optional: if user cancels draft dialog, we remain on current doc. 
                  // If they submit, createNewDocument() is called inside submit handler.
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700 hover:shadow-md transition-all group"
            >
                <Plus className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                New Smart Draft
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent</h3>
                <button 
                    onClick={createNewDocument} 
                    className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-0.5 rounded transition-colors"
                >
                    + Blank
                </button>
            </div>
            
            {recentDocs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                    No recent documents
                </div>
            ) : (
                recentDocs.map((doc) => (
                    <div 
                        key={doc.id}
                        onClick={() => loadDocument(doc.id)}
                        className={`group relative flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                            doc.id === docId 
                            ? 'bg-white border-purple-200 shadow-sm' 
                            : 'border-transparent hover:bg-white hover:border-gray-100'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className={`w-3.5 h-3.5 ${doc.id === docId ? 'text-purple-500' : 'text-slate-400'}`} />
                                <span className={`text-sm font-medium truncate ${doc.id === docId ? 'text-purple-900' : 'text-slate-700'}`}>
                                    {doc.title || 'Untitled Document'}
                                </span>
                            </div>
                            <button 
                                onClick={(e) => deleteDocument(e, doc.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                title="Delete"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="text-xs text-slate-400 truncate pl-5.5">
                            {doc.preview || 'No content...'}
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-4 border-t border-gray-100 text-xs text-center text-slate-400 shrink-0">
            Powered by Google Gemini
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
        
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-transparent hover:border-gray-100 transition-colors shrink-0 z-10 no-print">
            <div className="flex items-center gap-4 min-w-0">
                <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-700 transition-colors shrink-0">
                    {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1 shrink-0"></div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm text-slate-800 font-medium leading-none truncate block">
                        {isGenerating ? 'Generating Draft...' : (title || 'Untitled Document')}
                    </span>
                    <div className="mt-1">
                        {renderSaveStatus()}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
                <div className="relative" ref={exportMenuRef}>
                    <Tooltip content="Export">
                        <button 
                            onClick={() => setExportMenuOpen(!isExportMenuOpen)}
                            className={`p-2 rounded-full transition-colors flex items-center gap-1 ${isExportMenuOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <Download className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </Tooltip>
                    
                    {isExportMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black/5 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                                Export As
                            </div>
                            <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3">
                                <FileText className="w-4 h-4" /> Text (.txt)
                            </button>
                            <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3">
                                <FileCode className="w-4 h-4" /> Markdown (.md)
                            </button>
                            <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3">
                                <FileJson className="w-4 h-4" /> HTML (.html)
                            </button>
                            <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3">
                                <Printer className="w-4 h-4" /> PDF / Print
                            </button>
                        </div>
                    )}
                </div>

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
            <div className="w-full max-w-3xl px-8 py-12 pb-32 print-content">
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
        <div className="no-print">
            <MagicMenu 
                position={menuPosition} 
                selectedText={selectedText}
                onRewrite={handleRewrite}
                onClose={() => setMenuPosition(null)}
                isStreaming={isMagicStreaming}
            />
        </div>

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
