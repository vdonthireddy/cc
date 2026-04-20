import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
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
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';

interface RoadmapYear {
  year: number;
  courses: string[];
}

const Roadmap: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const studentId = searchParams.get('studentId');

  const { data: roadmap, isLoading, error } = useQuery<RoadmapYear[]>({
    queryKey: ['roadmap', studentId],
    queryFn: async () => {
      const response = await axios.get(`/api/roadmap${studentId ? `?studentId=${studentId}` : ''}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">Error loading roadmap. Please try again later.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Academic Roadmap
      </Typography>
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

        {roadmap?.map((item) => (
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

            <Card sx={{ flexGrow: 1, borderLeft: '4px solid', borderColor: 'secondary.main' }}>
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
      </Box>
    </Box>
  );
};

export default Roadmap;
