import React from 'react';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

const StudentDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Student Dashboard</Typography>
      <Grid container spacing={3}>
        {/* GPA Trend Placeholder */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>GPA Trend</Typography>
            <Box sx={{ width: '100%', height: 200, bgcolor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 2 }}>
              <Typography color="text.secondary">[Vega-Lite GPA Chart Placeholder]</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* EC Donut Placeholder */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>Extracurricular Distribution</Typography>
            <Box sx={{ width: 150, height: 150, borderRadius: '50%', border: '20px solid #1A365D', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h4">EC</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>[EC Donut Chart]</Typography>
          </Paper>
        </Grid>

        {/* Next 3 Deadlines */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Upcoming Deadlines</Typography>
            <List>
              <ListItem>
                <ListItemText primary="SAT Registration" secondary="October 15, 2023" />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Early Decision: Stanford" secondary="November 1, 2023" />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Scholarship Essay: Coca-Cola" secondary="November 15, 2023" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
