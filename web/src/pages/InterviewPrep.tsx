import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  QuestionAnswer as ChatIcon,
  VideoCall as VideoIcon,
  CheckCircle as CheckIcon,
  PersonSearch as PersonSearchIcon,
  Psychology as AIMentorIcon
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const InterviewPrep: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [openMentor, setOpenMentor] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [modelName, setModelName] = useState('');

  const studentIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('studentId');
  }, [location.search]);

  const userRole = user?.role?.toUpperCase();
  const isStaff = userRole === 'COUNSELOR' || userRole === 'ADMIN';

  const commonQuestions = [
    "Tell me about yourself.",
    "What is your greatest academic achievement?",
    "How have you overcome a significant challenge?",
    "What do you do in your free time?",
    "Why do you want to attend our college?"
  ];

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post('/api/interview/feedback', { question: selectedQuestion, answer });
      return res.data;
    },
    onSuccess: (data) => {
      setFeedback(data.feedback);
      setModelName(data.model_name);
    }
  });

  const handleStartMentor = () => {
    setOpenMentor(true);
    setFeedback('');
    setModelName('');
    setAnswer('');
    if (!selectedQuestion) setSelectedQuestion(commonQuestions[0]);
  };

  const { data: students } = useQuery({
    queryKey: ['interviewStudents'],
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
      navigate(`/interview-prep?studentId=${newId}`);
    } else {
      navigate('/interview-prep');
    }
  };

  const tips = [
    "Research the college's core values and unique programs.",
    "Prepare answers for 'Why this college?' and 'What can you contribute?'",
    "Have 3-5 specific questions ready for your interviewer.",
    "Dress professionally and find a quiet space for virtual interviews."
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
        <ChatIcon fontSize="large" />
        Interview Preparation
      </Typography>

      {isStaff && (
        <Paper sx={{ p: 3, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main', boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PersonSearchIcon color="primary" />
            <Typography variant="h6">Review Prep for Student</Typography>
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

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
              Interview Tips & Best Practices
            </Typography>
            <List>
              {tips.map((tip, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText primary={tip} />
                  </ListItem>
                  {index < tips.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Box mt={3}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<AIMentorIcon />}
                onClick={handleStartMentor}
                disabled={isStaff}
              >
                Practice with AI Mentor
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
              Common Interview Questions
            </Typography>
            <List>
              {commonQuestions.map((q, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary={q} primaryTypographyProps={{ fontWeight: 'medium' }} />
                  </ListItem>
                  {index < commonQuestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Box mt={3}>
              <Button variant="outlined" fullWidth color="primary" disabled={isStaff}>
                Record Mock Response
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openMentor} onClose={() => setOpenMentor(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <AIMentorIcon color="primary" />
          AI Interview Mentor
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>Select a question to practice:</Typography>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Select 
              value={selectedQuestion} 
              onChange={(e) => setSelectedQuestion(e.target.value)}
            >
              {commonQuestions.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>Your Response:</Typography>
          <TextField 
            fullWidth 
            multiline 
            rows={4} 
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          {feedback && (
            <Box mt={3} p={2} sx={{ bgcolor: 'info.light', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Mentor Feedback ({modelName}):
              </Typography>
              <Typography variant="body1" sx={{ color: 'white', whiteSpace: 'pre-wrap' }}>{feedback}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMentor(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => feedbackMutation.mutate()}
            disabled={!answer || feedbackMutation.isLoading}
          >
            {feedbackMutation.isLoading ? <CircularProgress size={24} /> : 'Get Feedback'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewPrep;
