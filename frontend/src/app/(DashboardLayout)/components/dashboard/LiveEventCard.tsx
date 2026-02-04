'use client';
import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Stack,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton
} from '@mui/material';
import { IconBroadcast, IconX } from '@tabler/icons-react';

const LiveEventCard = () => {
    const [activeEvent, setActiveEvent] = useState<any>(null);
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Poll for active event
    useEffect(() => {
        const fetchActive = async () => {
            try {
                const res = await fetch('/api/active_event');
                if (res.ok) {
                    const data = await res.json();
                    setActiveEvent(data);
                } else {
                    setActiveEvent(null);
                }
            } catch (e) {
                console.log("No active event");
            }
        };
        fetchActive();
        const interval = setInterval(fetchActive, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!activeEvent) {
        return (
            <Card sx={{ bgcolor: 'grey.300', color: 'text.secondary' }}>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={600}>Live Activity</Typography>
                        <Chip label="OFFLINE" size="small" />
                    </Stack>
                    <Typography variant="h4" fontWeight={700} sx={{ mt: 2, mb: 1, opacity: 0.5 }}>
                        No Active Parade
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    // Derived Stats
    const stats = activeEvent.stats || { total: 0, year1: 0, year2: 0, year3: 0 };
    // Assuming enrollment totals are static or we'd fetch them. For now, we can show just present
    // Or we can assume 1st yr ~50, 2nd ~50, 3rd ~50 for a rough progress UI or just hide denominator

    const breakdownData = [
        { year: '3rd Year', count: stats.year3 },
        { year: '2nd Year', count: stats.year2 },
        { year: '1st Year', count: stats.year1 }
    ];

    return (
        <>
            <Card
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.02)' }
                }}
                onClick={handleOpen}
            >
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                        <Typography variant="h6" fontWeight={600}>Live Activity</Typography>
                        <Chip
                            icon={<IconBroadcast size={16} className="animate-pulse" />}
                            label="LIVE"
                            size="small"
                            color="error"
                            sx={{ bgcolor: 'white', color: 'error.main', fontWeight: 700 }}
                        />
                    </Stack>

                    <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
                        {stats.total} Present
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                        {activeEvent?.title || 'Ongoing Event'}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Tap to view detailed breakdown
                    </Typography>
                </CardContent>
            </Card>

            {/* Breakdown Modal */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5" fontWeight={600}>
                            Live Attendance Breakdown
                        </Typography>
                        <IconButton onClick={handleClose}>
                            <IconX size={20} />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ overflow: 'auto' }}>
                        <Table sx={{ whiteSpace: "nowrap" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography variant="subtitle2" fontWeight={600}>Year</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle2" fontWeight={600}>Total Presence</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {breakdownData.map((row) => (
                                    <TableRow key={row.year}>
                                        <TableCell><Typography color="textSecondary" variant="subtitle2">{row.year}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                {row.count}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Total</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={700} color="primary">
                                            {stats.total}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default LiveEventCard;
