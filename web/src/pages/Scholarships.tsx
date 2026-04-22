import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import { PersonSearch as PersonSearchIcon, EmojiEvents as ScholarshipIcon } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const Scholarships: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const studentIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('studentId');
  }, [location.search]);

  const userRole = user?.role?.toUpperCase();
  const isStaff = userRole === 'COUNSELOR' || userRole === 'ADMIN';

  const { data: students } = useQuery({
    queryKey: ['scholarshipStudents'],
    queryFn: async () => {
      if (!isStaff) return [];
      const res = await axios.get('/api/counselor/students/');
      return res.data;
    },
    enabled: isStaff,
    retry: false
  });

  const { data: scholarships, isLoading, error } = useQuery({
    queryKey: ['scholarships', studentIdParam],
    queryFn: async () => {
        const url = studentIdParam ? `/api/scholarships/?studentId=${studentIdParam}` : '/api/scholarships/';
        const res = await axios.get(url);
        return res.data;
    },
    retry: false
  });

  const handleStudentChange = (event: any) => {
    const newId = event.target.value;
    if (newId) {
      navigate(`/scholarships?studentId=${newId}`);
    } else {
      navigate('/scholarships');
    }
  };

  if (isLoading) return <Box display="flex" justifyContent="center" p={10}><CircularProgress /></Box>;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
        <ScholarshipIcon fontSize="large" />
        Scholarship Matcher
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        Discover opportunities matched to your academic profile and interests.
      </Typography>

      {isStaff && (
        <Paper sx={{ p: 3, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main', boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PersonSearchIcon color="primary" />
            <Typography variant="h6">Match Scholarships for Student</Typography>
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
        <Alert severity="error">Failed to load scholarships.</Alert>
      ) : (
        <Grid container spacing={3}>
          {Array.isArray(scholarships) && scholarships.length > 0 ? (
            scholarships.map((s: any) => (
              <Grid item xs={12} md={6} key={s.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '4px solid', borderColor: 'secondary.main', transition: '0.3s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>{s.name}</Typography>
                      <Chip label={`$${s.amount.toLocaleString()}`} color="success" sx={{ fontWeight: 'bold' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {s.description}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'text.disabled' }}>Requirements</Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip label={`Min GPA: ${s.minGpa}`} size="small" variant="outlined" />
                      <Chip label="Application Required" size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, bgcolor: '#fafafa' }}>
                    <Button size="small" variant="contained" fullWidth>Apply Now</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'transparent', border: '2px dashed #e0e0e0' }}>
                <Typography color="text.secondary">No scholarships matches found for this selection.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Scholarships;
