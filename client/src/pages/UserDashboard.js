import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// MUI Imports (with List components now included)
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ButtonGroup,
  List, ListItem, ListItemText, ListSubheader, Divider 
} from '@mui/material';

// Helper function to group resolved tickets by date
const groupTicketsByDate = (tickets) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    tickets.forEach(ticket => {
        if (!ticket.resolvedAt) return;
        const resolvedDate = new Date(ticket.resolvedAt);
        let dateKey;

        if (resolvedDate.toDateString() === today.toDateString()) {
            dateKey = 'Today';
        } else if (resolvedDate.toDateString() === yesterday.toDateString()) {
            dateKey = 'Yesterday';
        } else {
            dateKey = resolvedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        }

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(ticket);
    });
    return groups;
};

const UserDashboard = () => {
  const { user, fetchSidebarStats } = useContext(AuthContext);
  const [allTickets, setAllTickets] = useState([]);
  const [stats, setStats] = useState({ totalPending: 0, totalResolved: 0, resolvedToday: 0 });
  const [filter, setFilter] = useState('Pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comment, setComment] = useState('');

  const fetchAllData = async () => {
    // This function is defined inside useEffect to use the latest state without useCallback
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [ticketsRes, statsRes] = await Promise.all([
          api.get('/tickets/mytickets'),
          api.get('/reports/user-stats')
        ]);
        setAllTickets(ticketsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData(); // Call the function
}, []);

  const openModal = (ticket, type) => {
    setSelectedTicket(ticket);
    setModalType(type);
    setComment('');
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    try {
      if (modalType === 'resolve') {
        await api.put(`/tickets/${selectedTicket._id}/resolve`, { resolutionComment: comment });
      } else if (modalType === 'escalate') {
        await api.put(`/tickets/${selectedTicket._id}/escalate`, { escalationComment: comment });
      }
      setModalOpen(false);
      // Re-fetch data after submission
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/tickets/mytickets'),
        api.get('/reports/user-stats')
      ]);
      setAllTickets(ticketsRes.data);
      setStats(statsRes.data);
      fetchSidebarStats(); // Refresh sidebar stats
    } catch (err) {
      setError(`Failed to ${modalType} ticket.`);
    }
  };

  const getStatusChip = (status) => {
    let color = 'primary';
    if (status === 'Assigned') color = 'warning';
    if (status === 'Resolved') color = 'success';
    if (status === 'Escalated') color = 'error';
    return <Chip label={status} color={color} size="small" />;
  };

  const filteredTickets = allTickets.filter(ticket => {
    if (filter === 'Pending') return ticket.status === 'Assigned' || ticket.status === 'Escalated';
    if (filter === 'Resolved') return ticket.status === 'Resolved';
    return true; // 'All'
  });

  const resolvedTicketsByDate = filter === 'Resolved' ? groupTicketsByDate(filteredTickets) : {};

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome {user?.username}!
      </Typography>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {/* Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h3" color="primary">{stats.pending}</Typography>
          <Typography variant="subtitle1" color="textSecondary">Pending Tickets</Typography>
        </Paper>
        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h3" color="primary">{stats.resolvedToday}</Typography>
          <Typography variant="subtitle1" color="textSecondary">Resolved Today</Typography>
        </Paper>
        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h3" color="primary">{stats.resolved}</Typography>
          <Typography variant="subtitle1" color="textSecondary">Total Resolved</Typography>
        </Paper>
      </Box>

      {/* Filters and Table / List */}
      <Paper elevation={2}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>My Tickets</Typography>
          <ButtonGroup variant="outlined">
            <Button onClick={() => setFilter('Pending')} variant={filter === 'Pending' ? 'contained' : 'outlined'}>Pending</Button>
            <Button onClick={() => setFilter('Resolved')} variant={filter === 'Resolved' ? 'contained' : 'outlined'}>Resolved</Button>
            <Button onClick={() => setFilter('All')} variant={filter === 'All' ? 'contained' : 'outlined'}>All</Button>
          </ButtonGroup>
        </Box>

        {filter !== 'Resolved' && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned On</TableCell>
                  <TableCell>Resolved On</TableCell>
                  <TableCell>Time Taken</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                  <TableRow key={ticket._id} hover>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>{ticket.location.name}</TableCell>
                    <TableCell>{getStatusChip(ticket.status)}</TableCell>
                    <TableCell>{ticket.assignedAt ? new Date(ticket.assignedAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>{ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>{ticket.timeTakenInMinutes ? `${ticket.timeTakenInMinutes} mins` : 'N/A'}</TableCell>
                    <TableCell align="right">
                      {ticket.status === 'Assigned' && (
                        <ButtonGroup size="small">
                          <Button variant="contained" onClick={() => openModal(ticket, 'resolve')}>Resolve</Button>
                          <Button variant="outlined" color="error" onClick={() => openModal(ticket, 'escalate')}>Escalate</Button>
                        </ButtonGroup>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} align="center">No tickets found for this filter.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filter === 'Resolved' && (
          <List>
            {Object.keys(resolvedTicketsByDate).length > 0 ? Object.keys(resolvedTicketsByDate).map(dateKey => (
              <React.Fragment key={dateKey}>
                <ListSubheader sx={{ bgcolor: 'background.paper' }}>{dateKey}</ListSubheader>
                {resolvedTicketsByDate[dateKey].map(ticket => (
                  <ListItem key={ticket._id}>
                    <ListItemText 
                      primary={ticket.title}
                      secondary={`Location: ${ticket.location.name} | Closed: ${new Date(ticket.resolvedAt).toLocaleTimeString()} | Time Taken: ${ticket.timeTakenInMinutes} mins`}
                    />
                  </ListItem>
                ))}
                <Divider />
              </React.Fragment>
            )) : (
              <ListItem><ListItemText primary="No resolved tickets found." /></ListItem>
            )}
          </List>
        )}
      </Paper>

      {/* Resolve/Escalate Dialog */}
      <Dialog open={isModalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{modalType === 'resolve' ? 'Resolve Ticket' : 'Escalate Ticket'}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom><strong>Ticket:</strong> {selectedTicket?.title}</Typography>
          <TextField
            autoFocus
            required
            margin="dense"
            label={modalType === 'resolve' ? 'Resolution Details' : 'Reason for Escalation'}
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="standard"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleModalSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDashboard;
