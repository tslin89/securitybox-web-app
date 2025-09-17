// pages/Dashboard.tsx (or MainGrid.tsx)
import * as React from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid'; // or @mui/material/Grid
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';
import { getDashboardOverview } from '../services/api';
import { EVENT_SETS, EVENT_LABELS } from '../constants/events';

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card><CardContent>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ mt: 0.5 }}>{value}</Typography>
    </CardContent></Card>
  );
}

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.6} />
        <stop offset="30%" stopColor={color} stopOpacity={0.4} />
        <stop offset="70%" stopColor={color} stopOpacity={0.2} />
        <stop offset="100%" stopColor={color} stopOpacity={0.05} />
      </linearGradient>
    </defs>
  );
}

export default function MainGrid() {
  const [data, setData] = React.useState<Awaited<ReturnType<typeof getDashboardOverview>> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = React.useState<number>(7);

  const fetchData = React.useCallback(async () => {
    try {
      const d = await getDashboardOverview({ days: selectedPeriod, recent: 25, activeMinutes: 10 });
      setData(d);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, [selectedPeriod]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const handlePeriodChange = React.useCallback((event: any) => {
    setSelectedPeriod(event.target.value);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        await fetchData();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={320} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={320} />
      </Container>
    );
  }

  const { summary, perDayCounts, weightSeries, countsSinceStart } = data;

  // normalize casing from the API (camelCase vs PascalCase)
  // const pdc = (perDayCounts as any[]).map(r => ({
  //   date: r.date ?? r.Date,
  //   eventCode: r.eventCode ?? r.EventCode,
  //   count: r.count ?? r.Count,
  // }));

  // const counts = (countsSinceStart as any[]).map(r => ({
  //   eventCode: r.eventCode ?? r.EventCode,
  //   total: r.total ?? r.Total,
  // }));


  // Utilities to bucket by your front-end definitions
  const sumCodes = (codes: string[]) =>
    countsSinceStart.filter(x => codes.includes(x.eventCode)).reduce((a, b) => a + b.total, 0);

  // Derive chart series
  const byDate: Record<string, Record<string, number>> = {};
  perDayCounts.forEach(({ date, eventCode, count }) => {
    if (!byDate[date]) byDate[date] = {};
    byDate[date][eventCode] = count;
  });
  const xDates = Object.keys(byDate).sort(); // YYYY-MM-DD strings
  const deliveriesSeries = xDates.map(d => EVENT_SETS.deliveries.reduce((acc, c) => acc + (byDate[d][c] || 0), 0));
  const incidentsParcelSeries = xDates.map(d => (byDate[d]['C007'] || 0));
  const incidentsBoxSeries = xDates.map(d => (byDate[d]['C009'] || 0));

  // Pie: event mix (last N days)
  const pieData = Object.entries(
    countsSinceStart.reduce((m, x) => { m[x.eventCode] = (m[x.eventCode] ?? 0) + x.total; return m; }, {} as Record<string, number>)
  ).map(([code, total]) => ({ label: `${code} ${EVENT_LABELS[code] ?? ''}`, value: total }));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      {/* Header with period dropdown and refresh button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">Dashboard</Typography>
          {lastUpdated && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={handlePeriodChange}
            >
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={14}>14 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ minWidth: 120 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Top stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Total Boxes" value={summary.totalBoxes} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Active Boxes" value={summary.activeBoxes} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title={`Deliveries (${selectedPeriod}d)`} value={sumCodes(EVENT_SETS.deliveries)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title={`Incidents (${selectedPeriod}d)`} value={sumCodes(EVENT_SETS.incidents)} />
        </Grid>
      </Grid>

      {/* Deliveries bar */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Deliveries (last {selectedPeriod} days)</Typography>
            <BarChart
              height={280}
              borderRadius={5}

              xAxis={[{ scaleType: 'band', data: xDates }]}
              series={[{ data: deliveriesSeries, label: 'Deliveries' }]}
            />
          </CardContent></Card>
        </Grid>

        {/* Incidents stacked */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Incidents (last {selectedPeriod} days)</Typography>
            <BarChart
              height={280}
              borderRadius={5}
              xAxis={[{ scaleType: 'band', data: xDates }]}
              series={[
                { data: incidentsParcelSeries, label: 'Parcel stolen (C007)', stack: 'inc' },
                { data: incidentsBoxSeries, label: 'Box stolen (C009)', stack: 'inc' },
              ]}
            />
          </CardContent></Card>
        </Grid>

        {/* Weight trend */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card><CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Average Weight (last {selectedPeriod} days)</Typography>
            <LineChart
              height={280}
              xAxis={[{
                scaleType: 'point', data: weightSeries.map(x => {
                  const d = new Date(x.date);
                  return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                })
              }]}
              series={[{ 
                data: weightSeries.map(x => x.avgWeight), 
                label: 'Avg weight (g)', 
                area: true,
                color: '#4255fb' //theme.palette.primary.main
              }]}
              sx={{
                '& .MuiAreaElement-root': {
                  fill: 'url(#organic)',
                }
              }}
            >
              <AreaGradient color="#4255fb" id="organic" />
            </LineChart>

          </CardContent></Card>
        </Grid>

        {/* Event mix */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Event mix (last {selectedPeriod} days)</Typography>
            <PieChart height={280} series={[{ data: pieData }]} />
          </CardContent></Card>
        </Grid>
      </Grid>
    </Container>
  );
}