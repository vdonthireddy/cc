import React from 'react';
import { 
  Box, Typography, Grid, Paper, CircularProgress, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Alert, Divider, LinearProgress, TextField, MenuItem
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { VegaEmbed } from 'react-vega';
import { useAuthStore } from '../store/authStore';

const Reports: React.FC = () => {
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase();
  const [selectedStudentId, setSelectedStudentId] = React.useState<number | string>('');

  const { data: parentStudents } = useQuery({
    queryKey: ['parent-students-reports'],
    queryFn: async () => {
        if (role !== 'PARENT') return [];
        const res = await axios.get('/api/parent/students/');
        return res.data;
    },
    enabled: role === 'PARENT',
    retry: false
  });

  React.useEffect(() => {
    if (parentStudents && parentStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(parentStudents[0].id);
    }
  }, [parentStudents, selectedStudentId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', role, selectedStudentId],
    queryFn: async () => {
        let endpoint = '';
        if (role === 'ADMIN') endpoint = '/api/admin/reports/';
        else if (role === 'COUNSELOR') endpoint = '/api/counselor/reports/';
        else {
          endpoint = '/api/academic/readiness/';
          if (selectedStudentId) endpoint += `?studentId=${selectedStudentId}`;
        }
        const res = await axios.get(endpoint);
        return res.data;
    },
    retry: false
  });

  if (isLoading) return (
    <Box display="flex" justifyContent="center" p={10}>
        <CircularProgress />
    </Box>
  );
  
  if (error) return <Box p={3}><Alert severity="error">Failed to load report data.</Alert></Box>;

  // --- Admin Visuals ---
  const adminEnrollmentSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 400, height: 250,
    data: { values: data?.enrollment || [] },
    mark: 'bar',
    encoding: {
      x: { field: 'grade', type: 'ordinal', title: 'Grade' },
      y: { field: 'count', type: 'quantitative', title: 'Students' },
      color: { value: '#1A365D' }
    }
  };

  const adminWorkloadSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 400, height: 250,
    data: { values: data?.workload || [] },
    mark: 'bar',
    encoding: {
      y: { field: 'name', type: 'nominal', title: 'Counselor', sort: '-x' },
      x: { field: 'studentCount', type: 'quantitative', title: 'Students' },
      color: { field: 'studentCount', type: 'quantitative', scale: { scheme: 'purples' } }
    }
  };

  // --- Counselor Visuals ---
  const counselorFunnelSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Application Pipeline',
    width: 300, height: 200,
    data: { values: data?.funnel || [] },
    mark: { type: 'bar', cornerRadiusEnd: 4 },
    encoding: {
      x: { field: 'count', type: 'quantitative', title: 'Count' },
      y: { field: 'status', type: 'nominal', title: 'Stage', sort: '-x' },
      color: { field: 'status', type: 'nominal', scale: { scheme: 'tableau20' } }
    }
  };

  const counselorCollegesSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 300, height: 200,
    data: { values: data?.topColleges || [] },
    mark: 'bar',
    encoding: {
      x: { field: 'interestCount', type: 'quantitative', title: 'Students Interested' },
      y: { field: 'name', type: 'nominal', title: 'College', sort: '-x' },
      color: { value: '#ff7f0e' }
    }
  };

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {role} Analytics Report
        </Typography>
        {role === 'PARENT' && Array.isArray(parentStudents) && parentStudents.length > 1 && (
          <TextField select label="Switch Child" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} sx={{ width: 200 }} size="small">
            {parentStudents.map((s: any) => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
          </TextField>
        )}
      </Box>
      <Divider sx={{ mb: 4 }} />

      {role === 'ADMIN' && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Enrollment</Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                    <VegaEmbed spec={adminEnrollmentSpec} options={{ actions: false }} />
                </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Counselor Workload</Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                    <VegaEmbed spec={adminWorkloadSpec} options={{ actions: false }} />
                </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {role === 'COUNSELOR' && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Cohort Application Pipeline</Typography>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                <VegaEmbed spec={counselorFunnelSpec} options={{ actions: false }} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Top Target Colleges</Typography>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                <VegaEmbed spec={counselorCollegesSpec} options={{ actions: false }} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                Priority Action List: Students Needing Support
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Showing students with GPA &lt; 2.8 or very few extracurricular activities recorded.
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fff5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>GPA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>EC Count</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.priorityList?.map((s: any) => (
                      <TableRow key={s.email} hover>
                        <TableCell>{s.name}</TableCell>
                        <TableCell sx={{ color: s.currentGpa < 2.5 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>{s.currentGpa}</TableCell>
                        <TableCell>{s.ecCount}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={s.currentGpa < 2.8 ? 'Academic Risk' : 'Low Engagement'} 
                            color={s.currentGpa < 2.5 ? 'error' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {(role === 'STUDENT' || role === 'PARENT') && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6">Overall Readiness Score</Typography>
              <Typography variant="h1" sx={{ my: 2, fontWeight: 'bold' }}>{data?.readinessScore}</Typography>
              <LinearProgress variant="determinate" value={data?.readinessScore} color="secondary" sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.2)' }} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>College Benchmarks (GPA Comparison)</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tier</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Target Median</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Your GPA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Gap</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.benchmarks?.map((b: any) => (
                      <TableRow key={b.college}>
                        <TableCell>{b.college}</TableCell>
                        <TableCell>{b.medianGpa}</TableCell>
                        <TableCell>{data.currentGpa}</TableCell>
                        <TableCell>
                          <Chip label={b.diff >= 0 ? `+${b.diff}` : b.diff} color={b.diff >= 0 ? "success" : "warning"} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports;
