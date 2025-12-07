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
      <Typography variant="h6">Schedule Task for Date Range</Typography>
      <TextField value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" fullWidth />
      <TextField value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" fullWidth />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <DatePicker
          label="Start date"
          value={start}
          onChange={(v) => setStart(v)}
          slotProps={{ textField: { fullWidth: true } }}
        />
        <DatePicker
          label="End date"
          value={end}
          onChange={(v) => setEnd(v)}
          slotProps={{ textField: { fullWidth: true } }}
        />
        <Tooltip title="Schedule">
          <IconButton color="success" onClick={handleSchedule} aria-label="schedule task">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box>
        <Button variant="outlined" onClick={handleSchedule}>Schedule Task</Button>
      </Box>
    </Box>
  )
}
