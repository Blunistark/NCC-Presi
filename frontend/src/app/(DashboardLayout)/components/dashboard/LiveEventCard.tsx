'use client';
import { useState } from 'react';
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

const mockLiveBreakdown = [
    { year: '3rd Year', sd: 15, sdTotal: 18, sw: 10, swTotal: 12 },
    { year: '2nd Year', sd: 18, sdTotal: 20, sw: 12, swTotal: 15 },
    { year: '1st Year', sd: 22, sdTotal: 25, sw: 16, swTotal: 18 },
];

const LiveEventCard = () => {
    const [activeEvent, setActiveEvent] = useState<any>(null);

    // Poll for active event (In real app, use SWR or React Query)
    useState(() => {
        const fetchActive = async () => {
            try {
                // Determine URL based on environment (similar to next.config.js logic if needed, or relative)
                // For client side, relative /api proxy is best if setup, but here we might need direct if not proxied?
                // Actually, next.config.js proxies /api, so let's try /api/active_event if we map it, 
                // but we didn't add that to next.config yet? 
                // Wait, next.config proxies /api/:path*. 
                // So we should call /api/active_event.
                // NOTE: We need to ensure /active_event is available via the proxy.
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
        const interval = setInterval(fetchActive, 10000); // Poll every 10s
        return () => clearInterval(interval);
    });

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
                        {totalPresent}/{totalEnrolled} Present
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                        {activeEvent?.Title || 'Ongoing Event'}
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
                                    <TableCell><Typography variant="subtitle2" fontWeight={600}>SD (Boys)</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle2" fontWeight={600}>SW (Girls)</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle2" fontWeight={600}>Total Presence</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mockLiveBreakdown.map((row) => (
                                    <TableRow key={row.year}>
                                        <TableCell><Typography color="textSecondary" variant="subtitle2">{row.year}</Typography></TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary" variant="subtitle2">
                                                {row.sd}/{row.sdTotal}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary" variant="subtitle2">
                                                {row.sw}/{row.swTotal}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                {row.sd + row.sw}/{row.sdTotal + row.swTotal}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Total</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {totalSDPresent}/{totalSDEnrolled}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {totalSWPresent}/{totalSWEnrolled}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={700} color="primary">
                                            {totalPresent}/{totalEnrolled}
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
