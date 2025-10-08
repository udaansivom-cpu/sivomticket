import React, { useState, useEffect } from 'react';
import api from '../services/api';

// MUI Imports
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel, Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for modals
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userData, setUserData] = useState({ username: '', password: '', role: 'user' });
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    const openDeleteConfirm = (id) => {
        setItemToDelete({ id, type: 'user' });
        setDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`/users/${itemToDelete.id}`);
            setDeleteConfirmOpen(false);
            fetchData();
        } catch (err) {
            setError(`Failed to delete user.`);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>Manage Users</Typography>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            <Paper sx={{p: 2, mb: 4}}>
                <Button variant="contained" onClick={() => openUserModal()}>Add New User</Button>
            </Paper>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow><TableCell>Username</TableCell><TableCell>Role (Permission)</TableCell><TableCell align="right">Actions</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id} hover>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => openUserModal(user)} color="primary"><EditIcon /></IconButton>
                                    <IconButton onClick={() => openDeleteConfirm(user._id)} color="error"><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit User Dialog */}
            <Dialog open={isUserModalOpen} onClose={() => setUserModalOpen(false)}>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Username" type="text" fullWidth variant="standard" value={userData.username} onChange={(e) => setUserData({ ...userData, username: e.target.value })} />
                    {!editingUser && (
                        <TextField margin="dense" label="Password" type="password" fullWidth variant="standard" value={userData.password} onChange={(e) => setUserData({ ...userData, password: e.target.value })} />
                    )}
                    <FormControl fullWidth margin="dense" variant="standard">
                        <InputLabel>Role (Permission)</InputLabel>
                        <Select value={userData.role} onChange={(e) => setUserData({ ...userData, role: e.target.value })}>
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUserModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveUser} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
export default UserManagementPage;