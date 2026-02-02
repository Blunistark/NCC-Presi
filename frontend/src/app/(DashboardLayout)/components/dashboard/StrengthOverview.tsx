'use client';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box,
    Skeleton,
    Alert
} from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useState, useEffect } from 'react';

interface StrengthRow {
    year: string;
    sd: number;
    sw: number;
}

const StrengthOverview = () => {
    const [strengthData, setStrengthData] = useState<StrengthRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStrength = async () => {
            try {
                const response = await fetch('http://localhost:8000/strength');
                if (!response.ok) throw new Error('Failed');
                const data = await response.json();

                // Transform API data to component format
                const formattedData = data.breakdown.map((item: any) => ({
                    year: item.Year,
                    sd: Number(item.SD) || 0,
                    sw: Number(item.SW) || 0
                }));

                setStrengthData(formattedData);
            } catch (err) {
                console.error(err);
                setError('Failed to load strength data');
            } finally {
                setLoading(false);
            }
        };

        fetchStrength();
    }, []);

    // Calculate Totals
    const totalSD = strengthData.reduce((acc, curr) => acc + curr.sd, 0);
    const totalSW = strengthData.reduce((acc, curr) => acc + curr.sw, 0);
    const grandTotal = totalSD + totalSW;

    return (
        <DashboardCard title="Company Strength">
            <Box sx={{ overflow: 'auto', width: { xs: '280px', sm: 'auto' } }}>
                {loading && <Box p={2}><Skeleton variant="rectangular" height={150} /></Box>}
                {error && <Alert severity="error">{error}</Alert>}

                {!loading && !error && (
                    <Table aria-label="strength table" sx={{ whiteSpace: "nowrap", mt: 2 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={600}>Year</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={600}>SD (Boys)</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={600}>SW (Girls)</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={600}>Total</Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {strengthData.map((row) => (
                                <TableRow key={row.year}>
                                    <TableCell>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            {row.year}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="textSecondary" variant="subtitle2">
                                            {row.sd}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="textSecondary" variant="subtitle2">
                                            {row.sw}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            {row.sd + row.sw}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Grand Total Row */}
                            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        Total
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {totalSD}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {totalSW}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                                        {grandTotal}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                )}
            </Box>
        </DashboardCard>
    );
};

export default StrengthOverview;
