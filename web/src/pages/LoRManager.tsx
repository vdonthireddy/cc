import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const LoRManager: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  
  const studentIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('studentId');
  }, [location.search]);

  const userRole = user?.role?.toUpperCase();
  const isStaff = userRole === 'COUNSELOR' || userRole === 'ADMIN';

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    teacherName: '',
    subject: '',
  });

  const { data: students } = useQuery({
    queryKey: ['lorStudents'],
    queryFn: async () => {
      if (!isStaff) return [];
      const res = await axios.get('/api/counselor/students/');
      return res.data;
    },
    enabled: isStaff,
    retry: false
  });

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['lor-requests', studentIdParam],
    queryFn: async () => {
        const url = studentIdParam ? `/api/lor/?studentId=${studentIdParam}` : '/api/lor/';
        const response = await axios.get(url);
        return response.data;
    },
    retry: false
  });

  const addMutation = useMutation({
    mutationFn: (newRequest: any) => 
        axios.post('/api/lor/', {
            ...newRequest,
            studentId: studentIdParam ? parseInt(studentIdParam) : undefined,
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lor-requests', studentIdParam] });
      setOpen(false);
      setFormData({ teacherName: '', subject: '' });
    },
  });

  const handleStudentChange = (event: any) => {
    const newId = event.target.value;
    if (newId) {
      navigate(`/lor?studentId=${newId}`);
    } else {
      navigate('/lor');
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'requested': return 'warning';
      case 'sent': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  if (isLoading) return <Box display="flex" justifyContent="center" p={10}><CircularProgress /></Box>;

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          LoR Manager
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          New Request
        </Button>
      </Box>

      {isStaff && (
        <Paper sx={{ p: 3, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main', boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PersonSearchIcon color="primary" />
            <Typography variant="h6">View LoRs for Student</Typography>
          </Box>
          <FormControl fullWidth>
            <InputLabel id="student-select-label">Student</InputLabel>
            <Select
              labelId="student-select-label"
              id="student-select"
              value={studentIdParam || ''}
              label="Student"
              onChange={handleStudentChange}
            >
              <MenuItem value=""><em>Select a student...</em></MenuItem>
              {Array.isArray(students) && students.map((s: any) => (
                <MenuItem key={s.id} value={s.id}>{s.name} (Grade {s.grade})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>Failed to load LoR requests.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
            <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Teacher</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {Array.isArray(requests) && requests.length > 0 ? (
                requests.map((req: any) => (
                    <TableRow key={req.id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{req.teacherName}</TableCell>
                    <TableCell>{req.subject}</TableCell>
                    <TableCell>
                        <Chip label={req.status} color={getStatusColor(req.status)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{req.updatedAt ? new Date(req.updatedAt).toLocaleDateString() : 'Recently'}</TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No LoR requests found for this selection.</Typography>
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Request Recommendation</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Teacher Name"
              fullWidth
              required
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
            />
            <TextField
              label="Subject / Relationship"
              fullWidth
              placeholder="e.g. AP Biology Teacher, Math Club Advisor"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={() => addMutation.mutate(formData)} disabled={!formData.teacherName || addMutation.isLoading}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoRManager;
