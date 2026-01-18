import React from 'react';
import { Box, Typography, Button, Paper, Divider } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { summarizeTasks } from '../utils/ai';

export default function SummaryPanel() {
  const raw = useSelector((s: any) => s.tasks.items ?? []);
  const tasks: any[] = Array.isArray(raw) ? raw : Object.values(raw);
  const [todaySummary, setTodaySummary] = React.useState<string | null>(null);
  const [yesterdaySummary, setYesterdaySummary] = React.useState<string | null>(null);
  const [weekSummary, setWeekSummary] = React.useState<string | null>(null);
  const [monthSummary, setMonthSummary] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const buildTextForRange = (range: 'today'|'yesterday'|'week'|'month') => {
    // simple filter
    const today = new Date();
    const start = new Date();
    if (range === 'today') start.setHours(0,0,0,0);
    if (range === 'yesterday') { start.setDate(start.getDate()-1); start.setHours(0,0,0,0); }
    if (range === 'week') { start.setDate(start.getDate()-7); }
    if (range === 'month') { start.setMonth(start.getMonth()-1); }
    const items = tasks.filter(t => t.date && new Date(t.date) >= start).map(t => `- ${t.title}${t.completed? ' (done)':''}${t.undoneReason? ' (undone: '+t.undoneReason+')':''}`);
    return items.join('\n');
  }

  async function generate() {
    setLoading(true);
    try {
      const t = buildTextForRange('today');
      const y = buildTextForRange('yesterday');
      const w = buildTextForRange('week');
      const m = buildTextForRange('month');
      const [a,b,c,d] = await Promise.all([
        summarizeTasks(t || 'No tasks', 'today'),
        summarizeTasks(y || 'No tasks', 'yesterday'),
        summarizeTasks(w || 'No tasks', 'week'),
        summarizeTasks(m || 'No tasks', 'month'),
      ]);
      setTodaySummary(a);
      setYesterdaySummary(b);
      setWeekSummary(c);
      setMonthSummary(d);
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 12 }} elevation={0}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">AI Summaries</Typography>
        <Button size="small" onClick={generate} disabled={loading}>Generate</Button>
      </Box>
      <Divider sx={{ mb: 1 }} />
      <Typography variant="caption">Today</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>{todaySummary || 'No summary yet'}</Typography>
      <Typography variant="caption">Yesterday</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>{yesterdaySummary || 'No summary yet'}</Typography>
      <Typography variant="caption">Last 7 days</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>{weekSummary || 'No summary yet'}</Typography>
      <Typography variant="caption">Last 30 days</Typography>
      <Typography variant="body2">{monthSummary || 'No summary yet'}</Typography>
    </Paper>
  )
}
