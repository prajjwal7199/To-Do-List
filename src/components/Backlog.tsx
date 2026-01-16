import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import { useSelector, useDispatch } from "react-redux";
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
  assignDate,
} from "../redux/slices/tasksSlice";
import type { Task } from "../types";

export default function Backlog() {
  const tasks = useSelector((s: any) => s.tasks.items as Task[]);
  const dispatch = useDispatch();
  const backlog = tasks.filter((t) => t.backlog);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  // dialog to pick date when adding backlog item to a date
  const [pickOpen, setPickOpen] = useState(false);
  const [pickTaskId, setPickTaskId] = useState<string | null>(null);
  const [pickDate, setPickDate] = useState<Date | null>(null);

  function handleAdd() {
    if (!title.trim()) return;
    dispatch(
      addTask({ title: title.trim(), description: desc.trim(), backlog: true }),
    );
    // mark last added as backlog - simple strategy: find newest without date
    setTitle("");
    setDesc("");
  }

  // When adding a new task, mark it backlog via an edit after addTask; easier to rely on UI: user can mark backlog by editing later.
  // Provide a flow to schedule backlog into a date
  function openPickDialog(taskId: string) {
    setPickTaskId(taskId);
    setPickDate(new Date());
    setPickOpen(true);
  }

  function handleAssignToDate() {
    if (!pickTaskId || !pickDate) return;
    const dateStr = format(pickDate, "yyyy-MM-dd");
    dispatch(assignDate({ id: pickTaskId, date: dateStr }));
    setPickOpen(false);
    setPickTaskId(null);
  }

  function handleEdit(taskId: string) {
    const t = backlog.find((x) => x.id === taskId);
    if (!t) return;
    const newTitle = window.prompt("Edit task title", t.title);
    if (newTitle === null) return;
    const newDesc = window.prompt("Edit task description", t.description || "");
    dispatch(
      editTask({
        id: taskId,
        changes: { title: newTitle, description: newDesc || "" },
      }),
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, color: "text.primary" }}>
        Backlog
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1 }}
      >
        Long-term tasks. Use "+" to schedule them into any date later.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          size="small"
          placeholder="New backlog task"
          fullWidth
          sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 1 }}
        />
        <Tooltip title="Add backlog task">
          <IconButton
            color="primary"
            onClick={handleAdd}
            aria-label="add backlog task"
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

      {backlog.length === 0 ? (
        <Typography color="text.secondary">No backlog tasks</Typography>
      ) : (
        <TaskList
          tasks={backlog}
          onDelete={(id) => dispatch(deleteTask(id))}
          onEdit={handleEdit}
          onToggle={(id) => dispatch(toggleComplete(id))}
          onAddToDate={(id) => openPickDialog(id)}
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

      <Dialog open={pickOpen} onClose={() => setPickOpen(false)}>
        <DialogTitle>Assign to date</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <DatePicker
              label="Date"
              value={pickDate}
              onChange={(d: any) => setPickDate(d)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignToDate} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
