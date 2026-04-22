import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Card,
  CardContent,
  Grid,
  Box,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

interface College {
  id: number;
  name: string;
  location: string;
  acceptRate: number;
  sat25th: number;
  sat75th: number;
}

const CollegeList: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: colleges, isLoading, error } = useQuery({
    queryKey: ['colleges', search],
    queryFn: async () => {
        const response = await axios.get(`/api/colleges/?q=${search}`);
        return response.data;
    },
    retry: false
  });

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        College Explorer
      </Typography>
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Search Colleges"
          variant="outlined"
          placeholder="Type to search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load colleges.</Alert>
      ) : (
        <Grid container spacing={3}>
          {Array.isArray(colleges) && colleges.map((college: College) => (
            <Grid item xs={12} sm={6} md={4} key={college.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.3s', '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      {college.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {college.location}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`Acceptance: ${(college.acceptRate * 100).toFixed(1)}%`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip
                      label={`SAT Range: ${college.sat25th}-${college.sat75th}`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {(!colleges || colleges.length === 0) && (
              <Grid item xs={12}>
                  <Typography align="center" color="text.secondary">No colleges found matching your search.</Typography>
              </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default CollegeList;
