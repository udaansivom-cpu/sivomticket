import React, { useState, useEffect } from 'react';
import api from '../services/api';
// MUI Imports
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const LocationManagementPage = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for modals
    const [importFile, setImportFile] = useState(null);
    const [isEditLocationModalOpen, setEditLocationModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/locations');
            setLocations(res.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch locations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileImport = () => {
        if (!importFile) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const locationsToImport = lines.map(line => {
                const lastHyphenIndex = line.lastIndexOf('-');
                if (lastHyphenIndex === -1) return null;
                const name = line.substring(0, lastHyphenIndex).trim();
                const ipAddress = line.substring(lastHyphenIndex + 1).trim();
                return { name, ipAddress };
            }).filter(Boolean);
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

    const openDeleteConfirm = (id) => {
        setItemToDelete({ id, type: 'location' });
        setDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`/locations/${itemToDelete.id}`);
            setDeleteConfirmOpen(false);
            fetchData();
        } catch (err) {
            setError(`Failed to delete location.`);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>Manage Locations</Typography>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Bulk Import Locations</Typography>
            <Paper sx={{p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center'}}>
                <Button variant="outlined" component="label">
                    Choose location.txt
                    <input id="file-input" type="file" hidden accept=".txt" onChange={(e) => setImportFile(e.target.files[0])} />
                </Button>
                {importFile && <Typography variant="body2">{importFile.name}</Typography>}
                <Button variant="contained" onClick={handleFileImport} disabled={!importFile}>Import</Button>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow><TableCell>Name</TableCell><TableCell>IP Address</TableCell><TableCell align="right">Actions</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                        {locations.map((loc) => (
                            <TableRow key={loc._id} hover>
                                <TableCell>{loc.name}</TableCell>
                                <TableCell>{loc.ipAddress || 'N/A'}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => openEditLocationModal(loc)} color="primary"><EditIcon /></IconButton>
                                    <IconButton onClick={() => openDeleteConfirm(loc._id)} color="error"><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Location Dialog */}
            <Dialog open={isEditLocationModalOpen} onClose={() => setEditLocationModalOpen(false)}>
                <DialogTitle>Edit Location</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Location Name" type="text" fullWidth variant="standard" value={itemToEdit?.name || ''} onChange={(e) => setItemToEdit({ ...itemToEdit, name: e.target.value })} />
                    <TextField margin="dense" label="IP Address" type="text" fullWidth variant="standard" value={itemToEdit?.ipAddress || ''} onChange={(e) => setItemToEdit({ ...itemToEdit, ipAddress: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditLocationModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateLocation} variant="contained">Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this location? All associated tickets will also be deleted. This action cannot be undone.</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
export default LocationManagementPage;