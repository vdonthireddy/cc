import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  FolderCopy as FolderIcon,
  Description as FileIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  PersonSearch as PersonSearchIcon
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const DocumentVault: React.FC = () => {
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
    queryKey: ['vaultStudents'],
    queryFn: async () => {
      if (!isStaff) return [];
      const res = await axios.get('/api/counselor/students/');
      return res.data;
    },
    enabled: isStaff,
    retry: false
  });

  const handleStudentChange = (event: any) => {
    const newId = event.target.value;
    if (newId) {
      navigate(`/vault?studentId=${newId}`);
    } else {
      navigate('/vault');
    }
  };

  const sampleFiles = [
    { name: 'Common_App_Draft_v1.pdf', size: '1.2 MB', date: 'Oct 12, 2023' },
    { name: 'Official_Transcript_Junior_Year.pdf', size: '840 KB', date: 'Sep 15, 2023' },
    { name: 'Scholarship_Essay_CocaCola.docx', size: '45 KB', date: 'Nov 02, 2023' },
    { name: 'Awards_and_Certificates_Portfolio.zip', size: '15.4 MB', date: 'Aug 28, 2023' }
  ];

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
          <FolderIcon fontSize="large" />
          Document Vault
        </Typography>
        {!isStaff && (
          <Button variant="contained" startIcon={<UploadIcon />}>
            Upload Document
          </Button>
        )}
      </Box>

      {isStaff && (
        <Paper sx={{ p: 3, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main', boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PersonSearchIcon color="primary" />
            <Typography variant="h6">Review Vault for Student</Typography>
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

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 2, boxShadow: 3 }}>
            <List>
              {sampleFiles.map((file, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    secondaryAction={
                      <IconButton edge="end" aria-label="download">
                        <DownloadIcon color="primary" />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <FileIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={file.name} 
                      secondary={`${file.size} • Uploaded on ${file.date}`} 
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                  {index < sampleFiles.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentVault;
