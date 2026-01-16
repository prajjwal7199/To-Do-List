import React from "react";
import { Box, Typography, Paper, LinearProgress } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { Task, Category, CompletionRecord } from "../types";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function AnalyticsDashboard() {
  const analytics = useSelector((s: RootState) => (s.tasks as any).analytics);
  const categories = useSelector(
    (s: RootState) => (s.tasks as any).categories as Category[],
  );
  const tasks = useSelector((s: RootState) => (s.tasks as any).items as Task[]);

  // Calculate today's tasks
  const today = new Date().toDateString();
  const todayTasks = tasks.filter(
    (t: Task) => t.date && new Date(t.date).toDateString() === today,
  );
  const completedToday = todayTasks.filter((t: Task) => t.completed).length;
  const totalToday = todayTasks.length;
  const completionRate =
    totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  // Get streak
  const currentStreak = analytics?.streaks?.current || 0;

  // Calculate total time tracked
  const totalMinutes = analytics?.timeTracking?.totalMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Calculate 7-day average
  const last7Days = (analytics?.completionHistory || []).slice(
    -7,
  ) as CompletionRecord[];
  const avg7Day =
    last7Days.length > 0
      ? (
          last7Days.reduce(
            (sum: number, day: CompletionRecord) => sum + day.completed,
            0,
          ) / last7Days.length
        ).toFixed(1)
      : "0.0";

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        📊 Analytics Dashboard
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Today's Progress */}
        <Paper
          sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(59, 130, 246, 0.1)" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CheckCircleIcon sx={{ color: "#3b82f6" }} />
            <Typography variant="subtitle2" color="text.secondary">
              Today's Progress
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {completedToday}/{totalToday}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={completionRate}
            sx={{ mb: 1 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            {completionRate.toFixed(0)}% complete
          </Typography>
        </Paper>

        {/* Current Streak */}
        <Paper
          sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(239, 68, 68, 0.1)" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <LocalFireDepartmentIcon sx={{ color: "#ef4444" }} />
            <Typography variant="subtitle2" color="text.secondary">
              Current Streak
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {currentStreak}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentStreak === 1 ? "day" : "days"}
          </Typography>
        </Paper>

        {/* Time Tracked */}
        <Paper
          sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(245, 158, 11, 0.1)" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <AccessTimeIcon sx={{ color: "#f59e0b" }} />
            <Typography variant="subtitle2" color="text.secondary">
              Time Tracked
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {hours}h {minutes}m
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total time on tasks
          </Typography>
        </Paper>

        {/* 7-Day Average */}
        <Paper
          sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(139, 92, 246, 0.1)" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <TrendingUpIcon sx={{ color: "#8b5cf6" }} />
            <Typography variant="subtitle2" color="text.secondary">
              7-Day Average
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {avg7Day}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tasks/day
          </Typography>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 3,
        }}
      >
        {/* Category Breakdown */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            📊 Category Breakdown
          </Typography>
          {categories.map((cat: Category) => {
            const categoryTasks = tasks.filter(
              (t: Task) => t.category === cat.id,
            );
            const categoryCompleted = categoryTasks.filter(
              (t: Task) => t.completed,
            ).length;
            const categoryTotal = categoryTasks.length;
            const categoryProgress =
              categoryTotal > 0 ? (categoryCompleted / categoryTotal) * 100 : 0;

            return (
              <Box key={cat.id} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2">{cat.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {categoryCompleted}/{categoryTotal}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={categoryProgress}
                  sx={{
                    bgcolor: `${cat.color}20`,
                    "& .MuiLinearProgress-bar": { bgcolor: cat.color },
                  }}
                />
              </Box>
            );
          })}
        </Paper>

        {/* Completion History */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            📈 Completion History
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
              height: 200,
            }}
          >
            {last7Days.map((day: CompletionRecord, idx: number) => {
              const maxCompleted = Math.max(
                ...last7Days.map((d: CompletionRecord) => d.completed),
                1,
              );
              const height = (day.completed / maxCompleted) * 100;

              return (
                <Box
                  key={idx}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: `${height}%`,
                      bgcolor: "primary.main",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {day.completed}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
