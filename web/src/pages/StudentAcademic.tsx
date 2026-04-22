import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Checkbox, FormControlLabel,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem, CircularProgress, Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';

interface AcademicRecord {
  id: number;
  courseName: string;
  grade: string;
  credits: number;
  semester: string;
  year: number;
  isAP: boolean;
  isHonors: boolean;
}

const StudentAcademic = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Memoize search params to prevent unnecessary query triggers
  const studentIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('studentId');
  }, [location.search]);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseName: '',
    grade: 'A',
    credits: 4,
    semester: 'Fall',
    year: new Date().getFullYear(),
    isAP: false,
    isHonors: false
  });

  const { data: records, isLoading: recordsLoading, error: recordsError } = useQuery(['academics', studentIdParam], async () => {
    const url = studentIdParam ? `/api/academic/?studentId=${studentIdParam}` : '/api/academic/';
    const res = await axios.get(url);
    return res.data;
  }, { retry: false });

  const { data: gpaData, isLoading: gpaLoading, error: gpaError } = useQuery(['gpa', studentIdParam], async () => {
    const url = studentIdParam ? `/api/academic/gpa/?studentId=${studentIdParam}` : '/api/academic/gpa/';
    const res = await axios.get(url);
    return res.data;
  }, { retry: false });

  const addMutation = useMutation((newRecord: any) => 
    axios.post(`/api/academic/`, { ...newRecord, studentId: studentIdParam ? parseInt(studentIdParam) : undefined }), {
    onSuccess: () => {
      queryClient.invalidateQueries(['academics', studentIdParam]);
      queryClient.invalidateQueries(['gpa', studentIdParam]);
      setOpen(false);
      setFormData({
        courseName: '',
        grade: 'A',
        credits: 4,
        semester: 'Fall',
        year: new Date().getFullYear(),
        isAP: false,
        isHonors: false
      });
    }
  });

  const deleteMutation = useMutation((id: number) => 
    axios.delete(`/api/academic/${id}/`), {
    onSuccess: () => {
      queryClient.invalidateQueries(['academics', studentIdParam]);
      queryClient.invalidateQueries(['gpa', studentIdParam]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseName) return;
    addMutation.mutate(formData);
  };

  const semesters = ['Fall', 'Spring', 'Summer', 'Winter'];
  const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

  if (recordsLoading || gpaLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={10}>
        <CircularProgress size={60} thickness={4} />
        <Typography sx={{ mt: 2 }} color="text.secondary">Loading academic records...</Typography>
      </Box>
    );
  }

  if (recordsError || gpaError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load academic data. This might be due to a missing student profile or connection issue.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Academic Tracker {studentIdParam ? `(Student ID: ${studentIdParam})` : ''}
      </Typography>
      
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 2, boxShadow: 4 }}>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>Current Weighted GPA</Typography>
            <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                {gpaData?.currentGPA ? Number(gpaData.currentGPA).toFixed(2) : '0.00'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box mb={3} display="flex" justifyContent="flex-end">
        <Button variant="contained" size="large" onClick={() => setOpen(true)} startIcon={<span>+</span>} sx={{ px: 4 }}>
          Add Course
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Year</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Credits</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(records) && records.length > 0 ? records.map((row: AcademicRecord) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 'medium' }}>{row.courseName}</TableCell>
                <TableCell>{row.semester}</TableCell>
                <TableCell>{row.year}</TableCell>
                <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{row.grade}</Typography>
                </TableCell>
                <TableCell>{row.credits}</TableCell>
                <TableCell>
                  {row.isAP ? (
                    <Typography variant="caption" sx={{ bgcolor: 'secondary.light', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold' }}>AP</Typography>
                  ) : (row.isHonors ? (
                    <Typography variant="caption" sx={{ bgcolor: 'info.light', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold' }}>Honors</Typography>
                  ) : 'Regular')}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => deleteMutation.mutate(row.id)} color="error" size="small" disabled={deleteMutation.isLoading}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No academic records found. Start by adding your courses.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add New Academic Record</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              id="course-name"
              required
              fullWidth label="Course Name" margin="normal"
              placeholder="e.g. AP Calculus BC, English 10 Honors"
              value={formData.courseName}
              onChange={(e) => setFormData({...formData, courseName: e.target.value})}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  id="semester-select"
                  fullWidth select label="Semester" margin="normal"
                  value={formData.semester}
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                >
                  {semesters?.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id="year-input"
                  fullWidth type="number" label="Year" margin="normal"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id="grade-select"
                  fullWidth select label="Grade" margin="normal"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                >
                  {grades?.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id="credits-input"
                  fullWidth type="number" label="Credits" margin="normal"
                  value={formData.credits}
                  onChange={(e) => setFormData({...formData, credits: parseFloat(e.target.value) || 0})}
                />
              </Grid>
            </Grid>
            <Box mt={2}>
                <FormControlLabel
                control={<Checkbox checked={formData.isAP} onChange={(e) => setFormData({...formData, isAP: e.target.checked, isHonors: false})} />}
                label="Advanced Placement (AP)"
                />
                <FormControlLabel
                control={<Checkbox checked={formData.isHonors} onChange={(e) => setFormData({...formData, isHonors: e.target.checked, isAP: false})} />}
                label="Honors Course"
                />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.courseName || addMutation.isLoading}>
            {addMutation.isLoading ? <CircularProgress size={24} /> : 'Save Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAcademic;
