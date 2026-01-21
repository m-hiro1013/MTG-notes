import BoardEditor from "@/components/BoardEditor";
import { useEffect, useState } from "react";
import { BoardItem } from "@/lib/board-types";

const STORAGE_KEY = 'meeting-board-data';

export default function Home() {
  const [initialItems, setInitialItems] = useState<BoardItem[] | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setInitialItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved board data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const handleSave = (items: BoardItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <BoardEditor initialItems={initialItems} onSave={handleSave} />
    </div>
  );
}
