import React, { useMemo } from 'react'
import { Box, Typography, LinearProgress } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'

type Props = { date?: string }

export default function ProductivityMeter({ date }: Props) {
  const tasks = useSelector((s: RootState) => s.tasks.items)
  const settings = useSelector((s: RootState) => s.productivity)

  const { completed, total, pct } = useMemo(() => {
    const list = date ? tasks.filter((t) => t.date === date) : tasks
    const total = list.length
    const completed = list.filter((t) => t.completed).length
    const pct = total === 0 ? 0 : completed / total
    return { completed, total, pct }
  }, [tasks, date])

  const color: 'error' | 'warning' | 'secondary' | 'success' = pct >= (settings.thresholds.green || 1)
    ? 'success'
    : pct >= (settings.thresholds.yellow || 0.75)
    ? 'secondary'
    : pct >= (settings.thresholds.orange || 0.5)
    ? 'warning'
    : 'error'

  return (
    <Box>
      <Typography variant="subtitle1">Productivity</Typography>
      <Typography variant="body2" color="text.secondary">{`${completed} / ${total} completed`}</Typography>
      <Box sx={{ mt: 1 }}>
        <LinearProgress variant="determinate" value={pct * 100} color={color} />
      </Box>
    </Box>
  )
}
