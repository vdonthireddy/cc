import React from 'react';
import { Container, Typography, Grid, Paper, Box, CircularProgress, MenuItem, TextField, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { VegaEmbed } from 'react-vega';

const ParentDashboard: React.FC = () => {
  const [selectedStudentId, setSelectedStudentId] = React.useState<number | string>('');

  // Fetch all students associated with this parent
  const { data: students } = useQuery({
    queryKey: ['parent-students'],
    queryFn: async () => {
        const res = await axios.get('/api/parent/students/');
        return res.data;
    },
    retry: false
  });

  // Fetch data for the selected student
  const { data: studentData, isLoading, error } = useQuery({
    queryKey: ['parent-student-detail', selectedStudentId],
    queryFn: async () => {
        const url = selectedStudentId ? `/api/parent/?studentId=${selectedStudentId}` : '/api/parent/';
        const response = await axios.get(url);
        console.log('[PARENT DASHBOARD] Student Detail:', response.data);
        return response.data;
    },
    enabled: true, // Let it run, it will fallback to first student in backend if empty
    retry: false
  });

  React.useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  if (isLoading && !studentData) return (
    <Box display="flex" justifyContent="center" p={10}>
        <CircularProgress />
    </Box>
  );

  if (error) return <Box p={3}><Alert severity="error">Failed to load student data.</Alert></Box>;
  if (!studentData) return <Box p={3}><Typography>No student data found.</Typography></Box>;

  const gpaSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'GPA Trend',
    width: 600,
    height: 200,
    data: { values: JSON.parse(JSON.stringify(studentData?.academics || [])) },
    mark: { type: 'line', point: true },
    encoding: {
      x: { field: 'semester', type: 'ordinal', title: 'Semester', sort: null },
      y: { field: 'grade', type: 'quantitative', title: 'GPA', scale: { domain: [0, 5.0] } },
      tooltip: [
        { field: 'semester', type: 'ordinal' },
        { field: 'grade', type: 'quantitative', title: 'GPA' }
      ]
    },
  };

  const deadlineSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Upcoming Deadlines',
    width: 800,
    height: 150,
    data: { values: JSON.parse(JSON.stringify(studentData?.deadlines || [])) },
    mark: 'bar',
    encoding: {
      x: { field: 'date', type: 'temporal', title: 'Deadline' },
      y: { field: 'title', type: 'nominal', title: 'College/Task' },
      color: { value: '#1A365D' }
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Parent Portal: {studentData.name}
        </Typography>
        
        {Array.isArray(students) && students.length > 1 && (
          <TextField
            select
            label="Switch Child"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            sx={{ width: 200 }}
          >
            {students.map((s: any) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Academic Progress (GPA Trend)</Typography>
            <Box sx={{ width: '100%', height: 250 }}>
              <VegaEmbed key={`gpa-${selectedStudentId}-${studentData?.academics?.length}`} spec={gpaSpec} options={{ actions: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, boxShadow: 3, bgcolor: 'secondary.light', color: 'white' }}>
            <Typography variant="h6" gutterBottom>College Readiness %</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
              <Typography variant="h1" sx={{ fontWeight: 'bold' }}>
                {studentData.readinessScore || '0'}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Upcoming Deadlines</Typography>
            <Box sx={{ width: '100%', height: 200 }}>
              <VegaEmbed key={`deadlines-${selectedStudentId}-${studentData?.deadlines?.length}`} spec={deadlineSpec} options={{ actions: false }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ParentDashboard;
