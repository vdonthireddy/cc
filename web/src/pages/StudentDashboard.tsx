import React from 'react';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, Divider, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { VegaEmbed } from 'react-vega';

const StudentDashboard: React.FC = () => {
  const { data: readiness, isLoading: readinessLoading } = useQuery(['readiness'], async () => {
    const res = await axios.get('/api/academic/readiness/');
    return res.data;
  });

  const { data: gpaTrend, isLoading: trendLoading } = useQuery(['gpaTrend'], async () => {
    const res = await axios.get('/api/academic/report-data/');
    return res.data;
  });

  const { data: ecs, isLoading: ecsLoading } = useQuery(['ecs-summary'], async () => {
    const res = await axios.get('/api/ec/');
    return res.data;
  });

  const { data: detailData, isLoading: detailLoading } = useQuery(['studentDetail'], async () => {
    // This is primarily for parent view but can be used for summary in dashboard
    const res = await axios.get('/api/parent/'); 
    return res.data;
  }, { retry: false });

  if (readinessLoading || trendLoading || ecsLoading) return <CircularProgress />;

  const gpaSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 200,
    data: { values: Array.isArray(gpaTrend) ? gpaTrend : [] },
    mark: { type: 'line', point: true, color: '#1A365D' },
    encoding: {
      x: { field: 'semester', type: 'ordinal', title: 'Semester', sort: null },
      y: { field: 'gpa', type: 'quantitative', title: 'GPA', scale: { domain: [0, 5.0] } },
      tooltip: [
        { field: 'semester', type: 'ordinal' },
        { field: 'gpa', type: 'quantitative' },
        { field: 'course', type: 'nominal' }
      ]
    },
  };

  const ecData = Array.isArray(ecs) ? ecs.map(ec => ({
    name: ec.name,
    hours: ec.hoursPerWeek * ec.weeksPerYear
  })) : [];

  const ecSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 150,
    height: 150,
    data: { values: ecData },
    mark: { type: 'arc', innerRadius: 40 },
    encoding: {
      theta: { field: 'hours', type: 'quantitative' },
      color: { field: 'name', type: 'nominal', legend: null },
      tooltip: [
        { field: 'name', type: 'nominal' },
        { field: 'hours', type: 'quantitative', title: 'Annual Hours' }
      ]
    },
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>Student Dashboard</Typography>
        <Paper sx={{ px: 2, py: 1, bgcolor: 'secondary.main', color: 'white' }}>
          <Typography variant="subtitle2">Readiness Score: {readiness?.readinessScore}%</Typography>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* GPA Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Academic Performance (Weighted GPA)</Typography>
            <Box sx={{ width: '100%', height: 250 }}>
              {gpaTrend && gpaTrend.length > 0 ? (
                <VegaEmbed spec={gpaSpec} options={{ actions: false }} style={{ width: '100%' }} />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography color="text.secondary">No academic records found. Add courses in the Academic tab.</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* EC Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 350, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Activity Distribution</Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {ecData.length > 0 ? (
                <VegaEmbed spec={ecSpec} options={{ actions: false }} />
              ) : (
                <Typography color="text.secondary" align="center">No activities logged yet.</Typography>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Breakdown by total annual hours
            </Typography>
          </Paper>
        </Grid>

        {/* Next Deadlines & Milestones */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Upcoming Deadlines</Typography>
            <List>
              {detailData?.deadlines && detailData.deadlines.length > 0 ? detailData.deadlines.slice(0, 4).map((d: any, idx: number) => (
                <React.Fragment key={idx}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary={d.title} 
                      secondary={new Date(d.date).toLocaleDateString()} 
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                  {idx < detailData.deadlines.length - 1 && <Divider />}
                </React.Fragment>
              )) : (
                <Typography color="text.secondary">No upcoming college deadlines.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Next Milestones</Typography>
            <List>
              {readiness?.milestones?.map((m: any, idx: number) => (
                <React.Fragment key={idx}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary={m.task} 
                      secondary={m.status} 
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondaryTypographyProps={{ 
                        color: m.status === 'Done' ? 'success.main' : 'warning.main',
                        fontWeight: 'bold'
                      }}
                    />
                  </ListItem>
                  {idx < readiness.milestones.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
