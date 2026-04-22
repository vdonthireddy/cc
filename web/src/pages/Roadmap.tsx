import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert
} from '@mui/material';
import { School as SchoolIcon, PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

interface RoadmapYear {
  year: number;
  courses: string[];
}

const Roadmap: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const studentId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('studentId');
  }, [location.search]);

  const userRole = user?.role?.toUpperCase();
  const isStaff = userRole === 'COUNSELOR' || userRole === 'ADMIN';

  const { data: students } = useQuery({
    queryKey: ['roadmapStudents'],
    queryFn: async () => {
      if (!isStaff) return [];
      const res = await axios.get('/api/counselor/students/');
      return res.data;
    },
    enabled: isStaff,
    retry: false
  });

  const { data: roadmap, isLoading, error } = useQuery<RoadmapYear[]>({
    queryKey: ['roadmap', studentId],
    queryFn: async () => {
      if (isStaff && !studentId) return [];
      const url = studentId ? `/api/roadmap/?studentId=${studentId}` : '/api/roadmap/';
      const response = await axios.get(url);
      return response.data;
    },
    enabled: !isStaff || !!studentId,
    retry: false
  });

  const handleStudentChange = (event: any) => {
    const newId = event.target.value;
    if (newId) {
      navigate(`/roadmap?studentId=${newId}`);
    } else {
      navigate('/roadmap');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={10}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }} color="text.secondary">Loading roadmap...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Academic Roadmap
      </Typography>
      
      {isStaff && (
        <Paper sx={{ p: 3, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main', boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PersonSearchIcon color="primary" />
            <Typography variant="h6">Select Student to View Roadmap</Typography>
          </Box>
          <FormControl fullWidth>
            <InputLabel id="student-select-label">Student</InputLabel>
            <Select
              labelId="student-select-label"
              id="student-select"
              value={studentId || ''}
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
        <Alert severity="error" sx={{ mt: 2 }}>
          {axios.isAxiosError(error) && error.response?.status === 404 
            ? "Student records not found. Please ensure the student has a profile."
            : "Error loading roadmap. Please try again later."}
        </Alert>
      ) : isStaff && !studentId ? (
        <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
          <SchoolIcon sx={{ fontSize: 80, mb: 2, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary">Please select a student above to see their academic path.</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
            Based on interests and current grade, here is the recommended path through high school.
          </Typography>

          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                left: 24,
                top: 0,
                bottom: 0,
                width: 2,
                bgcolor: 'divider',
                zIndex: 0,
              }}
            />

            {Array.isArray(roadmap) && roadmap.map((item) => (
              <Box key={item.year} sx={{ display: 'flex', mb: 4, position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 3,
                    flexShrink: 0,
                    boxShadow: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {item.year}
                  </Typography>
                </Box>

                <Card sx={{ flexGrow: 1, borderLeft: '4px solid', borderColor: 'secondary.main', transition: '0.3s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Grade {item.year}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List dense disablePadding>
                      {item.courses?.map((course, cIndex) => {
                        const isRecommended = course.startsWith('*');
                        return (
                          <ListItem key={cIndex} disableGutters>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <SchoolIcon fontSize="small" color={isRecommended ? 'secondary' : 'primary'} />
                            </ListItemIcon>
                            <ListItemText
                              primary={isRecommended ? course.substring(2) : course}
                              primaryTypographyProps={{
                                sx: isRecommended ? { fontWeight: 'bold', fontStyle: 'italic', color: 'secondary.main' } : {},
                              }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            ))}
            {Array.isArray(roadmap) && roadmap.length === 0 && !isLoading && (
               <Typography color="text.secondary" align="center">No roadmap data available for this selection.</Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Roadmap;
