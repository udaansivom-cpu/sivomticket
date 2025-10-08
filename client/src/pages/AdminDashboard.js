import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { /* ..., */ Tooltip } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import {useContext } from 'react';
// MUI Imports
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel, Box, Chip, IconButton, Autocomplete
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const AdminDashboard = () => {
  // State hooks
  const [locations, setLocations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { fetchSidebarStats } = useContext(AuthContext);
  // User Management Modal State
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userData, setUserData] = useState({ username: '', password: '', role: 'user' });
  
  // Create/Assign Ticket Modal State
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [ticketData, setTicketData] = useState({ title: 'LINK DOWN', description: '', priority: 'Medium' });
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');

  // Edit/Delete Modal State
  const [isEditLocationModalOpen, setEditLocationModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Bulk Import State
  const [importFile, setImportFile] = useState(null);

  // --- HANDLER FUNCTIONS ---

  const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [locationsRes, ticketsRes, usersRes] = await Promise.all([
                api.get('/locations'),
                api.get('/tickets/all'),
                api.get('/users')
            ]);
            setLocations(locationsRes.data);
            setTickets(ticketsRes.data);
            setUsers(usersRes.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, []);
  
  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
        setSelectedLocation(null);
        setTicketData({ title: 'LINK DOWN', description: '', priority: 'Medium' });
        setCreateModalOpen(true);
    };

  const handleCreateTicket = async () => {
    if (!selectedLocation) { setError('You must select a location first.'); return; }
    try { 
      await api.post('/tickets/create', { ...ticketData, locationId: selectedLocation._id }); 
      setCreateModalOpen(false); 
      fetchData(); 
    } catch (err) { 
      setError('Failed to create ticket.'); 
    }
  };

  const openAssignModal = (ticket) => { 
    setSelectedTicket(ticket); 
    setSelectedUser(''); 
    setAssignModalOpen(true); 
  };

  const handleAssignTicket = async () => { 
    if (!selectedUser) return; 
    try { 
      await api.put(`/tickets/${selectedTicket._id}/assign`, { userId: selectedUser }); 
      setAssignModalOpen(false); 
      fetchData(); 
    } catch (err) { 
      setError('Failed to assign ticket.'); 
    }
  };
  
  const openEditLocationModal = (location) => { 
    setItemToEdit({ ...location }); 
    setEditLocationModalOpen(true); 
  };

  const handleUpdateLocation = async () => { 
    try { 
      await api.put(`/locations/${itemToEdit._id}`, { name: itemToEdit.name, ipAddress: itemToEdit.ipAddress }); 
      setEditLocationModalOpen(false); 
      fetchData(); 
    } catch (err) { 
      setError('Failed to update location'); 
    }
  };

  const openDeleteConfirm = (id, type) => { 
    setItemToDelete({ id, type }); 
    setDeleteConfirmOpen(true); 
  };

  const handleDelete = async () => { 
    if (!itemToDelete) return; 
    try { 
      if (itemToDelete.type === 'ticket') { 
        await api.delete(`/tickets/${itemToDelete.id}`); 
      } else if (itemToDelete.type === 'location') { 
        await api.delete(`/locations/${itemToDelete.id}`); 
      } else if (itemToDelete.type === 'user') {
        await api.delete(`/users/${itemToDelete.id}`);
      }
      setDeleteConfirmOpen(false); 
      fetchData(); 
    } catch (err) { 
      setError(`Failed to delete ${itemToDelete.type}.`); 
    }
  };

  const openUserModal = (user = null) => { 
    if (user) { 
      setEditingUser(user); 
      setUserData({ username: user.username, password: '', role: user.role }); 
    } else { 
      setEditingUser(null); 
      setUserData({ username: '', password: '', role: 'user' }); 
    } 
    setUserModalOpen(true); 
  };

  const handleSaveUser = async () => { 
    try { 
      if (editingUser) { 
        await api.put(`/users/${editingUser._id}`, { username: userData.username, role: userData.role }); 
      } else { 
        await api.post('/users/register', userData); 
      } 
      setUserModalOpen(false); 
      fetchData(); 
    } catch (err) { 
      setError('Failed to save user.'); 
    }
  };

   const handleFileImport = () => {
        if (!importFile) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const locationsToImport = lines.map(line => {
                const lastHyphenIndex = line.lastIndexOf('-');
                if (lastHyphenIndex === -1) return null; // Invalid line format
                const name = line.substring(0, lastHyphenIndex).trim();
                const ipAddress = line.substring(lastHyphenIndex + 1).trim();
                return { name, ipAddress };
            }).filter(Boolean); // Filter out any null (invalid) lines

            try {
                await api.post('/locations/import', { locations: locationsToImport });
                fetchData();
                setImportFile(null);
                if(document.getElementById('file-input')) document.getElementById('file-input').value = '';
            } catch (err) {
                setError('Failed to import locations.');
            }
        };
        reader.readAsText(importFile);
    };

  const getStatusChip = (status) => { 
    let color = 'primary'; 
    if (status === 'Assigned') color = 'warning'; 
    if (status === 'Resolved') color = 'success'; 
    if (status === 'Escalated') color = 'error'; 
    if (status === 'Open') color = 'info'; 
    return <Chip label={status} color={color} size="small" />; 
  };
  
  if (loading) return <Typography>Loading dashboard...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">Admin Dashboard</Typography>
        <Button variant="contained" component={Link} to="/reports">View Reports</Button>
      </Box>
      
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <Paper sx={{p: 2, mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => openUserModal()}>Add New User</Button>
        <Button variant="contained" onClick={openCreateModal}>Create New Ticket</Button>
      </Paper>
      
      <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>All Tickets</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow><TableCell>Title</TableCell><TableCell>Location</TableCell><TableCell>Priority</TableCell><TableCell>Status & Comments</TableCell><TableCell>Assigned To</TableCell><TableCell>Assigned On</TableCell><TableCell>Resolved On</TableCell><TableCell>Time Taken</TableCell><TableCell align="right">Actions</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket._id} hover>
                <TableCell>{ticket.title}</TableCell><TableCell>{ticket.location?.name || 'N/A'}</TableCell><TableCell>{ticket.priority}</TableCell>
                <TableCell>{getStatusChip(ticket.status)}{ticket.status === 'Escalated' && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}><strong>Reason:</strong> {ticket.escalationComment}</Typography>}{ticket.status === 'Resolved' && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}><strong>Resolution:</strong> {ticket.resolutionComment}</Typography>}</TableCell>
                <TableCell>{ticket.assignedTo?.username || 'Unassigned'}</TableCell><TableCell>{ticket.assignedAt ? new Date(ticket.assignedAt).toLocaleString() : 'N/A'}</TableCell><TableCell>{ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : 'N/A'}</TableCell><TableCell>{ticket.timeTakenInMinutes ? `${ticket.timeTakenInMinutes} mins` : 'N/A'}</TableCell>
                <TableCell align="right">
                    {(ticket.status === 'Open' || ticket.status === 'Escalated') && (
                        <Tooltip title="Assign Ticket">
                            <IconButton onClick={() => openAssignModal(ticket)} color="primary">
                                <AssignmentIndIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Delete Ticket">
                        <IconButton onClick={() => openDeleteConfirm(ticket._id, 'ticket')} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* DIALOGS (MODALS) */}
      <Dialog open={isUserModalOpen} onClose={() => setUserModalOpen(false)}>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Username" type="text" fullWidth variant="standard" value={userData.username} onChange={(e) => setUserData({ ...userData, username: e.target.value })} />
          {!editingUser && ( <TextField margin="dense" label="Password" type="password" fullWidth variant="standard" value={userData.password} onChange={(e) => setUserData({ ...userData, password: e.target.value })} /> )}
          <FormControl fullWidth margin="dense" variant="standard"><InputLabel>Role (Permission)</InputLabel><Select value={userData.role} onChange={(e) => setUserData({ ...userData, role: e.target.value })}><MenuItem value="user">User</MenuItem><MenuItem value="admin">Admin</MenuItem></Select></FormControl>
        </DialogContent>
        <DialogActions><Button onClick={() => setUserModalOpen(false)}>Cancel</Button><Button onClick={handleSaveUser} variant="contained">Save</Button></DialogActions>
      </Dialog>
      <Dialog open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Ticket</DialogTitle>
        <DialogContent>
          <Autocomplete options={locations} getOptionLabel={(option) => option.name} onChange={(event, newValue) => setSelectedLocation(newValue)} renderInput={(params) => <TextField {...params} label="Search for a Location" variant="standard" margin="dense" required />} sx={{ mt: 1 }} />
          <TextField autoFocus margin="dense" label="Ticket Title" type="text" fullWidth variant="standard" value={ticketData.title} onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })} required />
          <TextField margin="dense" label="Description" type="text" fullWidth multiline rows={4} variant="standard" value={ticketData.description} onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })} />
          <FormControl fullWidth margin="dense" variant="standard"><InputLabel>Priority</InputLabel><Select value={ticketData.priority} onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}><MenuItem value="Low">Low</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="High">High</MenuItem></Select></FormControl>
        </DialogContent>
        <DialogActions><Button onClick={() => setCreateModalOpen(false)}>Cancel</Button><Button onClick={handleCreateTicket} variant="contained" disabled={!selectedLocation}>Create</Button></DialogActions>
      </Dialog>
      <Dialog open={isEditLocationModalOpen} onClose={() => setEditLocationModalOpen(false)}>
        <DialogTitle>Edit Location</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Location Name" type="text" fullWidth variant="standard" value={itemToEdit?.name || ''} onChange={(e) => setItemToEdit({ ...itemToEdit, name: e.target.value })} />
          <TextField margin="dense" label="IP Address" type="text" fullWidth variant="standard" value={itemToEdit?.ipAddress || ''} onChange={(e) => setItemToEdit({ ...itemToEdit, ipAddress: e.target.value })} />
        </DialogContent>
        <DialogActions><Button onClick={() => setEditLocationModalOpen(false)}>Cancel</Button><Button onClick={handleUpdateLocation} variant="contained">Save Changes</Button></DialogActions>
      </Dialog>
      <Dialog open={isAssignModalOpen} onClose={() => setAssignModalOpen(false)}>
        <DialogTitle>Assign "{selectedTicket?.title}"</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" variant="standard"><InputLabel>Select a User</InputLabel><Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>{users.map((user) => (<MenuItem key={user._id} value={user._id}>{user.username}</MenuItem>))}</Select></FormControl>
        </DialogContent>
        <DialogActions><Button onClick={() => setAssignModalOpen(false)}>Cancel</Button><Button onClick={handleAssignTicket} variant="contained">Confirm</Button></DialogActions>
      </Dialog>
      <Dialog open={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.</Typography></DialogContent>
        <DialogActions><Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button><Button onClick={handleDelete} variant="contained" color="error">Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
