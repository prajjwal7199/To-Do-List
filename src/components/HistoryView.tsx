import React, { useMemo } from 'react'
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
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import type { Task } from '../types'

function getDateKey(d: string) {
  return d
}

export default function HistoryView() {
  const tasks = useSelector((s: any) => s.tasks.items as any[])

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      // skip tasks without a date and skip dependent tasks (they are rendered inside their parent)
      if (!t.date || t.dependsOn) continue
      const key = getDateKey(t.date)
      const arr = map.get(key) || []
      arr.push(t)
      map.set(key, arr)
    }
    // sort dates descending
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [tasks])

  if (byDate.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">No history yet — bucket tasks will be copied into dates as time passes.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {byDate.map(([date, list]) => {
        const total = list.length
        const completed = list.filter((t) => t.completed).length
        const pct = total === 0 ? 0 : (completed / total) * 100
        return (
          <Accordion key={date} defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle1">{date}</Typography>
                  <Typography variant="caption" color="text.secondary">{`${completed} / ${total} completed`}</Typography>
                </Box>
                <Box sx={{ width: 200 }}>
                  <LinearProgress variant="determinate" value={pct} />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {list.map((t) => (
                  <ListItem key={t.id} secondaryAction={<Chip label={t.completed ? 'Done' : 'Pending'} size="small" />}>
                    <ListItemText primary={t.title} secondary={t.description || null} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}
