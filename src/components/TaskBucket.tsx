import React, { useState } from "react";
import { Box, Typography, TextField, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../redux/store";
import { format } from "date-fns";
import { copyTaskToDate } from "../redux/slices/tasksSlice";
import TaskList from "./TaskList";
import {
  addTask,
  deleteTask,
  toggleComplete,
  editTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  editSubtask,
} from "../redux/slices/tasksSlice";

export default function TaskBucket() {
  const rawTasks = useSelector((s: any) => s.tasks?.items ?? []) as unknown;
  const tasks: any[] = Array.isArray(rawTasks)
    ? (rawTasks as any[])
    : Object.values(rawTasks as Record<string, any>);
  const dispatch = useDispatch();
  const unassigned = tasks.filter((t) => !t.date && !t.backlog);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  function handleAdd() {
    if (!title.trim()) return;
    dispatch(addTask({ title: title.trim(), description: desc.trim() }));
    setTitle("");
    setDesc("");
  }

  function handleEdit(tid: string) {
    const t = unassigned.find((x) => x.id === tid);
    if (!t) return;
    const newTitle = window.prompt("Edit task title", t.title);
    if (newTitle === null) return;
    const newDesc = window.prompt("Edit task description", t.description || "");
    dispatch(
      editTask({
        id: tid,
        changes: { title: newTitle, description: newDesc || "" },
      }),
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, color: "text.primary" }}>
        Task Bucket (Global)
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1 }}
      >
        These tasks are global and will be added to each new day automatically.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          size="small"
          placeholder="New bucket task"
          fullWidth
          sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 1 }}
        />
        <Tooltip title="Add bucket task">
          <IconButton
            color="primary"
            onClick={handleAdd}
            aria-label="add bucket task"
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <TextField
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        size="small"
        placeholder="Description (optional)"
        fullWidth
        sx={{ mb: 1, bgcolor: "rgba(255,255,255,0.02)", borderRadius: 1 }}
      />

      {unassigned.length === 0 ? (
        <Typography color="text.secondary">No bucket tasks</Typography>
      ) : (
        <TaskList
          tasks={unassigned}
          onDelete={(id) => dispatch(deleteTask(id))}
          onEdit={handleEdit}
          onToggle={(id) => dispatch(toggleComplete(id))}
          onAddToDate={(id) => {
            const today = format(new Date(), "yyyy-MM-dd");
            dispatch(copyTaskToDate({ id, date: today }));
          }}
          onAddSubtask={(taskId, title) =>
            dispatch(addSubtask({ taskId, title }))
          }
          onToggleSubtask={(taskId, subtaskId) =>
            dispatch(toggleSubtask({ taskId, subtaskId }))
          }
          onDeleteSubtask={(taskId, subtaskId) =>
            dispatch(deleteSubtask({ taskId, subtaskId }))
          }
          onEditSubtask={(taskId, subtaskId, title) =>
            dispatch(editSubtask({ taskId, subtaskId, title }))
          }
        />
      )}
    </Box>
  );
}
