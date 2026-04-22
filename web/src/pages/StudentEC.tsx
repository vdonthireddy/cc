import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, CardActions, 
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
  IconButton, Chip, Tooltip, Alert, Snackbar, CircularProgress, Divider
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import SearchIcon from '@mui/icons-material/Search';
import TimerIcon from '@mui/icons-material/Timer';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import StarIcon from '@mui/icons-material/Star';
import { useAuthStore } from '../store/authStore';

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
  const { user } = useAuthStore();

  const studentIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('studentId');
  }, [location.search]);

  const userRole = user?.role?.toUpperCase();
  const isStaffView = !!studentIdParam && (userRole === 'COUNSELOR' || userRole === 'ADMIN');
  const isStaff = userRole === 'COUNSELOR' || userRole === 'ADMIN';

  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    impactDescription: '',
    hoursPerWeek: 0,
    weeksPerYear: 0
  });

  const queryEnabled = !isStaff || !!studentIdParam;

  const { data: ecs, isLoading, error } = useQuery({
    queryKey: ['ecs', studentIdParam],
    queryFn: async () => {
        const url = studentIdParam ? `/api/ec/?studentId=${studentIdParam}` : '/api/ec/';
        const res = await axios.get(url);
        return res.data;
    },
    enabled: queryEnabled,
    retry: false
  });

  const addMutation = useMutation({
    mutationFn: (newEC: any) => 
        axios.post(`/api/ec/`, { ...newEC, studentId: studentIdParam ? parseInt(studentIdParam) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecs', studentIdParam] });
      setOpen(false);
      setFormData({ name: '', role: '', impactDescription: '', hoursPerWeek: 0, weeksPerYear: 0 });
      setSnackbar({ open: true, message: 'Activity logged successfully!', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to log activity.', severity: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/ec/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecs', studentIdParam] });
      setSnackbar({ open: true, message: 'Activity deleted.', severity: 'success' });
    }
  });

  const discoveryMutation = useMutation({
    mutationFn: () => axios.post(`/api/ec/find-clubs`, { studentId: studentIdParam ? parseInt(studentIdParam) : user?.studentId }),
    onSuccess: (data) => {
      setSnackbar({ open: true, message: 'Scout agent triggered! Checking for matches...', severity: 'success' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    addMutation.mutate(formData);
  };

  const totalHours = useMemo(() => {
    return Array.isArray(ecs) ? ecs.reduce((acc, curr) => acc + (curr.hoursPerWeek * curr.weeksPerYear), 0) : 0;
  }, [ecs]);

  if (queryEnabled && isLoading) return <Box display="flex" justifyContent="center" p={10}><CircularProgress size={60} /></Box>;

  if (queryEnabled && error) return <Box p={3}><Alert severity="error">Failed to load extracurricular activities.</Alert></Box>;

  return (
    <Box p={3} sx={{ maxWidth: 1200, margin: '0 auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
            <HistoryEduIcon fontSize="large" />
            Extracurricular Logger
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isStaffView ? `Reviewing records for Student ID: ${studentIdParam}` : "Build your profile by tracking your activities, roles, and impact."}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          {!isStaffView && (
            <Button 
              variant="outlined" 
              startIcon={<SearchIcon />} 
              onClick={() => discoveryMutation.mutate()}
              disabled={discoveryMutation.isLoading}
            >
              Discover Clubs
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpen(true)}
            sx={{ boxShadow: 2 }}
            disabled={!queryEnabled}
          >
            Add Activity
          </Button>
        </Box>
      </Box>

      {!queryEnabled ? (
          <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'transparent', border: '2px dashed #e0e0e0' }}>
              <Typography color="text.secondary">Please select a student from the dashboard or roadmap to manage their activities.</Typography>
          </Paper>
      ) : (
          <>
            {/* Summary Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', display: 'flex', alignItems: 'center', gap: 2, boxShadow: 3 }}>
                    <StarIcon />
                    <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{Array.isArray(ecs) ? ecs.length : 0}</Typography>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Total Activities</Typography>
                    </Box>
                </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'white', display: 'flex', alignItems: 'center', gap: 2, boxShadow: 3 }}>
                    <TimerIcon />
                    <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalHours}</Typography>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Total Annual Hours</Typography>
                    </Box>
                </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'white', display: 'flex', alignItems: 'center', gap: 2, boxShadow: 3 }}>
                    <EventAvailableIcon />
                    <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {Array.isArray(ecs) ? Math.round(ecs.reduce((acc, curr) => acc + curr.weeksPerYear, 0) / (ecs.length || 1)) : 0}
                    </Typography>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Avg Weeks/Activity</Typography>
                    </Box>
                </Paper>
                </Grid>
            </Grid>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
                {Array.isArray(ecs) && ecs.length > 0 ? ecs.map((ec: ECRecord) => (
                <Grid item xs={12} md={6} lg={4} key={ec.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>{ec.name}</Typography>
                        <Chip size="small" label={`${ec.hoursPerWeek}h/wk`} color="primary" variant="outlined" />
                        </Box>
                        <Typography variant="subtitle2" color="secondary" sx={{ mb: 2, fontWeight: 'medium' }}>
                        {ec.role || 'Participant'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                        }}>
                        {ec.impactDescription || 'No description provided.'}
                        </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.disabled">
                        {ec.weeksPerYear} weeks per year
                        </Typography>
                        <Tooltip title="Delete Activity">
                        <IconButton onClick={() => deleteMutation.mutate(ec.id)} color="error" size="small" disabled={deleteMutation.isLoading}>
                            <DeleteIcon />
                        </IconButton>
                        </Tooltip>
                    </Box>
                    </Card>
                </Grid>
                )) : (
                <Grid item xs={12}>
                    <Paper sx={{ p: 8, textAlign: 'center', border: '2px dashed #e0e0e0', bgcolor: 'transparent' }}>
                    <HistoryEduIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No activities logged yet.</Typography>
                    <Typography variant="body2" color="text.disabled" mb={3}>Start building your extracurricular profile today!</Typography>
                    <Button variant="outlined" onClick={() => setOpen(true)}>Add Your First Activity</Button>
                    </Paper>
                </Grid>
                )}
            </Grid>
          </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add New Extracurricular Activity</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              required
              fullWidth label="Activity Name" margin="normal"
              placeholder="e.g. Varsity Debate Team, Volunteer at Food Bank"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <TextField
              fullWidth label="Your Role / Position" margin="normal"
              placeholder="e.g. Captain, Volunteer, Lead Developer"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            />
            <TextField
              fullWidth label="Impact & Description" margin="normal" multiline rows={4}
              placeholder="What did you achieve? Who did you help? What were your responsibilities?"
              value={formData.impactDescription}
              onChange={(e) => setFormData({...formData, impactDescription: e.target.value})}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth type="number" label="Hours Per Week" margin="normal"
                  value={formData.hoursPerWeek}
                  onChange={(e) => setFormData({...formData, hoursPerWeek: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth type="number" label="Weeks Per Year" margin="normal"
                  value={formData.weeksPerYear}
                  onChange={(e) => setFormData({...formData, weeksPerYear: parseInt(e.target.value) || 0})}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name || addMutation.isLoading}>
            {addMutation.isLoading ? <CircularProgress size={24} /> : 'Save Activity'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentEC;
