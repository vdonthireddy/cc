import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  Divider,
  Link
} from '@mui/material';
import { useAuthStore, Role } from '../store/authStore';

interface LoginProps {
  preselectedRole?: Role;
}

const Login: React.FC<LoginProps> = ({ preselectedRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(preselectedRole || 'STUDENT');
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (preselectedRole) {
      setRole(preselectedRole);
    }
  }, [preselectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const loggedInUser = response.data.user;
      
      // Basic role enforcement for preselected routes
      if (preselectedRole && loggedInUser.role.toUpperCase() !== preselectedRole) {
        setError(`This portal is for ${preselectedRole.toLowerCase()}s only.`);
        return;
      }

      setAuth(loggedInUser);
      
      const from = (location.state as any)?.from?.pathname || {
        STUDENT: '/dashboard',
        PARENT: '/parent',
        COUNSELOR: '/counselor',
        ADMIN: '/admin/settings',
      }[loggedInUser.role.toUpperCase() as Role];
      
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1A365D 0%, #2A4365 100%)',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 4,
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Pathfinder
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Academic Excellence & College Readiness
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Sign In to {role.charAt(0) + role.slice(1).toLowerCase()} Portal
            </Button>
          </Box>

          <Box sx={{ mt: 3, width: '100%' }}>
            <Divider sx={{ mb: 2 }}>Quick Access Portals</Divider>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              <Link component={RouterLink} to="/student-login" variant="body2">Student</Link>
              <Link component={RouterLink} to="/parent-login" variant="body2">Parent</Link>
              <Link component={RouterLink} to="/counselor-login" variant="body2">Counselor</Link>
              <Link component={RouterLink} to="/admin-login" variant="body2">Admin</Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
