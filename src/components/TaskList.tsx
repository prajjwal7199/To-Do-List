import React from "react";
import { Box } from "@mui/material";
import type { Task } from "../types";
import TaskCard from "./TaskCard";
import { useDispatch } from "react-redux";
import { setOrders } from "../redux/slices/tasksSlice";

type Props = {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
  onAddToDate?: (id: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onEditSubtask?: (taskId: string, subtaskId: string, title: string) => void;
};

export default function TaskList({
  tasks,
  onDelete,
  onEdit,
  onToggle,
  onAddToDate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
}: Props) {
  const dispatch = useDispatch();
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const sorted = React.useMemo(() => {
    return tasks.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [tasks]);

  function handleDrop(targetIndex: number) {
    if (!dragId) return;
    const srcIndex = sorted.findIndex((t) => t.id === dragId);
    if (srcIndex === -1) return;
    const arr = sorted.slice();
    const [moved] = arr.splice(srcIndex, 1);
    arr.splice(targetIndex, 0, moved);
    const orders = arr.map((t, i) => ({ id: t.id, order: i }));
    dispatch(setOrders(orders));
    setDragId(null);
    setDragOverIndex(null);
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {sorted.map((t, i) => (
        <div
          key={t.id ?? `task-${i}`}
          draggable
          onDragStart={(e) => {
            setDragId(t.id);
            try {
              e.dataTransfer?.setData("text/plain", t.id);
            } catch (e) {}
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverIndex(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(i);
          }}
        >
          <TaskCard
            task={t}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggle={onToggle}
            onAddToDate={onAddToDate}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onEditSubtask={onEditSubtask}
          />
        </div>
      ))}
    </Box>
  );
}
