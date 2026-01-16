import React from "react";
import { Box } from "@mui/material";
import type { Task } from "../types";
import TaskCard from "./TaskCard";

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
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {tasks.map((t, i) => (
        <TaskCard
          key={t.id ?? `task-${i}`}
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
      ))}
    </Box>
  );
}
