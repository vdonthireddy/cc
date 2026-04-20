import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Grid,
} from '@mui/material';
import { VegaEmbed } from 'react-vega';
import { useAuthStore } from '../store/authStore';

const Scholarships: React.FC = () => {
  const { user } = useAuthStore();

  const { data: scholarships, isLoading } = useQuery(['scholarships'], async () => {
    const response = await axios.get(`/api/scholarships?studentId=${user?.studentId || 1}`);
    return response.data;
  });

  const funnelData = {
    values: Array.isArray([
      { step: 'Applied', count: 12 },
      { step: 'Accepted', count: 5 },
      { step: 'Earned ($)', count: 2 },
    ]) ? [
      { step: 'Applied', count: 12 },
      { step: 'Accepted', count: 5 },
      { step: 'Earned ($)', count: 2 },
    ] : [],
  };

  const funnelSpec: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Scholarship Application Funnel',
    data: funnelData,
    mark: { type: 'bar', tooltip: true },
    encoding: {
      y: { field: 'step', type: 'nominal', sort: '-x', title: 'Stage' },
      x: { field: 'count', type: 'quantitative', title: 'Count' },
      color: { field: 'step', type: 'nominal', legend: null, scale: { scheme: 'blues' } },
    },
    width: 'container',
    height: 200,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Scholarship Matches
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white' }}>Amount</TableCell>
                  <TableCell sx={{ color: 'white' }}>Min GPA</TableCell>
                  <TableCell sx={{ color: 'white' }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                ) : Array.isArray(scholarships) ? (
                  scholarships?.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ fontWeight: 'medium' }}>{s.name}</TableCell>
                      <TableCell>${s.amount?.toLocaleString() ?? '0'}</TableCell>
                      <TableCell>{s.minGpa}</TableCell>
                      <TableCell>{s.description}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} align="center">No scholarships found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Application Funnel
            </Typography>
            <Box sx={{ width: '100%', height: 250 }}>
              <VegaEmbed spec={funnelSpec} options={{ actions: false }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Scholarships;
