import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';

interface College {
  id: number;
  name: string;
  location: string;
  acceptRate: number;
  sat25th: number;
  sat75th: number;
}

const CollegeList: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchColleges = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/colleges?q=${search}`);
        setColleges(response.data);
      } catch (error) {
        console.error('Error fetching colleges:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchColleges();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        College Explorer
      </Typography>
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Search Colleges"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {colleges?.map((college) => (
            <Grid item xs={12} sm={6} md={4} key={college.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
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
                    />
                    <Chip
                      label={`SAT Range: ${college.sat25th}-${college.sat75th}`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default CollegeList;
