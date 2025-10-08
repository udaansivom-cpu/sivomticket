import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const AdminReports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await api.get('/reports/admin-summary');
                setReportData(res.data);
            } catch (err) {
                console.error("Failed to fetch reports", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) return <div>Loading reports...</div>;
    if (!reportData) return <div>No report data found.</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2>Admin Analytics & Reports</h2>
            </header>
            <div className="dashboard-section">
                <h3>Tickets Resolved Per User</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.ticketsPerUser}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="username" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name="Tickets Resolved" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="dashboard-section">
                <h3>Ticket Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={reportData.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                            {reportData.statusBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AdminReports;