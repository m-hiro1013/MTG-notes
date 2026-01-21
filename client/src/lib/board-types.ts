export interface BoardItem {
  id: string;
  text: string;
  indent: number; // 0 to 4
  isEditing: boolean;
}

export const MAX_INDENT = 4;
export const MIN_INDENT = 0;

export function createBoardItem(text: string = '', indent: number = 0): BoardItem {
  return {
    id: crypto.randomUUID(),
    text,
    indent,
    isEditing: false,
  };
}
