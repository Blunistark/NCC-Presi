'use client';
import Link from 'next/link';
import { Grid, Box, Typography, Stack, Breadcrumbs, Link as MuiLink, CardContent, Chip, LinearProgress, CircularProgress, Alert } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import BlankCard from '@/app/(DashboardLayout)/components/shared/BlankCard';
import { IconCalendar, IconUsers } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface Event {
    id: string;
    title: string;
    date: string;
    time?: string;
    type: string;
    status: string;
    created_at?: string;
}

const MandatoryParades = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('/api/events');
                if (!response.ok) throw new Error('Failed to fetch events');
                const data = await response.json();

                // Filter for Mandatory Parades
                const mandatoryEvents = data.filter((e: Event) => e.type === 'Mandatory Parade');
                setEvents(mandatoryEvents);
            } catch (err) {
                console.error(err);
                setError('Could not load events. Ensure backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    return (
        <PageContainer title="Mandatory Parades" description="Attendance Records">
            {/* Navigation Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Breadcrumbs aria-label="breadcrumb">
                    <MuiLink component={Link} underline="hover" color="inherit" href="/">
                        Home
                    </MuiLink>
                    <MuiLink component={Link} underline="hover" color="inherit" href="/parades">
                        Parades
                    </MuiLink>
                    <Typography color="text.primary">Mandatory</Typography>
                </Breadcrumbs>
            </Stack>

            <Box>
                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}

                {!loading && !error && events.length === 0 && (
                    <Alert severity="info">No Mandatory Parades found. Create one from the Dashboard.</Alert>
                )}

                <Grid container spacing={3}>
                    {events.map((parade) => {
                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={parade.id}>
                                <Box component={Link} href={`/parades/mandatory/${parade.id}`} sx={{ textDecoration: 'none' }}>
                                    <BlankCard>
                                        <CardContent sx={{ p: 0 }}>
                                            {/* Header Color Strip */}
                                            <Box sx={{ height: '8px', bgcolor: '#5D87FF', width: '100%' }} />

                                            <Box sx={{ p: 3 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                                    <Typography variant="h5" fontWeight={600} color="textPrimary">
                                                        {parade.title}
                                                    </Typography>
                                                    <Chip
                                                        label={parade.date}
                                                        size="small"
                                                        icon={<IconCalendar size={16} />}
                                                        variant="outlined"
                                                        clickable={false}
                                                    />
                                                </Stack>

                                                <Typography variant="body2" color="textSecondary" mt={1}>
                                                    Time: {parade.time || 'N/A'}
                                                </Typography>

                                                <Stack spacing={2} mt={3}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <IconUsers size={20} color="#5A6A85" />
                                                            <Typography variant="subtitle1" color="textSecondary">
                                                                Status
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="h6" fontWeight={700} color="textPrimary">
                                                            {parade.status}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        </CardContent>
                                    </BlankCard>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        </PageContainer>
    );
};

export default MandatoryParades;
