import React, { useState } from 'react'
import { Box, TextField, IconButton, Tooltip, Button, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useDispatch } from 'react-redux'
import { addTask } from '../redux/slices/tasksSlice'
import { addDays, differenceInCalendarDays, format } from 'date-fns'

export default function ScheduleTasks() {
  const dispatch = useDispatch()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [start, setStart] = useState<Date | null>(new Date())
  const [end, setEnd] = useState<Date | null>(addDays(new Date(), 1))

  function handleSchedule() {
    if (!title.trim()) {
      window.alert('Please enter a task title')
      return
    }
    if (!start || !end) return
    if (end < start) {
      window.alert('End date must be same or after start date')
      return
    }

    const diff = differenceInCalendarDays(end, start)
    for (let i = 0; i <= diff; i++) {
      const d = addDays(start, i)
      const iso = format(d, 'yyyy-MM-dd')
      dispatch(addTask({ title: title.trim(), description: description.trim(), date: iso }))
    }

    setTitle('')
    setDescription('')
    window.alert(`Scheduled task for ${diff + 1} day(s)`)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ color: 'text.primary' }}>Schedule Task for Date Range</Typography>
      <TextField value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" fullWidth sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }} />
      <TextField value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" fullWidth sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }} />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <DatePicker
          label="Start date"
          value={start}
          onChange={(v) => setStart(v)}
          slotProps={{ textField: { fullWidth: true, sx: { bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 } } }}
        />
        <DatePicker
          label="End date"
          value={end}
          onChange={(v) => setEnd(v)}
          slotProps={{ textField: { fullWidth: true, sx: { bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 } } }}
        />
        <Tooltip title="Schedule">
          <IconButton color="primary" onClick={handleSchedule} aria-label="schedule task">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box>
        <Button variant="contained" onClick={handleSchedule} sx={{ background: 'linear-gradient(90deg,#7b61ff,#00d4ff)', color: 'white' }}>Schedule Task</Button>
      </Box>
    </Box>
  )
}
