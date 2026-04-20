import React from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { VegaEmbed } from 'react-vega';

const ParentDashboard: React.FC = () => {
  // Fetch the student data associated with this parent
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['parent-student-data'],
    queryFn: async () => {
      const response = await axios.get('/api/parent/student');
      return response.data;
    },
  });

  if (isLoading) return <Typography>Loading student data...</Typography>;
  if (!studentData) return <Typography>No student data found or permission denied.</Typography>;

  const gpaSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'GPA Trend',
    width: 'container',
    height: 200,
    data: { values: Array.isArray(studentData?.academics) ? studentData.academics : [] },
    mark: 'line',
    encoding: {
      x: { field: 'semester', type: 'ordinal', title: 'Semester' },
      y: { field: 'grade', type: 'quantitative', title: 'GPA', scale: { domain: [0, 4.5] } },
      tooltip: [
        { field: 'courseName', type: 'nominal' },
        { field: 'grade', type: 'quantitative' }
      ]
    },
  };

  const deadlineSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Upcoming Deadlines',
    width: 'container',
    height: 150,
    data: { values: Array.isArray(studentData?.deadlines) ? studentData.deadlines : [] },
    mark: 'bar',
    encoding: {
      x: { field: 'date', type: 'temporal', title: 'Deadline' },
      y: { field: 'title', type: 'nominal', title: 'College/Task' },
      color: { value: '#1A365D' }
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Parent Dashboard: {studentData.name}'s Progress
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Academic Progress (GPA Trend)</Typography>
            <Box sx={{ width: '100%', height: 250 }}>
              <VegaEmbed spec={gpaSpec} options={{ actions: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>College Readiness %</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
              <Typography variant="h2" color="secondary">
                {studentData.readinessScore || '75'}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Upcoming Deadlines</Typography>
            <Box sx={{ width: '100%', height: 200 }}>
              <VegaEmbed spec={deadlineSpec} options={{ actions: false }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ParentDashboard;
