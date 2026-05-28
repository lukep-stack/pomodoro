import { useState } from "react";
import { useAtom } from "jotai";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { choreListAtom } from "../../atoms";
import Button from "../Button/Button";
import "./ChoreSettings.css";

interface ChoreSettingsProps {
  onClose: () => void;
}

interface SortableChoreItemProps {
  id: number;
  chore: string;
  isEditing: boolean;
  editingValue: string;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCommitEdit: () => void;
  onRemove: () => void;
}

function SortableChoreItem({
  id,
  chore,
  isEditing,
  editingValue,
  onStartEdit,
  onEditChange,
  onEditKeyDown,
  onCommitEdit,
  onRemove,
}: SortableChoreItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div className="chore-item" ref={setNodeRef} style={style}>
      <span className="chore-drag-handle" {...attributes} {...listeners}>
        ⠿
      </span>

      {isEditing ? (
        <input
          className="chore-inline-input"
          value={editingValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={onEditKeyDown}
          onBlur={onCommitEdit}
          maxLength={40}
          autoFocus
        />
      ) : (
        <span
          className="chore-name"
          onClick={onStartEdit}
          title="Click to edit"
        >
          {chore}
        </span>
      )}

      <Button
        variant="ghost"
        size="xs"
        color="danger"
        onClick={onRemove}
        aria-label={`Remove ${chore}`}
      >
        ✕
      </Button>
    </div>
  );
}

export default function ChoreSettings({ onClose }: ChoreSettingsProps) {
  const [chores, setChores] = useAtom(choreListAtom);
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const choreIds = chores.map((_, i) => i);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setChores((prev) =>
      arrayMove(prev, active.id as number, over.id as number),
    );
  }

  function startEdit(i: number) {
    setEditingIndex(i);
    setEditingValue(chores[i]);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (trimmed) {
      setChores((prev) =>
        prev.map((c, i) => (i === editingIndex ? trimmed : c)),
      );
    }
    setEditingIndex(null);
    setEditingValue("");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditingValue("");
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") cancelEdit();
  }

  const addChore = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setChores((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const removeChore = (index: number) => {
    setChores((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addChore();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-panel">
        <h2>Break Activities</h2>

        <div className="chore-list">
          {chores.length === 0 && (
            <p className="chore-empty">No chores yet. Add some below!</p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={choreIds}
              strategy={verticalListSortingStrategy}
            >
              {chores.map((chore, i) => (
                <SortableChoreItem
                  key={i}
                  id={i}
                  chore={chore}
                  isEditing={editingIndex === i}
                  editingValue={editingValue}
                  onStartEdit={() => startEdit(i)}
                  onEditChange={setEditingValue}
                  onEditKeyDown={handleEditKeyDown}
                  onCommitEdit={commitEdit}
                  onRemove={() => removeChore(i)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="chore-add-row">
          <input
            type="text"
            className="chore-input"
            placeholder="New activity..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={40}
            autoFocus={editingIndex === null}
          />
          <Button variant="solid" size="sm" color="dark" onClick={addChore}>
            Add
          </Button>
        </div>

        <div className="settings-actions">
          <Button variant="solid" size="sm" color="dark" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
