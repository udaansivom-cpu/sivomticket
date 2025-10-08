import React, { useContext } from 'react'; // <-- FIX: Added useContext
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// MUI Imports - Consolidated into a single line
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, CssBaseline, Divider
} from '@mui/material';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

// Icon Imports
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

const AppLayout = ({ children }) => {
  const { user, logout, sidebarStats } = useContext(AuthContext); // <-- FIX: This will now work

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', adminOnly: true },
    { text: 'Users', icon: <PeopleIcon />, path: '/users', adminOnly: true },
    { text: 'Locations', icon: <LocationOnIcon />, path: '/locations', adminOnly: true },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', adminOnly: true },
  ];
  
  const accessibleNavItems = user?.role === 'admin' ? navItems : navItems.filter(item => !item.adminOnly);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Ticketing System
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List>
            {accessibleNavItems.map((item) => (
              <ListItem key={item.text} disablePadding component={NavLink} to={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItemButton>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ flexGrow: 1 }} />

          {user?.role === 'admin' && sidebarStats && (
            <>
              <Divider sx={{ mx: 2 }} />
              <List dense subheader={<Typography variant="overline" sx={{ px: 2, pt: 2, display: 'block' }}>Ticket Stats</Typography>}>
                <ListItem>
                  <ListItemText primary="Pending to Assign" primaryTypographyProps={{ variant: 'body2' }} />
                  <ListItemSecondaryAction><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sidebarStats.needsAssignment}</Typography></ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Pending to Resolve" primaryTypographyProps={{ variant: 'body2' }} />
                  <ListItemSecondaryAction><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sidebarStats.pending}</Typography></ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Resolved Today" primaryTypographyProps={{ variant: 'body2' }} />
                  <ListItemSecondaryAction><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sidebarStats.resolvedToday}</Typography></ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Created Today" primaryTypographyProps={{ variant: 'body2' }} />
                  <ListItemSecondaryAction><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sidebarStats.createdToday}</Typography></ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Total Tickets" primaryTypographyProps={{ variant: 'body2' }} />
                  <ListItemSecondaryAction><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sidebarStats.totalTickets}</Typography></ListItemSecondaryAction>
                </ListItem>
              </List>
            </>
          )}
          
          <Divider />
          <List>
              <ListItem disablePadding>
                <ListItemButton onClick={logout}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;