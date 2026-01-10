import React from 'react'
import { Card, CardContent, Typography, IconButton, Checkbox, Box, TextField, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddTaskIcon from '@mui/icons-material/AddTask'
import AddIcon from '@mui/icons-material/Add'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { motion } from 'framer-motion'
import type { Task } from '../types'
import { useDispatch, useSelector } from 'react-redux'
import { addTask, setDependency, clearDependency, unlockTask, toggleComplete, setReminder, clearReminder } from '../redux/slices/tasksSlice'

type Props = {
  task: Task
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onAddToDate?: (id: string) => void
  onAddSubtask?: (taskId: string, title: string) => void
  onToggleSubtask?: (taskId: string, subtaskId: string) => void
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void
  onEditSubtask?: (taskId: string, subtaskId: string, title: string) => void
  // dependency handled locally via dialog and internal actions
}

export default function TaskCard({ task, onEdit, onDelete, onToggle, onAddToDate, onAddSubtask, onToggleSubtask, onDeleteSubtask, onEditSubtask }: Props) {
  const [subtaskTitle, setSubtaskTitle] = React.useState('')
  const handleAddSubtask = () => {
    if (!subtaskTitle.trim()) return
    onAddSubtask?.(task.id, subtaskTitle.trim())
    setSubtaskTitle('')
  }

  const isLocked = !!(task.dependsOn && task.availableAt && new Date(task.availableAt) > new Date())
  const dispatch = useDispatch()

  // dependency dialog state
  const [depOpen, setDepOpen] = React.useState(false)
  const [depTitle, setDepTitle] = React.useState('')
  const [depDesc, setDepDesc] = React.useState('')
  const [hours, setHours] = React.useState(0)
  const [minutes, setMinutes] = React.useState(0)
  const [seconds, setSeconds] = React.useState(0)
  const [remOpen, setRemOpen] = React.useState(false)
  const [remValue, setRemValue] = React.useState('')

  function openDepDialog() {
    setDepTitle('')
    setDepDesc('')
    setHours(0)
    setMinutes(0)
    setSeconds(0)
    setDepOpen(true)
  }

  function formatLocalInput(iso?: string) {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function openRemDialog() {
    if (task.reminderAt) setRemValue(formatLocalInput(task.reminderAt))
    else {
      const t = new Date(Date.now() + 10 * 60 * 1000)
      setRemValue(formatLocalInput(t.toISOString()))
    }
    setRemOpen(true)
  }

  function handleSaveReminder() {
    if (!remValue) {
      dispatch(clearReminder(task.id))
      setRemOpen(false)
      return
    }
    // remValue is like 'YYYY-MM-DDTHH:mm' in local time
    const dt = new Date(remValue)
    const iso = dt.toISOString()
    dispatch((setReminder as any)({ id: task.id, reminderAt: iso }))
    setRemOpen(false)
  }

  async function handleCreateDependent() {
    if (!depTitle.trim()) {
      window.alert('Please enter a title for the dependent task')
      return
    }
    const date = task.date
    const res = dispatch(addTask({ title: depTitle.trim(), description: depDesc.trim(), date })) as any
    const newId = res.payload?.id
    const delaySeconds = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0)
    dispatch(setDependency({ id: newId, dependsOn: { taskId: task.id, delaySeconds } }))
    setDepOpen(false)
    window.alert('Dependent task created')
  }

  // countdown state for locked tasks
  const [remaining, setRemaining] = React.useState<number | null>(null)

  // get all tasks to find dependents (tasks that depend on this task)
  const allTasks = useSelector((s: any) => s.tasks.items as Task[])
  const dependents = React.useMemo(() => allTasks.filter((x) => x.dependsOn && x.dependsOn.taskId === task.id), [allTasks, task.id])

  // tick to refresh dependent countdowns every second when needed
  React.useEffect(() => {
    const hasAny = dependents.some((d) => !!d.availableAt)
    if (!hasAny) return
    const id = setInterval(() => {}, 1000)
    return () => clearInterval(id)
  }, [dependents])

  React.useEffect(() => {
    let timer: any = null
    if (task.availableAt) {
      const update = () => {
        const diff = Date.parse(task.availableAt!) - Date.now()
        const secs = Math.ceil(diff / 1000)
        if (secs <= 0) {
          // unlock the task
          try {
            dispatch(unlockTask(task.id))
          } catch (e) {
            // ignore
          }
          setRemaining(null)
          // notify user
          try {
            window.alert(`Task "${task.title}" is now available`)
          } catch (e) {}
          if (timer) clearInterval(timer)
        } else {
          setRemaining(secs)
        }
      }
      update()
      timer = setInterval(update, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [task.availableAt, task.id, task.title, dispatch])

  // schedule a reminder notification for this task
  React.useEffect(() => {
    let tId: any = null
    if (task.reminderAt) {
      const ms = Date.parse(task.reminderAt) - Date.now()
      const notifyAndClear = () => {
        try {
          window.alert(`Reminder: ${task.title}`)
        } catch (e) {}
        try {
          // clear the reminder so it doesn't fire again
          dispatch(clearReminder(task.id))
        } catch (e) {}
      }

      if (ms > 0) {
        tId = setTimeout(() => {
          notifyAndClear()
        }, ms)
      } else {
        // past reminder: notify immediately once and clear it
        notifyAndClear()
      }
    }
    return () => {
      if (tId) clearTimeout(tId)
    }
  }, [task.reminderAt, task.title, task.id, dispatch])

  return (
    <motion.div layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
      <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
        <Card
          variant="outlined"
          sx={{
            mb: 1,
            borderRadius: 12,
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(30,34,40,0.45)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
          role="article"
          aria-labelledby={`task-${task.id}-title`}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={isLocked ? `Locked until ${task.availableAt ? new Date(task.availableAt).toLocaleString() : 'when dependency completes'}` : ''}>
              <span>
                <Checkbox
                  checked={task.completed}
                  onChange={() => onToggle(task.id)}
                  disabled={isLocked}
                  inputProps={{ 'aria-label': task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete` }}
                />
              </span>
            </Tooltip>
            <div style={{ flex: 1 }}>
              <Typography id={`task-${task.id}-title`} variant="subtitle1" sx={{ textDecoration: task.completed ? 'line-through' : 'none', fontWeight: 600 }}>
                {task.title}
              </Typography>
              {task.description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {task.description}
                </Typography>
              ) : null}
            </div>
            {onAddToDate ? (
              <Tooltip title="Add to today">
                <IconButton size="small" color="primary" onClick={() => onAddToDate(task.id)} aria-label={`Add ${task.title} to today`}>
                  <AddTaskIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip title={task.reminderAt ? `Reminder set ${new Date(task.reminderAt).toLocaleString()}` : 'Set reminder'}>
              <IconButton size="small" onClick={openRemDialog} aria-label={`Set reminder for ${task.title}`}>
                <AccessTimeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          {/* Dependency: if this task is a dependent (has dependsOn), allow clearing it; otherwise allow creating dependents */}
          {!task.dependsOn ? (
            <IconButton size="small" onClick={openDepDialog} title="Create dependent task">
              <LinkIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton size="small" onClick={() => dispatch(clearDependency(task.id))} title="Clear dependency">
              <LinkOffIcon fontSize="small" />
            </IconButton>
          )}
          {/* If task has dependsOn and is not yet available, show a lock icon (disabled) */}
          {task.dependsOn && task.availableAt && new Date(task.availableAt) > new Date() ? (
            <Tooltip title={remaining !== null ? `Locked — ${remaining}s remaining` : `Locked until ${task.availableAt ? new Date(task.availableAt).toLocaleString() : 'when dependency completes'}`}>
              <IconButton size="small" disabled>
                <AddTaskIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          <IconButton size="small" onClick={() => onEdit(task.id)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(task.id)}>
            <DeleteIcon />
          </IconButton>
        </CardContent>

        {/* Dependency creation dialog */}
        <Dialog open={depOpen} onClose={() => setDepOpen(false)}>
          <DialogTitle>Create dependent task</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 320 }}>
              <TextField label="Title" value={depTitle} onChange={(e) => setDepTitle(e.target.value)} fullWidth />
              <TextField label="Description" value={depDesc} onChange={(e) => setDepDesc(e.target.value)} fullWidth />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField label="Hours" type="number" inputProps={{ min: 0 }} value={hours} onChange={(e) => setHours(Number(e.target.value))} size="small" />
                <TextField label="Minutes" type="number" inputProps={{ min: 0 }} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} size="small" />
                <TextField label="Seconds" type="number" inputProps={{ min: 0 }} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} size="small" />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDepOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDependent} variant="contained">Create</Button>
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
              <Button onClick={() => { setRemValue(''); dispatch(clearReminder(task.id)); setRemOpen(false) }}>Clear</Button>
              <Button onClick={() => setRemOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveReminder} variant="contained">Save</Button>
            </DialogActions>
          </Dialog>

        {/* Inline dependents list (show immediate dependent tasks under this parent) */}
        {dependents.length > 0 ? (
          <CardContent sx={{ pt: 0, bgcolor: 'transparent' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
              Dependent tasks
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {dependents.map((d) => {
                const locked = !!(d.availableAt && new Date(d.availableAt) > new Date())
                const remainingSecs = d.availableAt ? Math.max(0, Math.ceil((Date.parse(d.availableAt) - Date.now()) / 1000)) : null
                const fmt = (s: number | null) => {
                  if (s === null) return ''
                  const hh = Math.floor(s / 3600)
                  const mm = Math.floor((s % 3600) / 60)
                  const ss = s % 60
                  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
                }
                return (
                  <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2, borderLeft: 2, borderColor: 'divider', py: 0.5 }}>
                    <Checkbox
                      size="small"
                      checked={d.completed}
                      onChange={() => {
                        if (locked || !task.completed) return
                        if (onToggle) onToggle(d.id)
                        else dispatch(toggleComplete(d.id))
                      }}
                      disabled={locked || !task.completed}
                      inputProps={{ 'aria-label': `Toggle dependent ${d.title}` }}
                    />
                    <div style={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ textDecoration: d.completed ? 'line-through' : 'none' }}>{d.title}</Typography>
                      {d.description ? <Typography variant="caption" color="text.secondary">{d.description}</Typography> : null}
                    </div>
                    {locked && remainingSecs !== null ? (
                      <Typography variant="caption" color="text.secondary">{fmt(remainingSecs)}</Typography>
                    ) : null}
                    <IconButton size="small" onClick={() => onEdit(d.id)} aria-label={`Edit ${d.title}`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(d.id)} aria-label={`Delete ${d.title}`}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )
              })}
            </Box>
          </CardContent>
        ) : null}

        {/* Subtasks area */}
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <TextField value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} size="small" placeholder="Add subtask" fullWidth />
            <Tooltip title="Add subtask">
              <IconButton color="success" onClick={handleAddSubtask}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {task.subtasks && task.subtasks.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {task.subtasks.map((s) => (
                <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox size="small" checked={s.completed} onChange={() => onToggleSubtask?.(task.id, s.id)} />
                  <Typography variant="body2" sx={{ flex: 1, textDecoration: s.completed ? 'line-through' : 'none' }}>{s.title}</Typography>
                  <IconButton size="small" onClick={() => {
                    const newTitle = window.prompt('Edit subtask', s.title)
                    if (newTitle !== null) onEditSubtask?.(task.id, s.id, newTitle)
                  }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDeleteSubtask?.(task.id, s.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ) : null}
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  )
}
