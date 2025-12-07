import React, { useMemo, useState } from 'react'
import { Container, AppBar, Toolbar, IconButton, Typography, Box, Paper, Switch, Tabs, Tab } from '@mui/material'
import { useDispatch } from 'react-redux'
import { loadState, saveState } from './utils/localStorage'
import { copyBucketToDate } from './redux/slices/tasksSlice'
import MenuIcon from '@mui/icons-material/Menu'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import DateTaskList from './components/DateTaskList'
import Backlog from './components/Backlog'
import TaskBucket from './components/TaskBucket'
import ProductivityMeter from './components/ProductivityMeter'
import HistoryView from './components/HistoryView'
import ScheduleTasks from './components/ScheduleTasks'
import { format } from 'date-fns'

export default function App() {
  const [dark, setDark] = useState(false)
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const dispatch = useDispatch()

  const [view, setView] = useState<'tasks' | 'history' | 'schedule' | 'backlog'>('tasks')

  const onToggleTheme = () => setDark((d) => !d)

  // Rollover: copy bucket tasks into today's date once per day.
  React.useEffect(() => {
    const last = loadState<string>('lastRollDate')
    const today = format(new Date(), 'yyyy-MM-dd')
    if (last !== today) {
      // dispatch action to copy bucket tasks into today's date
      dispatch(copyBucketToDate({ date: today }))
      saveState('lastRollDate', today)
    }
  }, [dispatch])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1 }}>To-Do List</Typography>
            <Typography variant="body2" sx={{ mr: 1 }}>Dark</Typography>
            <Switch checked={dark} onChange={onToggleTheme} />
          </Toolbar>
        </AppBar>

        <Container sx={{ py: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box>
              <Tabs value={view} onChange={(_, v) => setView(v as any)}>
                <Tab value="tasks" label="Tasks" />
                <Tab value="schedule" label="Schedule" />
                <Tab value="history" label="History" />
                <Tab value="backlog" label="Backlog" />
              </Tabs>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      {view === 'tasks' ? `Tasks for ${date}` : view === 'schedule' ? 'Schedule' : view === 'history' ? 'History' : 'Backlog'}
                    </Typography>
                    {/* date navigation could go here */}
                  </Box>
                  {view === 'tasks' ? (
                    <DateTaskList date={date} />
                  ) : view === 'schedule' ? (
                    <ScheduleTasks />
                  ) : view === 'history' ? (
                    <HistoryView />
                  ) : (
                    <Backlog />
                  )}
                </Box>

                <Box sx={{ width: { xs: '100%', md: 360 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2 }} elevation={1}>
                    {/* Task bucket is a global tool for all dates */}
                    <TaskBucket />
                  </Paper>

                  <Paper sx={{ p: 2 }} elevation={0}>
                    <ProductivityMeter date={date} />
                  </Paper>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  )
}
