import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, CardActions, 
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = import.meta.env.VITE_API_URL;

interface ECRecord {
  id: number;
  name: string;
  role: string;
  impactDescription: string;
  hoursPerWeek: number;
  weeksPerYear: number;
}

const StudentEC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const studentIdParam = searchParams.get('studentId');

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    impactDescription: '',
    hoursPerWeek: 0,
    weeksPerYear: 0
  });

  const { data: ecs } = useQuery(['ecs', studentIdParam], async () => {
    const url = `/api/ec${studentIdParam ? `?studentId=${studentIdParam}` : ''}`;
    console.log('[EC] Fetching from URL:', url);
    const res = await axios.get(url);
    return res.data;
  });

  const addMutation = useMutation((newEC: any) => 
    axios.post(`/api/ec`, { ...newEC, studentId: studentIdParam ? parseInt(studentIdParam) : undefined }), {
    onSuccess: () => {
      queryClient.invalidateQueries(['ecs', studentIdParam]);
      setOpen(false);
    }
  });

  const deleteMutation = useMutation((id: number) => 
    axios.delete(`/api/ec/${id}`), {
    onSuccess: () => {
      queryClient.invalidateQueries(['ecs', studentIdParam]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Extracurricular Logger {studentIdParam ? `(Student ID: ${studentIdParam})` : ''}</Typography>
      
      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={() => setOpen(true)}>Add Activity</Button>
      </Box>

      <Grid container spacing={3}>
        {Array.isArray(ecs) ? ecs.map((ec: ECRecord) => (
          <Grid item xs={12} md={6} lg={4} key={ec.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{ec.name}</Typography>
                <Typography color="text.secondary" gutterBottom>{ec.role}</Typography>
                <Typography variant="body2" mb={2}>{ec.impactDescription}</Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">Hours/Week: {ec.hoursPerWeek}</Typography>
                  <Typography variant="caption">Weeks/Year: {ec.weeksPerYear}</Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <IconButton onClick={() => deleteMutation.mutate(ec.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        )) : null}
        {(!Array.isArray(ecs) || ecs.length === 0) && (
          <Grid item xs={12}>
            <Typography align="center" color="text.secondary">No extracurricular activities logged yet.</Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Activity</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              id="ec-name"
              fullWidth label="Activity Name" margin="normal"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <TextField
              id="ec-role"
              fullWidth label="Role/Position" margin="normal"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            />
            <TextField
              id="ec-impact"
              fullWidth label="Impact/Description" margin="normal" multiline rows={3}
              value={formData.impactDescription}
              onChange={(e) => setFormData({...formData, impactDescription: e.target.value})}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  id="ec-hours"
                  fullWidth type="number" label="Hours Per Week" margin="normal"
                  value={formData.hoursPerWeek}
                  onChange={(e) => setFormData({...formData, hoursPerWeek: parseInt(e.target.value)})}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id="ec-weeks"
                  fullWidth type="number" label="Weeks Per Year" margin="normal"
                  value={formData.weeksPerYear}
                  onChange={(e) => setFormData({...formData, weeksPerYear: parseInt(e.target.value)})}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentEC;
