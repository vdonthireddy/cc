import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { VegaEmbed } from 'react-vega';

const CounselorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null);

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery(['counselorStudents'], async () => {
    const res = await axios.get('/api/counselor/students/');
    return res.data;
  });

  const { data: stats, isLoading: statsLoading } = useQuery(['counselorStats'], async () => {
    const res = await axios.get('/api/counselor/stats/');
    return res.data;
  });

  const { data: reportData, isLoading: reportLoading } = useQuery(
    ['reportData', selectedStudent?.id],
    async () => {
      if (!selectedStudent) return null;
      const res = await axios.get(`/api/academic/report-data/?studentId=${selectedStudent.id}`);
      return res.data;
    },
    { enabled: !!selectedStudent && reportOpen }
  );

  if (studentsLoading || statsLoading) return <CircularProgress />;
  if (studentsError) return <Alert severity="error">Error loading dashboard data</Alert>;

  const progressSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Student Academic Progress',
    width: 400,
    height: 300,
    data: { values: Array.isArray(reportData) ? reportData : [] },
    mark: { type: 'line', point: true },
    encoding: {
      x: { field: 'semester', type: 'ordinal', title: 'Semester', sort: null },
      y: { field: 'gpa', type: 'quantitative', title: 'GPA', scale: { domain: [0, 4.5] } },
      tooltip: [
        { field: 'semester', type: 'ordinal' },
        { field: 'gpa', type: 'quantitative' },
        { field: 'course', type: 'nominal' }
      ]
    },
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Counselor Panel
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h6" gutterBottom>Average GPA</Typography>
            <Typography variant="h2" sx={{ fontWeight: 'bold' }}>{stats?.avgGpa ? Number(stats.avgGpa).toFixed(2) : '0.00'}</Typography>
            <Typography variant="body2">Cohort 2024 ({stats?.totalStudents ?? 0} students)</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>Student Overview</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>GPA</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Risk</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Manage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(students) ? students.map((student: any) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{student.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{student.email}</Typography>
                      </TableCell>
                      <TableCell align="right">{student.grade}</TableCell>
                      <TableCell align="right">{student.gpa}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={student.riskLevel} 
                          color={student.riskLevel === 'High' ? 'error' : student.riskLevel === 'Medium' ? 'warning' : 'success'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <IconButton size="small" title="Roadmap" onClick={() => { window.location.href = `/roadmap?studentId=${student.id}`; }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="primary" title="Academics" onClick={() => { window.location.href = `/academic?studentId=${student.id}`; }}>
                            <SchoolIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary" title="Clubs" onClick={() => { window.location.href = `/ec?studentId=${student.id}`; }}>
                            <GroupIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="info" title="Progress Report" onClick={() => { setSelectedStudent(student); setReportOpen(true); }}>
                            <AssessmentIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No students found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Progress Report Dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Academic Progress: {selectedStudent?.name}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          {reportLoading ? (
            <CircularProgress />
          ) : Array.isArray(reportData) && reportData.length > 0 ? (
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <VegaEmbed spec={progressSpec} options={{ actions: false }} />
            </Box>
          ) : (
            <Typography color="text.secondary">No academic data available for this student.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>Close</Button>
          <Button variant="contained" color="primary" onClick={() => window.print()}>Print Report</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CounselorDashboard;
