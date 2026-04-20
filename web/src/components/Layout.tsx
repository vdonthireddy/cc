import React, { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  School as SchoolIcon,
  Logout as LogoutIcon,
  SupervisorAccount as ParentIcon,
  Timeline as TimelineIcon,
  FolderCopy as FolderIcon,
  EmojiEvents as ScholarshipIcon,
  AssignmentInd as LoRIcon,
  QuestionAnswer as InterviewIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, ThemeType } from '../store/themeStore';
import ChatWindow from './ChatWindow';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleThemeChange = (event: any) => {
    setTheme(event.target.value as ThemeType);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['STUDENT'] },
    { text: 'Scholarships', icon: <ScholarshipIcon />, path: '/scholarships', roles: ['STUDENT'] },
    { text: 'LoR Manager', icon: <LoRIcon />, path: '/lor', roles: ['STUDENT', 'COUNSELOR'] },
    { text: 'Interview Prep', icon: <InterviewIcon />, path: '/interview-prep', roles: ['STUDENT'] },
    { text: 'Academic', icon: <TimelineIcon />, path: '/roadmap', roles: ['STUDENT'] },
    { text: 'Vault', icon: <FolderIcon />, path: '/vault', roles: ['STUDENT'] },
    { text: 'Parent Dashboard', icon: <ParentIcon />, path: '/parent', roles: ['PARENT'] },
    { text: 'Counselor Dashboard', icon: <SchoolIcon />, path: '/counselor', roles: ['COUNSELOR'] },
    { text: 'Admin Settings', icon: <SettingsIcon />, path: '/admin/settings', roles: ['ADMIN'] },
  ].filter(item => {
    const userRole = user?.role?.toUpperCase();
    return item.roles.some(role => role.toUpperCase() === userRole);
  });

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          PATHFINDER
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems?.map((item) => (
          <ListItem key={item.text} disablePadding>

            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'secondary.main' : 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ p: 2, mt: 'auto' }}>
        <FormControl fullWidth size="small">
          <InputLabel id="theme-select-label">Theme</InputLabel>
          <Select
            labelId="theme-select-label"
            value={theme}
            label="Theme"
            onChange={handleThemeChange}
          >
            <MenuItem value="academic">Academic (Light)</MenuItem>
            <MenuItem value="darkModern">Dark Modern</MenuItem>
            <MenuItem value="highContrast">High Contrast</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems?.find(item => item.path === location.pathname)?.text || 'Pathfinder'}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.name} ({user?.role})
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', bgcolor: 'background.default' }}
      >
        <Toolbar />
        <Outlet />
        {user?.role === 'STUDENT' && <ChatWindow />}
      </Box>
    </Box>
  );
};

export default Layout;
