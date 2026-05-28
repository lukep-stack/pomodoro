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
import { activityListAtom } from "../../atoms";
import Button from "../Button/Button";
import "./ActivitySettings.css";

interface ActivitySettingsProps {
  onClose: () => void;
}

interface SortableActivityItemProps {
  id: number;
  activity: string;
  isEditing: boolean;
  editingValue: string;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCommitEdit: () => void;
  onRemove: () => void;
}

function SortableActivityItem({
  id,
  activity,
  isEditing,
  editingValue,
  onStartEdit,
  onEditChange,
  onEditKeyDown,
  onCommitEdit,
  onRemove,
}: SortableActivityItemProps) {
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
    <div className="activity-item" ref={setNodeRef} style={style}>
      <span className="activity-drag-handle" {...attributes} {...listeners}>
        ⠿
      </span>

      {isEditing ? (
        <input
          className="activity-inline-input"
          value={editingValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={onEditKeyDown}
          onBlur={onCommitEdit}
          maxLength={40}
          autoFocus
        />
      ) : (
        <span
          className="activity-name"
          onClick={onStartEdit}
          title="Click to edit"
        >
          {activity}
        </span>
      )}

      <Button
        variant="ghost"
        size="xs"
        color="danger"
        onClick={onRemove}
        aria-label={`Remove ${activity}`}
      >
        ✕
      </Button>
    </div>
  );
}

export default function ActivitySettings({ onClose }: ActivitySettingsProps) {
  const [activities, setActivities] = useAtom(activityListAtom);
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activityIds = activities.map((_, i) => i);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setActivities((prev) =>
      arrayMove(prev, active.id as number, over.id as number),
    );
  }

  function startEdit(i: number) {
    setEditingIndex(i);
    setEditingValue(activities[i]);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (trimmed) {
      setActivities((prev) =>
        prev.map((a, i) => (i === editingIndex ? trimmed : a)),
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

  const addActivity = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setActivities((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const removeActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addActivity();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-panel">
        <h2>Break Activities</h2>

        <div className="activity-list">
          {activities.length === 0 && (
            <p className="activity-empty">No activities yet. Add some below!</p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activityIds}
              strategy={verticalListSortingStrategy}
            >
              {activities.map((activity, i) => (
                <SortableActivityItem
                  key={i}
                  id={i}
                  activity={activity}
                  isEditing={editingIndex === i}
                  editingValue={editingValue}
                  onStartEdit={() => startEdit(i)}
                  onEditChange={setEditingValue}
                  onEditKeyDown={handleEditKeyDown}
                  onCommitEdit={commitEdit}
                  onRemove={() => removeActivity(i)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="activity-add-row">
          <input
            type="text"
            className="activity-input"
            placeholder="New activity..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={40}
            autoFocus={editingIndex === null}
          />
          <Button variant="solid" size="sm" color="dark" onClick={addActivity}>
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
