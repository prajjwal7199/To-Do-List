import React from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Checkbox,
  Box,
  TextField,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import AddTaskIcon from "@mui/icons-material/AddTask";
import AddIcon from "@mui/icons-material/Add";
import ArchiveIcon from "@mui/icons-material/Archive";
import UndoIcon from "@mui/icons-material/Undo";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CodeIcon from '@mui/icons-material/Code';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { motion } from "framer-motion";
import type { Task } from "../types";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import {
  addTask,
  setDependency,
  clearDependency,
  unlockTask,
  toggleComplete,
  setReminder,
  clearReminder,
  editTask,
  assignDate,
  markUndoneWithReason,
} from "../redux/slices/tasksSlice";

type Props = {
  task: Task;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onAddToDate?: (id: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onEditSubtask?: (taskId: string, subtaskId: string, title: string) => void;
  // removed move handlers; drag-and-drop handles ordering
  // dependency handled locally via dialog and internal actions
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggle,
  onAddToDate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const [subtaskTitle, setSubtaskTitle] = React.useState("");
  const handleAddSubtask = () => {
    if (!subtaskTitle.trim()) return;
    onAddSubtask?.(task.id, subtaskTitle.trim());
    setSubtaskTitle("");
  };

  const isLocked = !!(
    task.dependsOn &&
    task.availableAt &&
    new Date(task.availableAt) > new Date()
  );
  const dispatch = useDispatch();
  const categories = useSelector(
    (s: RootState) => (s.tasks as any)?.categories || [],
  );

  //Find category name from ID
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c: any) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // dependency dialog state
  const [depOpen, setDepOpen] = React.useState(false);
  const [depTitle, setDepTitle] = React.useState("");
  const [depDesc, setDepDesc] = React.useState("");
  const [hours, setHours] = React.useState(0);
  const [minutes, setMinutes] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const [snackOpen, setSnackOpen] = React.useState(false);
  const [snackMsg, setSnackMsg] = React.useState("");
  const [completionDialogOpen, setCompletionDialogOpen] = React.useState(false);
  const [completionTimeInput, setCompletionTimeInput] = React.useState("");
  // dependent edit dialog state
  const [depEditOpen, setDepEditOpen] = React.useState(false);
  const [depEditId, setDepEditId] = React.useState<string | null>(null);
  const [depEditTitle, setDepEditTitle] = React.useState("");
  const [depEditHours, setDepEditHours] = React.useState(0);
  const [depEditMinutes, setDepEditMinutes] = React.useState(0);
  const [depEditSeconds, setDepEditSeconds] = React.useState(0);
  const [undoneDialogOpen, setUndoneDialogOpen] = React.useState(false);
  const [undoneReasonInput, setUndoneReasonInput] = React.useState("");
  const [remOpen, setRemOpen] = React.useState(false);
  const [remValue, setRemValue] = React.useState("");

  //Edit dialog state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editPiority, setEditPriority] = React.useState<"high" | "medium" | "low" | "">("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editTags, setEditTags] = React.useState<string[]>([]);
  const [newTag, setNewTag] = React.useState("");
  const [aiIconName, setAiIconName] = React.useState<string | null>(null);
  const [aiIconLoading, setAiIconLoading] = React.useState(false);

  function openEditDialog() {
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditPriority((task as any)?.priority || "");
    setEditCategory(task.category || "");
    setEditTags(task.tags || []);
    setNewTag("");
    setEditOpen(true);
  }

  function handleEditSave() {
    const changes: Partial<Task> = {
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPiority as any,
      category: editCategory,
      tags: editTags.length > 0 ? editTags : undefined,
    };
    dispatch(editTask({ id: task.id, changes }));
    setEditOpen(false);
  } 

  function handleAddTag() {
    if(newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag("");
    }
  }

  function handleDeleteTag(tagToDelete: string) {
    setEditTags(editTags.filter(tag => tag !== tagToDelete));
  }

  function openDepDialog() {
    setDepTitle("");
    setDepDesc("");
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setDepOpen(true);
  }

  // generate a small icon keyword via AI and map it to known icons
  async function handleGenerateIcon() {
    try {
      setAiIconLoading(true);
      const { suggestIconKeyword } = await import("../utils/ai");
      const txt = `${task.title}${task.description ? ' - ' + task.description : ''}`;
      const kw = await suggestIconKeyword(txt);
      setAiIconName(kw || 'default');
    } catch (e) {
      setAiIconName('default');
    } finally { setAiIconLoading(false); }
  }

  function formatLocalInput(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openRemDialog() {
    if (task.reminderAt) setRemValue(formatLocalInput(task.reminderAt));
    else {
      const t = new Date(Date.now() + 10 * 60 * 1000);
      setRemValue(formatLocalInput(t.toISOString()));
    }
    setRemOpen(true);
  }

  function handleSaveReminder() {
    if (!remValue) {
      dispatch(clearReminder(task.id));
      setRemOpen(false);
      return;
    }
    // remValue is like 'YYYY-MM-DDTHH:mm' in local time
    const dt = new Date(remValue);
    const iso = dt.toISOString();
    dispatch((setReminder as any)({ id: task.id, reminderAt: iso }));
    setRemOpen(false);
  }

  async function handleCreateDependent() {
    if (!depTitle.trim()) {
      setSnackMsg("Please enter a title for the dependent task");
      setSnackOpen(true);
      return;
    }
    const date = task.date;
    const res = dispatch(
      addTask({ title: depTitle.trim(), description: depDesc.trim(), date }),
    ) as any;
    const newId = res.payload?.id;
    const delaySeconds =
      (Number(hours) || 0) * 3600 +
      (Number(minutes) || 0) * 60 +
      (Number(seconds) || 0);
    dispatch(
      setDependency({
        id: newId,
        dependsOn: { taskId: task.id, delaySeconds },
      }),
    );
    setDepOpen(false);
    // show a snackbar instead of alert
    setSnackMsg(`Dependent task "${depTitle}" created`);
    setSnackOpen(true);
  }

  function openDependentEdit(d: Task) {
    setDepEditId(d.id);
    setDepEditTitle(d.title);
    const ds = d.dependsOn?.delaySeconds || 0;
    setDepEditHours(Math.floor(ds / 3600));
    setDepEditMinutes(Math.floor((ds % 3600) / 60));
    setDepEditSeconds(ds % 60);
    setDepEditOpen(true);
  }

  function handleSaveDependentEdit() {
    if (!depEditId) return;
    const delaySeconds = (Number(depEditHours) || 0) * 3600 + (Number(depEditMinutes) || 0) * 60 + (Number(depEditSeconds) || 0);
    try {
      dispatch(editTask({ id: depEditId, changes: { title: depEditTitle } }));
      dispatch(setDependency({ id: depEditId, dependsOn: { taskId: task.id, delaySeconds } }));
      // if parent already completed, update availableAt
      if (task.completed) {
        const at = new Date(Date.now() + delaySeconds * 1000).toISOString();
        dispatch(editTask({ id: depEditId, changes: { availableAt: at } }));
      }
    } catch (e) {}
    setDepEditOpen(false);
  }

  // Mark undone with reason
  function handleMarkUndoneWithReason() {
    // preserved for backward compatibility; prefer dialog flow
    try {
      dispatch(markUndoneWithReason({ id: task.id, reason: undoneReasonInput || undefined } as any) as any);
      setSnackMsg("Task marked undone");
      setSnackOpen(true);
    } catch (e) {}
  }

  // Move this task to backlog
  function handleMoveToBacklog() {
    try {
      dispatch(editTask({ id: task.id, changes: { backlog: true, date: undefined, movedToBacklog: true } }));
      setSnackMsg("Task moved to backlog");
      setSnackOpen(true);
    } catch (e) {}
  }

  // Move undone task to a new date (simple prompt-based flow)
  function handleMoveUndoneToDate() {
    const newDate = window.prompt("Move undone task to date (YYYY-MM-DD)");
    if (!newDate) return;
    try {
      dispatch(assignDate({ id: task.id, date: newDate }));
      dispatch(editTask({ id: task.id, changes: { movedToDate: newDate } }));
      setSnackMsg(`Task moved to ${newDate}`);
      setSnackOpen(true);
    } catch (e) {}
  }

  // handle toggle with optional completion time
  function handleToggle() {
    if (isLocked) return;
    if (!task.completed) {
      // open completion time dialog instead of prompt
      setCompletionTimeInput(task.completedTime || "");
      setCompletionDialogOpen(true);
      return;
    }
    try {
      onToggle(task.id);
    } catch (e) {}
  }

  // countdown state for locked tasks
  const [remaining, setRemaining] = React.useState<number | null>(null);
  // tick state to force re-render when dependents have active availability timers
  const [, setTick] = React.useState(0);

  // get all tasks to find dependents (tasks that depend on this task)
  const rawAllTasks = useSelector((s: any) => s.tasks?.items ?? []) as unknown;
  const allTasks: Task[] = Array.isArray(rawAllTasks)
    ? (rawAllTasks as Task[])
    : Object.values(rawAllTasks as Record<string, Task>);
  const dependents = React.useMemo(
    () => allTasks.filter((x) => x.dependsOn && x.dependsOn.taskId === task.id),
    [allTasks, task.id],
  );

  // tick to refresh dependent countdowns every second when needed
  React.useEffect(() => {
    const hasAny = dependents.some((d) => !!d.availableAt);
    if (!hasAny) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [dependents]);

  React.useEffect(() => {
    let timer: any = null;
    if (task.availableAt) {
      const update = () => {
        const diff = Date.parse(task.availableAt!) - Date.now();
        const secs = Math.ceil(diff / 1000);
        if (secs <= 0) {
          // unlock the task
          try {
            dispatch(unlockTask(task.id));
          } catch (e) {
            // ignore
          }
          setRemaining(null);
          // play sound and show notification (fallback to alert if notifications unavailable)
          try {
            speakUnlock(task.title);
            showUnlockNotification(task.title);
          } catch (e) {
            try {
              setSnackMsg(`Task "${task.title}" is now available`);
              setSnackOpen(true);
            } catch (e) {}
          }
          if (timer) clearInterval(timer);
        } else {
          setRemaining(secs);
        }
      };
      update();
      timer = setInterval(update, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [task.availableAt, task.id, task.title, dispatch]);

  // schedule a reminder notification for this task
  React.useEffect(() => {
    let tId: any = null;
    if (task.reminderAt) {
      const ms = Date.parse(task.reminderAt) - Date.now();
      const notifyAndClear = () => {
        try {
          setSnackMsg(`Reminder: ${task.title}`);
          setSnackOpen(true);
        } catch (e) {}
        try {
          // clear the reminder so it doesn't fire again
          dispatch(clearReminder(task.id));
        } catch (e) {}
      };

      if (ms > 0) {
        tId = setTimeout(() => {
          notifyAndClear();
        }, ms);
      } else {
        // past reminder: notify immediately once and clear it
        notifyAndClear();
      }
    }
    return () => {
      if (tId) clearTimeout(tId);
    };
  }, [task.reminderAt, task.title, task.id, dispatch]);

  // helper: speak an unlock message using SpeechSynthesis
  function speakUnlock(title: string) {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const text = `Time's up. The task "${title}" is available now. Get up!`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      // stop any previous speech and speak
      try {
        synth.cancel();
      } catch (e) {}
      synth.speak(utter);
    } catch (e) {
      // ignore
    }
  }

  // helper: show browser notification (asks permission if needed)
  function showUnlockNotification(title: string) {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification("Task available", { body: title });
        return;
      }
      if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") new Notification("Task available", { body: title });
        });
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
    >
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <Card
          variant="outlined"
          sx={{
            mb: 1,
            borderRadius: 12,
            bgcolor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(255,255,255,0.02)"
                : "rgba(255,255,255,0.8)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.04)",
            borderLeft: (t) => `6px solid ${t.palette.primary.main}`,
            overflow: "hidden",
          }}
          role="article"
          aria-labelledby={`task-${task.id}-title`}
        >
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tooltip
              title={
                isLocked
                  ? `Locked until ${task.availableAt ? new Date(task.availableAt).toLocaleString() : "when dependency completes"}`
                  : ""
              }
            >
              <span>
                {task.undoneReason ? (
                  <Tooltip title={task.undoneReason || "Undone"}>
                    <IconButton aria-label="undone" onClick={() => setUndoneDialogOpen(true)}>
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Checkbox
                    checked={task.completed}
                    onChange={() => handleToggle()}
                    disabled={isLocked}
                    color="secondary"
                    inputProps={{
                      "aria-label": task.completed
                        ? `Mark ${task.title} incomplete`
                        : `Mark ${task.title} complete`,
                    }}
                  />
                )}
              </span>
            </Tooltip>
            <div style={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: 'wrap' }}>
              <Typography
                id={`task-${task.id}-title`}
                variant="subtitle1"
                sx={{
                  textDecoration: task.completed ? "line-through" : "none",
                  fontWeight: 600,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {/* render icon based on AI suggestion or category */}
                  {(() => {
                    const name = aiIconName || (task.category || '').toString().toLowerCase();
                    if (name === 'work' || name === 'workoutline') return <WorkOutlineIcon fontSize="small" />;
                    if (name === 'coffee' || name === 'cafe') return <LocalCafeIcon fontSize="small" />;
                    if (name === 'fitness' || name === 'exercise') return <FitnessCenterIcon fontSize="small" />;
                    if (name === 'code' || name === 'coding') return <CodeIcon fontSize="small" />;
                    if (name === 'shopping' || name === 'cart') return <ShoppingCartIcon fontSize="small" />;
                    if (name === 'default' || !name) return <AssignmentIcon fontSize="small" />;
                    return <AssignmentIcon fontSize="small" />;
                  })()}
                  {task.title}
                </span>
              </Typography>
              {task.priority && (
                <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  bgcolor:
                  task.priority === "high"
                  ? "#ef4444"
                  : task.priority === "medium"
                  ? "#f59e0b"
                  : "#6b7280",
                  color: "white",
                }}
                >
                  {task.priority.toUpperCase()}
                </Box>
              )}
              {task.category && (
                <Box sx={{
                  px:1,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: "0.7rem",
                  bgcolor: "rgba(59, 130, 246, 0.2)",
                  color: "#3b82f6",
                }}
                >
                  {getCategoryName(task.category)}
                </Box>
              )}
              {
                task.tags && 
                task.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                ))
              }
              </Box>
              {expanded && task.description ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {task.description}
                </Typography>
              ) : null}
              {task.completed && task.completedTime ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Completed at {task.completedTime}
                </Typography>
              ) : null}
            </div>
            <Tooltip title={expanded ? "Show less" : "Show more options"}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Collapse task details" : "Expand task details"                  
                }
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Tooltip>
          </CardContent>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardContent
              sx={{ pt: 0, display: "flex", alignItems: "center", flexWrap: "wrap" }}
              >
            {onAddToDate ? (
              <Tooltip title="Add to today">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onAddToDate(task.id)}
                  aria-label={`Add ${task.title} to today`}
                >
                  <AddTaskIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip
              title={
                task.reminderAt
                  ? `Reminder set ${new Date(task.reminderAt).toLocaleString()}`
                  : "Set reminder"
              }
            >
              <IconButton
                size="small"
                onClick={openRemDialog}
                aria-label={`Set reminder for ${task.title}`}
              >
                <AccessTimeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {/* Dependency: if this task is a dependent (has dependsOn), allow clearing it; otherwise allow creating dependents */}
            {!task.dependsOn ? (
              <IconButton
                size="small"
                onClick={openDepDialog}
                title="Create dependent task"
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            ) : (
              <IconButton
                size="small"
                onClick={() => dispatch(clearDependency(task.id))}
                title="Clear dependency"
              >
                <LinkOffIcon fontSize="small" />
              </IconButton>
            )}
            {/* If task has dependsOn and is not yet available, show a lock icon (disabled) */}
            {task.dependsOn &&
            task.availableAt &&
            new Date(task.availableAt) > new Date() ? (
              <Tooltip
                title={
                  remaining !== null
                    ? `Locked — ${remaining}s remaining`
                    : `Locked until ${task.availableAt ? new Date(task.availableAt).toLocaleString() : "when dependency completes"}`
                }
              >
                <IconButton size="small" disabled>
                  <AddTaskIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            <IconButton size="small" onClick={openEditDialog}>
              <EditIcon />
            </IconButton>
            {/* move up/down removed — ordering handled via drag-and-drop */}
            <IconButton size="small" onClick={() => onDelete(task.id)}>
              <DeleteIcon />
            </IconButton>
            <Tooltip title="Move to backlog">
              <IconButton size="small" onClick={handleMoveToBacklog}>
                <ArchiveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Generate icon (AI)">
              <span>
                <IconButton size="small" onClick={handleGenerateIcon} disabled={aiIconLoading}>
                  <AutoAwesomeIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Mark undone / cancel">
                <IconButton size="small" onClick={() => {
                  setUndoneReasonInput("");
                  setUndoneDialogOpen(true);
                }}>
                  <UndoIcon />
                </IconButton>
            </Tooltip>
            {task.date && !task.completed && task.allowMoveUndone ? (
              <Tooltip title="Move undone to another date">
                <IconButton size="small" onClick={handleMoveUndoneToDate}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </CardContent>
          </Collapse>

          {/* Dependency creation dialog */}
          <Dialog open={depOpen} onClose={() => setDepOpen(false)}>
            <DialogTitle>Create dependent task</DialogTitle>
            <DialogContent>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 1,
                  minWidth: 320,
                }}
              >
                <TextField
                  label="Title"
                  value={depTitle}
                  onChange={(e) => setDepTitle(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={depDesc}
                  onChange={(e) => setDepDesc(e.target.value)}
                  fullWidth
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Hours"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    size="small"
                  />
                  <TextField
                    label="Minutes"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    size="small"
                  />
                  <TextField
                    label="Seconds"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={seconds}
                    onChange={(e) => setSeconds(Number(e.target.value))}
                    size="small"
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDepOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateDependent} variant="contained">
                Create
              </Button>
            </DialogActions>
          </Dialog>

          {/* Reminder dialog */}
          <Dialog open={remOpen} onClose={() => setRemOpen(false)}>
            <DialogTitle>Set reminder</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 1 }}>
                <TextField
                  label="When"
                  type="datetime-local"
                  value={remValue}
                  onChange={(e) => setRemValue(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setRemValue("");
                  dispatch(clearReminder(task.id));
                  setRemOpen(false);
                }}
              >
                Clear
              </Button>
              <Button onClick={() => setRemOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveReminder} variant="contained">
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit task dialog */}
          <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogContent>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 1,
                }}
              >
                <TextField
                  label="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                />
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editPiority}
                    onChange={(e) =>
                      setEditPriority(e.target.value as "high" | "medium" | "low" | "")
                    }
                    label="Priority"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">None</MenuItem>
                    {categories.map((cat: any) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box>
                  <Typography variant="subtitle2" sx={{mb:1}}>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {editTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)}
                        size="small"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e)=>
                        e.key === "Enter" && 
                        (e.preventDefault(), handleAddTag())
                      }
                      placeholder="Add Tag"
                      size="small"
                      fullWidth
                    />
                    <Button onClick={handleAddTag} variant="outlined" size="small">Add</Button>
                  </Box>
                </Box>
                </Box>
                </DialogContent>
                <DialogActions>
              <Button onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSave} variant="contained" disabled={!editTitle.trim()}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Inline dependents list (show immediate dependent tasks under this parent) */}
          {dependents.length > 0 ? (
            <CardContent sx={{ pt: 0, bgcolor: "transparent" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, ml: 1 }}
              >
                Dependent tasks
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {dependents.map((d) => {
                  const locked = !!(
                    d.availableAt && new Date(d.availableAt) > new Date()
                  );
                  const remainingSecs = d.availableAt
                    ? Math.max(
                        0,
                        Math.ceil(
                          (Date.parse(d.availableAt) - Date.now()) / 1000,
                        ),
                      )
                    : null;
                  const fmt = (s: number | null) => {
                    if (s === null) return "";
                    const hh = Math.floor(s / 3600);
                    const mm = Math.floor((s % 3600) / 60);
                    const ss = s % 60;
                    return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
                  };
                  return (
                    <Box
                      key={d.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        pl: 2,
                        borderLeft: 2,
                        borderColor: "divider",
                        py: 0.5,
                      }}
                    >
                      {d.undoneReason ? (
                        <Tooltip title={d.undoneReason || "Undone"}>
                          <IconButton onClick={() => {
                            // open dependent edit dialog for this dependent
                            openDependentEdit(d);
                          }}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Checkbox
                          size="small"
                          checked={d.completed}
                          onChange={() => {
                            if (locked || !task.completed) return;
                            if (onToggle) onToggle(d.id);
                            else dispatch(toggleComplete(d.id));
                          }}
                          disabled={locked || !task.completed}
                          inputProps={{
                            "aria-label": `Toggle dependent ${d.title}`,
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: d.completed
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {d.title}
                        </Typography>
                        {d.description ? (
                          <Typography variant="caption" color="text.secondary">
                            {d.description}
                          </Typography>
                        ) : null}
                      </div>
                      {locked && remainingSecs !== null ? (
                        <Typography variant="caption" color="text.secondary">
                          {fmt(remainingSecs)}
                        </Typography>
                      ) : null}
                      <IconButton
                        size="small"
                        onClick={() => openDependentEdit(d)}
                        aria-label={`Edit ${d.title}`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(d.id)}
                        aria-label={`Delete ${d.title}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          ) : null}

          {/* Subtasks area */}
          {task.subtasks && task.subtasks.length > 0 ? (
          <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {task.subtasks.map((s) => (
                  <Box
                    key={s.id}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Checkbox
                      size="small"
                      checked={s.completed}
                      onChange={() => onToggleSubtask?.(task.id, s.id)}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        textDecoration: s.completed ? "line-through" : "none",
                      }}
                    >
                      {s.title}
                    </Typography>
                    {expanded ? (
                      <>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newTitle = window.prompt("Edit subtask", s.title);
                        if (newTitle !== null)
                          onEditSubtask?.(task.id, s.id, newTitle);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDeleteSubtask?.(task.id, s.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    </>
                    ) : null}
                  </Box>
                ))}
              </Box>
              </CardContent>
            ) : null}

            {/* Add subtask input - only when expanded */}
            {expanded ? (
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb:1 }}>
                <TextField
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  size="small"
                  placeholder="Add subtask"
                  fullWidth
                />
                <Tooltip title="Add subtask">
                  <IconButton color="success" onClick={handleAddSubtask}>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
           ) : null}
        </Card>
      </motion.div>
      {/* Dependent edit dialog */}
      <Dialog open={depEditOpen} onClose={() => setDepEditOpen(false)}>
        <DialogTitle>Edit dependent task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, minWidth: 320 }}>
            <TextField label="Title" value={depEditTitle} onChange={(e) => setDepEditTitle(e.target.value)} fullWidth />
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField label="Hours" type="number" value={depEditHours} onChange={(e) => setDepEditHours(Number(e.target.value))} size="small" />
              <TextField label="Minutes" type="number" value={depEditMinutes} onChange={(e) => setDepEditMinutes(Number(e.target.value))} size="small" />
              <TextField label="Seconds" type="number" value={depEditSeconds} onChange={(e) => setDepEditSeconds(Number(e.target.value))} size="small" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDependentEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={completionDialogOpen} onClose={() => setCompletionDialogOpen(false)}>
        <DialogTitle>Completion time</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              label="Completion time (e.g. 02:15 PM)"
              fullWidth
              value={completionTimeInput}
              onChange={(e) => setCompletionTimeInput(e.target.value)}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              try {
                onToggle(task.id);
                if (completionTimeInput)
                  dispatch(editTask({ id: task.id, changes: { completedTime: completionTimeInput } }));
              } catch (e) {}
              setCompletionDialogOpen(false);
              setSnackMsg("Task completed");
              setSnackOpen(true);
            }}
            variant="contained"
          >
            Save
          </Button>
          <Button
            onClick={() => {
              try {
                onToggle(task.id);
              } catch (e) {}
              setCompletionDialogOpen(false);
              setSnackMsg("Task completed");
              setSnackOpen(true);
            }}
          >
            Skip time
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={undoneDialogOpen} onClose={() => setUndoneDialogOpen(false)}>
        <DialogTitle>Mark task undone / cancel</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Reason (optional)"
              value={undoneReasonInput}
              onChange={(e) => setUndoneReasonInput(e.target.value)}
              fullWidth
              multiline
              rows={3}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUndoneDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            try {
              dispatch(markUndoneWithReason({ id: task.id, reason: undoneReasonInput || undefined } as any) as any);
              setSnackMsg("Task marked undone");
              setSnackOpen(true);
            } catch (e) {}
            setUndoneDialogOpen(false);
          }} variant="contained">Mark undone</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} message={snackMsg} />
    </motion.div>
  );
}
