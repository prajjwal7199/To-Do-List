import React, { useState } from "react";
import { Box, Typography, Paper, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../redux/store";
import type { Task } from "../types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { assignDate } from "../redux/slices/tasksSlice";

export default function CalendarView() {
  const tasks = useSelector((s: RootState) => (s.tasks as any).items as Task[]);
  const dispatch = useDispatch();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad with previous/next month days to fill grid
  const startDay = monthStart.getDay();
  const paddedDays = [...Array(startDay).fill(null), ...days];

  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return tasks.filter((t: Task) => t.date === dateStr);
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(format(date, "yyyy-MM-dd"));
  };

  const selectedTasks = selectedDate
    ? tasks.filter((t: Task) => t.date === selectedDate)
    : [];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          📆 Calendar View
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6">
            {format(currentMonth, "MMMM yyyy")}
          </Typography>
          <IconButton
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}
      >
        {/* Weekday headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Box key={day}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, textAlign: "center", display: "block" }}
            >
              {day}
            </Typography>
          </Box>
        ))}

        {/* Calendar days */}
        {paddedDays.map((date, index) => {
          const tasksForDay = getTasksForDate(date);
          const completedCount = tasksForDay.filter(
            (t: Task) => t.completed,
          ).length;
          const isSelected =
            date && selectedDate === format(date, "yyyy-MM-dd");
          const isTodayDate = date && isToday(date);

          return (
            <Box key={index}>
              <Paper
                sx={{
                  p: 1,
                  minHeight: 80,
                  cursor: date ? "pointer" : "default",
                  bgcolor: isSelected
                    ? "rgba(59, 130, 246, 0.2)"
                    : "transparent",
                  border: isTodayDate
                    ? "2px solid #3b82f6"
                    : "1px solid rgba(255,255,255,0.1)",
                  opacity: date && !isSameMonth(date, currentMonth) ? 0.3 : 1,
                  "&:hover": date ? { bgcolor: "rgba(255,255,255,0.05)" } : {},
                }}
                onClick={() => handleDateClick(date)}
              >
                {date && (
                  <>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: isTodayDate ? 700 : 400 }}
                    >
                      {format(date, "d")}
                    </Typography>
                    {tasksForDay.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {completedCount}/{tasksForDay.length}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            flexWrap: "wrap",
                            mt: 0.5,
                          }}
                        >
                          {tasksForDay.slice(0, 3).map((t: Task) => (
                            <Box
                              key={t.id}
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                bgcolor: t.completed ? "#10b981" : "#ef4444",
                              }}
                            />
                          ))}
                          {tasksForDay.length > 3 && (
                            <Typography variant="caption">
                              +{tasksForDay.length - 3}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Box>
          );
        })}
      </Box>

      {/* Selected date details */}
      {selectedDate && (
        <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tasks for {new Date(selectedDate).toLocaleDateString()}
          </Typography>
          {selectedTasks.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {selectedTasks.map((task: Task) => (
                <Box
                  key={task.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: task.completed ? "#10b981" : "#ef4444",
                    }}
                  />
                  <Typography
                    sx={{
                      flex: 1,
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </Typography>
                  {task.category && (
                    <Typography variant="caption" color="text.secondary">
                      {task.category}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">
              No tasks for this date
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
