import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '@mui/material';
import { useAuthStore } from '../store/authStore';

const LoRManager: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    teacherName: '',
    teacherEmail: '',
    deadline: '',
  });

  const { data: requests, isLoading } = useQuery(['lor-requests'], async () => {
    const response = await axios.get(`/api/lor${user?.role === 'STUDENT' ? `?studentId=${user?.studentId || 1}` : ''}`);
    return response.data;
  });

  const mutation = useMutation(
    async (newRequest: any) => {
      const response = await axios.post('/api/lor/request', {
        ...newRequest,
        studentId: user?.studentId || 1,
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lor-requests']);
        setOpen(false);
        setFormData({ teacherName: '', teacherEmail: '', deadline: '' });
      },
    }
  );

  const handleSubmit = () => {
    mutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'requested': return 'warning';
      case 'sent': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Letter of Recommendation Manager
        </Typography>
        {user?.role === 'STUDENT' && (
          <Button variant="contained" color="secondary" onClick={() => setOpen(true)}>
            Request LoR
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              {user?.role === 'COUNSELOR' && <TableCell sx={{ color: 'white' }}>Student</TableCell>}
              <TableCell sx={{ color: 'white' }}>Teacher</TableCell>
              <TableCell sx={{ color: 'white' }}>Email</TableCell>
              <TableCell sx={{ color: 'white' }}>Deadline</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
            ) : Array.isArray(requests) ? (
              requests?.map((req: any) => (
                <TableRow key={req.id}>
                  {user?.role === 'COUNSELOR' && (
                    <TableCell>{req.student?.user?.name || 'Unknown'}</TableCell>
                  )}
                  <TableCell>{req.teacherName}</TableCell>
                  <TableCell>{req.teacherEmail}</TableCell>
                  <TableCell>{req.deadline ? new Date(req.deadline).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={req.status} color={getStatusColor(req.status)} size="small" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} align="center">No LOR requests found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Request Letter of Recommendation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Teacher Name"
              fullWidth
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
            />
            <TextField
              label="Teacher Email"
              type="email"
              fullWidth
              value={formData.teacherEmail}
              onChange={(e) => setFormData({ ...formData, teacherEmail: e.target.value })}
            />
            <TextField
              label="Deadline"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={mutation.isLoading}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoRManager;
