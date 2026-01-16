import React from "react";
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../redux/store";
import type { Task } from "../types";
import { toggleComplete } from "../redux/slices/tasksSlice";

export default function EisenhowerMatrix() {
  const dispatch = useDispatch();
  const tasks = useSelector((s: RootState) => (s.tasks as any).items as Task[]);

  const doFirst = tasks.filter(
    (t: Task) => !t.completed && t.urgent && t.important,
  );
  const schedule = tasks.filter(
    (t: Task) => !t.completed && !t.urgent && t.important,
  );
  const delegate = tasks.filter(
    (t: Task) => !t.completed && t.urgent && !t.important,
  );
  const eliminate = tasks.filter(
    (t: Task) => !t.completed && !t.urgent && !t.important,
  );

  const renderTaskList = (taskList: Task[], color: string) => (
    <Box>
      {taskList.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No tasks
        </Typography>
      ) : (
        taskList.map((task: Task) => (
          <FormControlLabel
            key={task.id}
            control={
              <Checkbox
                checked={task.completed}
                onChange={() => dispatch(toggleComplete(task.id))}
                sx={{ color }}
              />
            }
            label={task.title}
            sx={{ display: "block", mb: 1 }}
          />
        ))
      )}
    </Box>
  );
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        🎯 Eisenhower Matrix
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Organize tasks by urgency and importance
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        {/* Urgent & Important - Do First */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "rgba(239, 68, 68, 0.1)",
            border: "2px solid #ef4444",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#ef4444", fontWeight: 700 }}
          >
            🔥 Do First
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2 }}
          >
            Urgent & Important
          </Typography>
          {renderTaskList(doFirst, "#ef4444")}
        </Paper>

        {/* Important but not Urgent - Schedule */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "rgba(59, 130, 246, 0.1)",
            border: "2px solid #3b82f6",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#3b82f6", fontWeight: 700 }}
          >
            📅 Schedule
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2 }}
          >
            Important but not Urgent
          </Typography>
          {renderTaskList(schedule, "#3b82f6")}
        </Paper>

        {/* Urgent but not Important - Delegate */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "rgba(245, 158, 11, 0.1)",
            border: "2px solid #f59e0b",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#f59e0b", fontWeight: 700 }}
          >
            👥 Delegate
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2 }}
          >
            Urgent but not Important
          </Typography>
          {renderTaskList(delegate, "#f59e0b")}
        </Paper>

        {/* Neither - Eliminate */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "rgba(16, 185, 129, 0.1)",
            border: "2px solid #10b981",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#10b981", fontWeight: 700 }}
          >
            🗑️ Eliminate
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2 }}
          >
            Neither Urgent nor Important
          </Typography>
          {renderTaskList(eliminate, "#10b981")}
        </Paper>
      </Box>
    </Box>
  );
}
