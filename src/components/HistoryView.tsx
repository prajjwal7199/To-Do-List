import React, { useMemo } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { Task } from "../types";

function getDateKey(d: string) {
  return d;
}

export default function HistoryView() {
  const tasks = useSelector((s: any) => s.tasks.items as any[]);
  const categories = useSelector((s: RootState) => s.tasks.categories as any[]);

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      // skip tasks without a date and skip dependent tasks (they are rendered inside their parent)
      if (!t.date || t.dependsOn) continue;
      const key = getDateKey(t.date);
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    }
    // sort dates descending
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [tasks]);

  if (byDate.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No history yet — bucket tasks will be copied into dates as time
          passes.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {byDate.map(([date, list]) => {
        const total = list.length;
        const completed = list.filter((t) => t.completed).length;
        const pct = total === 0 ? 0 : (completed / total) * 100;
        return (
          <Accordion
            key={date}
            defaultExpanded={false}
            sx={{
              bgcolor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "text.primary" }}
                  >
                    {date}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >{`${completed} / ${total} completed`}</Typography>
                </Box>
                <Box sx={{ width: 200 }}>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 10,
                      borderRadius: 99,
                      "& .MuiLinearProgress-bar": {
                        background: "linear-gradient(90deg,#7b61ff,#00d4ff)",
                      },
                    }}
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                        {list.map((t) => {
                          // derive a friendly status
                          const status = (() => {
                            if (t.undoneReason) return { label: "Cancelled", color: "warning" };
                            if (t.completed) return { label: "Completed", color: "success" };
                            if (t.dependsOn) {
                              const locked = !!(t.availableAt && new Date(t.availableAt) > new Date());
                              return { label: locked ? "Locked" : "Dependent (available)", color: locked ? "default" : "info" };
                            }
                            return { label: "Pending", color: "default" };
                          })();

                          const parts: string[] = [];
                          if (t.description) parts.push(t.description);
                          if (t.undoneReason) parts.push(`Reason: ${t.undoneReason}`);
                          if (t.completedTime) parts.push(`Completed at ${t.completedTime}`);
                          if (t.category) {
                            const c = (categories || []).find((x) => x.id === t.category);
                            const cname = c ? c.name : t.category;
                            parts.push(`Category: ${cname}`);
                          }

                          return (
                            <ListItem
                              key={t.id}
                              secondaryAction={
                                <Chip
                                  label={status.label}
                                  size="small"
                                  color={status.color as any}
                                />
                              }
                            >
                              <ListItemText
                                primary={t.title}
                                secondary={parts.length > 0 ? parts.join(" — ") : null}
                              />
                            </ListItem>
                          );
                        })}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
