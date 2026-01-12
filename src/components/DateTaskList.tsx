import React, { useMemo, useState } from 'react'
import { Box, TextField, IconButton, Typography, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../redux/store'
import { addTask, deleteTask, toggleComplete, editTask, addSubtask, toggleSubtask, deleteSubtask, editSubtask } from '../redux/slices/tasksSlice'
import TaskList from './TaskList'
import { Task } from '../types'
import { parseISO, format as fmt, isToday, isTomorrow } from 'date-fns'

type Props = { date: string }

export default function DateTaskList({ date }: Props) {
  const rawTasks = useSelector((s: any) => s.tasks?.items ?? []) as unknown
  const tasks: Task[] = Array.isArray(rawTasks) ? (rawTasks as Task[]) : Object.values(rawTasks as Record<string, Task>)
  const dispatch = useDispatch()

  // include tasks for the selected date and all future dates
  const grouped = useMemo(() => {
    const future = tasks?.filter((t) => t.date && t.date >= date && !t.dependsOn)
      .sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0))
    const map = new Map<string, Task[]>()
    for (const t of future) {
      const d = t.date as string
      const arr = map.get(d) || []
      arr.push(t)
      map.set(d, arr)
    }
    return Array.from(map.entries())
  }, [tasks, date])

  const [title, setTitle] = useState('')

  function handleAdd() {
    if (!title.trim()) return
    dispatch(addTask({ title: title.trim(), date }))
    setTitle('')
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" placeholder="New task" sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }} />
        <Tooltip title="Add task">
          <IconButton color="primary" onClick={handleAdd} aria-label="add task">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      {grouped.length === 0 ? (
        <Typography color="text.secondary">No tasks for this date or future dates</Typography>
      ) : (
        grouped.map(([d, list]) => (
          <Box key={d} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary', fontWeight: 700 }}>
              {isToday(parseISO(d)) ? `Today — ${fmt(parseISO(d), 'PPP')}` : isTomorrow(parseISO(d)) ? `Tomorrow — ${fmt(parseISO(d), 'PPP')}` : fmt(parseISO(d), 'PPP')}
            </Typography>
            <TaskList
              tasks={list}
              onDelete={(id) => dispatch(deleteTask(id))}
              onEdit={(id) => dispatch(editTask({ id, changes: { title: 'Edited: ' + id } }))}
              onToggle={(id) => {
                const t = list.find((x) => x.id === id)
                if (t && t.dependsOn && t.availableAt && new Date(t.availableAt) > new Date()) return
                dispatch(toggleComplete(id))
              }}
              onAddSubtask={(taskId, title) => dispatch(addSubtask({ taskId, title }))}
              onToggleSubtask={(taskId, subtaskId) => dispatch(toggleSubtask({ taskId, subtaskId }))}
              onDeleteSubtask={(taskId, subtaskId) => dispatch(deleteSubtask({ taskId, subtaskId }))}
              onEditSubtask={(taskId, subtaskId, title) => dispatch(editSubtask({ taskId, subtaskId, title }))}
            />
          </Box>
        ))
      )}
    </Box>
  )
}
