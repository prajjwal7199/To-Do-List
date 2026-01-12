import React, { useMemo, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from './firebase'
import SignInPage from './components/SignInPage'
import { Container, AppBar, Toolbar, IconButton, Typography, Box, Paper, Switch, Tabs, Tab, InputBase } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { copyBucketToDate } from './redux/slices/tasksSlice'
import MenuIcon from '@mui/icons-material/Menu'
import AuthButton from './components/AuthButton'
import SearchIcon from '@mui/icons-material/Search'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const dispatch = useDispatch()

  const [view, setView] = useState<'tasks' | 'history' | 'schedule' | 'backlog'>('tasks')

  const onToggleTheme = () => setDark((d) => !d)

  // Rollover: if there are no tasks for today, copy bucket tasks into today's date once on load.
  const tasks = useSelector((s: any) => s.tasks.items as any[])
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])
  React.useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const hasToday = tasks.some((t) => t.date === today)
    if (!hasToday) dispatch(copyBucketToDate({ date: today }))
  }, [dispatch, tasks])

  if (!user) return <SignInPage />

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', pb: 6, background: 'linear-gradient(180deg,#071033 0%,#081026 40%,#071936 100%)', color: 'text.primary' }}>
        {/* Glass header with subtle blur and elevated shadow */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'background.paper', color: 'text.primary', backdropFilter: 'blur(6px)', py: 1 }}
        >
          <Toolbar sx={{ mx: { xs: 1, md: 4 }, bgcolor: 'transparent', display: 'flex', gap: 2 }}>
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 1, bgcolor: 'rgba(255,255,255,0.04)' }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }} component="h1">
              To‑Do
            </Typography>

            <Box component="label" htmlFor="header-search" sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper', px: 1, py: 0.5, borderRadius: 8, flex: 0.5, maxWidth: 420 }}>
              <SearchIcon fontSize="small" color="inherit" />
              <InputBase id="header-search" placeholder="Quick search tasks" inputProps={{ 'aria-label': 'search tasks' }} sx={{ ml: 1, flex: 1 }} />
            </Box>

            <Typography variant="body2" sx={{ ml: 1, mr: 1 }}>Dark</Typography>
            <Switch checked={dark} onChange={onToggleTheme} inputProps={{ 'aria-label': 'toggle theme' }} />
            <AuthButton />
          </Toolbar>
        </AppBar>

        <Container sx={{ py: 4, maxWidth: { xs: '100%', md: 'lg' } }}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 16, bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'background.paper'), boxShadow: '0 14px 40px rgba(2,6,23,0.5)' }}>
            <Box>
              <Tabs
                value={view}
                onChange={(_, v) => setView(v as any)}
                aria-label="primary views"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                <Tab value="tasks" label="Tasks" aria-controls="panel-tasks" />
                <Tab value="schedule" label="Schedule" aria-controls="panel-schedule" />
                <Tab value="history" label="History" aria-controls="panel-history" />
                <Tab value="backlog" label="Backlog" aria-controls="panel-backlog" />
              </Tabs>

              <AnimatePresence mode="wait">
                <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" component="h2">
                          {view === 'tasks' ? `Tasks for ${date}` : view === 'schedule' ? 'Schedule' : view === 'history' ? 'History' : 'Backlog'}
                        </Typography>
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
                      <Paper sx={{ p: 2, borderRadius: 12, bgcolor: 'background.paper', backdropFilter: 'blur(4px)' }} elevation={1}>
                        <TaskBucket />
                      </Paper>

                      <Paper sx={{ p: 2, borderRadius: 12 }} elevation={0}>
                        <ProductivityMeter date={date} />
                      </Paper>
                    </Box>
                  </Box>
                </motion.div>
              </AnimatePresence>
            </Box>
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  )
}
