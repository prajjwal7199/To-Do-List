import React, { useMemo, useState } from "react";
import { Box, TextField, IconButton, Typography, Tooltip, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AddIcon from "@mui/icons-material/Add";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import {
  addTask,
  deleteTask,
  toggleComplete,
  editTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  editSubtask,
  setOrders,
} from "../redux/slices/tasksSlice";
import TaskList from "./TaskList";
import { Task } from "../types";
import { parseISO, format as fmt, isToday, isTomorrow } from "date-fns";

type Props = { date: string; search?: string };

export default function DateTaskList({ date, search }: Props) {
  const rawTasks = useSelector((s: any) => s.tasks?.items ?? []) as unknown;
  const tasks: Task[] = Array.isArray(rawTasks)
    ? (rawTasks as Task[])
    : Object.values(rawTasks as Record<string, Task>);
  const dispatch = useDispatch();

  // selected date + view mode (day only / selected+future / +/- neighbors)
  const [selectedDate, setSelectedDate] = useState<Date | null>(date ? parseISO(date) : new Date());
  const [viewMode, setViewMode] = useState<"day" | "future" | "around">("future");

  // include tasks for the selected date and based on viewMode
  const grouped = useMemo(() => {
    if (!selectedDate) return [] as [string, Task[]][];
    const selectedStr = fmt(selectedDate, "yyyy-MM-dd");
    const q = search ? search.toLowerCase() : "";
    const filtered = tasks.filter((t) => t.date && !t.dependsOn).filter((t) => {
      if (q && q.trim()) {
        const s = (t.title || "") + " " + (t.description || "");
        if (!s.toLowerCase().includes(q)) return false;
      }
      const d = t.date!;
      if (viewMode === "day") return d === selectedStr;
      if (viewMode === "future") return d >= selectedStr;
      // around: include 3 days before and after
      if (viewMode === "around") {
        const dt = parseISO(d);
        const diff = Math.floor((dt.getTime() - selectedDate.getTime()) / 86400000);
        return Math.abs(diff) <= 3;
      }
      return false;
    });
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      const d = t.date as string;
      const arr = map.get(d) || [];
      arr.push(t);
      map.set(d, arr);
    }
    const entries = Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return entries;
  }, [tasks, selectedDate, viewMode, search]);

  const [title, setTitle] = useState("");

  function handleAdd() {
    if (!title.trim()) return;
    dispatch(addTask({ title: title.trim(), date }));
    setTitle("");
  }

  function handleEdit(taskId: string) {
    const t = tasks.find((x) => x.id === taskId);
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
      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
        <DatePicker
          label="Date"
          value={selectedDate}
          onChange={(d: any) => setSelectedDate(d)}
          slotProps={{ textField: { size: "small" } }}
        />
        <FormControl size="small">
          <InputLabel id="view-mode-label">View</InputLabel>
          <Select
            labelId="view-mode-label"
            value={viewMode}
            label="View"
            onChange={(e) => setViewMode(e.target.value as any)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="day">Only selected day</MenuItem>
            <MenuItem value="future">Selected and future</MenuItem>
            <MenuItem value="around">Selected ±3 days</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          fullWidth
          size="small"
          placeholder="New task"
          sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 1 }}
        />
        <Tooltip title="Add task">
          <IconButton color="primary" onClick={handleAdd} aria-label="add task">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      {grouped.length === 0 ? (
        <Typography color="text.secondary">
          No tasks for this date or future dates
        </Typography>
      ) : (
        grouped.map(([d, list]) => (
          <Box key={d} sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "text.primary", fontWeight: 700 }}
            >
              {isToday(parseISO(d))
                ? `Today — ${fmt(parseISO(d), "PPP")}`
                : isTomorrow(parseISO(d))
                  ? `Tomorrow — ${fmt(parseISO(d), "PPP")}`
                  : fmt(parseISO(d), "PPP")}
            </Typography>
            <TaskList
              tasks={list}
              onDelete={(id) => dispatch(deleteTask(id))}
              onEdit={handleEdit}
              onToggle={(id) => {
                const t = list.find((x) => x.id === id);
                if (
                  t &&
                  t.dependsOn &&
                  t.availableAt &&
                  new Date(t.availableAt) > new Date()
                )
                  return;
                dispatch(toggleComplete(id));
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
          </Box>
        ))
      )}
    </Box>
  );
}
