import { useState, useRef, useEffect } from 'react';
import { BoardItem, MAX_INDENT, MIN_INDENT, createBoardItem } from '@/lib/board-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Download, FileText, Trash2, Volume2, Square } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { toast } from 'sonner';

interface BoardEditorProps {
  initialItems?: BoardItem[];
  onSave?: (items: BoardItem[]) => void;
}

export default function BoardEditor({ initialItems, onSave }: BoardEditorProps) {
  const [items, setItems] = useState<BoardItem[]>(initialItems || [createBoardItem()]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const { isRecording, startRecording, stopRecording, transcript, resetTranscript, error } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
  const lastTranscriptRef = useRef('');

  // Handle speech recognition updates
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      const newText = transcript.substring(lastTranscriptRef.current.length).trim();
      if (newText) {
        // Add new item with current text
        setItems(prev => {
          const newItems = [...prev];
          // If the last item is empty, update it, otherwise add new
          const lastItem = newItems[newItems.length - 1];
          if (lastItem && lastItem.text.trim() === '') {
            newItems[newItems.length - 1] = { ...lastItem, text: newText };
          } else {
            newItems.push(createBoardItem(newText, 0));
          }
          return newItems;
        });
      }
      lastTranscriptRef.current = transcript;
    }
  }, [transcript]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Auto-save effect
  useEffect(() => {
    if (onSave) {
      onSave(items);
    }
  }, [items, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newItem = createBoardItem('', items[index].indent);
      const newItems = [...items];
      newItems.splice(index + 1, 0, newItem);
      setItems(newItems);
      setTimeout(() => {
        const nextInput = document.getElementById(`item-${newItem.id}`);
        nextInput?.focus();
      }, 0);
    } else if (e.key === 'Backspace' && items[index].text === '' && items.length > 1) {
      e.preventDefault();
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setTimeout(() => {
        const prevInput = document.getElementById(`item-${items[index - 1]?.id}`);
        prevInput?.focus();
      }, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const newIndent = e.shiftKey
        ? Math.max(MIN_INDENT, items[index].indent - 1)
        : Math.min(MAX_INDENT, items[index].indent + 1);
      
      const newItems = [...items];
      newItems[index] = { ...newItems[index], indent: newIndent };
      setItems(newItems);
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(`item-${items[index - 1].id}`);
      prevInput?.focus();
    } else if (e.key === 'ArrowDown' && index < items.length - 1) {
      e.preventDefault();
      const nextInput = document.getElementById(`item-${items[index + 1].id}`);
      nextInput?.focus();
    }
  };

  const updateItemText = (id: string, text: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, text } : item));
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      toast.info('Recording stopped');
    } else {
      resetTranscript();
      lastTranscriptRef.current = '';
      startRecording();
      toast.success('Recording started');
    }
  };

  const clearBoard = () => {
    if (confirm('Are you sure you want to clear the board?')) {
      setItems([createBoardItem()]);
      resetTranscript();
      lastTranscriptRef.current = '';
      toast.success('Board cleared');
    }
  };

  const exportMarkdown = () => {
    const markdown = items.map(item => {
      const prefix = '  '.repeat(item.indent) + '- ';
      return `${prefix}${item.text}`;
    }).join('\n');
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-notes-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Markdown exported');
  };

  const readAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const fullText = items.map(item => item.text).join('. ');
      speak(fullText);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-background/80 backdrop-blur-sm py-4 z-10 border-b border-border/40">
        <h1 className="text-2xl font-light tracking-tight text-foreground/80">Meeting Board</h1>
        <div className="flex gap-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            onClick={toggleRecording}
            className={cn("rounded-full transition-all duration-500", isRecording && "animate-pulse")}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={readAloud} title={isSpeaking ? "Stop Reading" : "Read Aloud"} className="rounded-full">
            {isSpeaking ? <Square className="h-4 w-4 fill-current" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={exportMarkdown} title="Export Markdown" className="rounded-full">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={clearBoard} title="Clear Board" className="rounded-full hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 font-sans">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "group flex items-start transition-all duration-200 ease-out",
              "hover:bg-accent/30 rounded-md -ml-2 pl-2 py-1"
            )}
            style={{ paddingLeft: `${(item.indent * 1.5) + 0.5}rem` }}
          >
            <div className="mt-2.5 mr-2 w-1.5 h-1.5 rounded-full bg-foreground/20 group-hover:bg-foreground/40 transition-colors" />
            <input
              id={`item-${item.id}`}
              value={item.text}
              onChange={(e) => updateItemText(item.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setActiveItemId(item.id)}
              onBlur={() => setActiveItemId(null)}
              className={cn(
                "flex-1 bg-transparent border-none outline-none text-lg text-foreground/90 placeholder:text-muted-foreground/50",
                "transition-all duration-200",
                item.indent === 0 && "font-medium text-xl",
                item.indent > 0 && "font-normal text-base text-foreground/80"
              )}
              placeholder="Type or speak..."
              autoComplete="off"
            />
          </div>
        ))}
      </div>
      
      {isRecording && (
        <div className="fixed bottom-8 right-8 bg-card/90 backdrop-blur border border-border/50 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Listening...
        </div>
      )}
    </div>
  );
}
