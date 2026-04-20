import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Checkbox, FormControlLabel,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = import.meta.env.VITE_API_URL;

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
  const searchParams = new URLSearchParams(location.search);
  const studentIdParam = searchParams.get('studentId');

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

  const { data: records, isLoading } = useQuery(['academics', studentIdParam], async () => {
    const url = `/api/academic${studentIdParam ? `?studentId=${studentIdParam}` : ''}`;
    console.log('[ACADEMIC] Fetching from URL:', url);
    const res = await axios.get(url);
    return res.data;
  });

  const { data: gpaData } = useQuery(['gpa', studentIdParam], async () => {
    const url = `/api/academic/gpa${studentIdParam ? `?studentId=${studentIdParam}` : ''}`;
    console.log('[GPA] Fetching from URL:', url);
    const res = await axios.get(url);
    return res.data;
  });

  const addMutation = useMutation((newRecord: any) => 
    axios.post(`/api/academic`, { ...newRecord, studentId: studentIdParam ? parseInt(studentIdParam) : undefined }), {
    onSuccess: () => {
      queryClient.invalidateQueries(['academics', studentIdParam]);
      queryClient.invalidateQueries(['gpa', studentIdParam]);
      setOpen(false);
    }
  });

  const deleteMutation = useMutation((id: number) => 
    axios.delete(`/api/academic/${id}`), {
    onSuccess: () => {
      queryClient.invalidateQueries(['academics', studentIdParam]);
      queryClient.invalidateQueries(['gpa', studentIdParam]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const semesters = ['Fall', 'Spring', 'Summer', 'Winter'];
  const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Academic Tracker {studentIdParam ? `(Student ID: ${studentIdParam})` : ''}</Typography>
      
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">Current GPA</Typography>
            <Typography variant="h3">{gpaData?.currentGPA ? Number(gpaData.currentGPA).toFixed(2) : '0.00'}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={() => setOpen(true)}>Add Course</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(records) ? records.map((row: AcademicRecord) => (
              <TableRow key={row.id}>
                <TableCell>{row.courseName}</TableCell>
                <TableCell>{row.semester}</TableCell>
                <TableCell>{row.year}</TableCell>
                <TableCell>{row.grade}</TableCell>
                <TableCell>{row.credits}</TableCell>
                <TableCell>
                  {row.isAP ? 'AP' : (row.isHonors ? 'Honors' : 'Regular')}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => deleteMutation.mutate(row.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            )) : null}
            {(!Array.isArray(records) || records.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} align="center">No records found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Course</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              id="course-name"
              fullWidth label="Course Name" margin="normal"
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
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
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
                  onChange={(e) => setFormData({...formData, credits: parseFloat(e.target.value)})}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={<Checkbox checked={formData.isAP} onChange={(e) => setFormData({...formData, isAP: e.target.checked, isHonors: false})} />}
              label="AP Course"
            />
            <FormControlLabel
              control={<Checkbox checked={formData.isHonors} onChange={(e) => setFormData({...formData, isHonors: e.target.checked, isAP: false})} />}
              label="Honors Course"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.courseName}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAcademic;
