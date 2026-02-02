'use client';
import Link from 'next/link';
import { Grid, Box, Typography, Stack, Breadcrumbs, Link as MuiLink, CardContent, Chip, CircularProgress, Alert } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import BlankCard from '@/app/(DashboardLayout)/components/shared/BlankCard';
import { IconCalendar, IconUsers } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface Event {
    "Event ID": string;
    "Title": string;
    "Date": string;
    "Time": string;
    "Type": string;
}

const CollegeEvents = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('http://localhost:8000/events');
                if (!response.ok) throw new Error('Failed');
                const data = await response.json();
                setEvents(data.filter((e: Event) => e.Type === 'College Event'));
            } catch (err) {
                setError('Failed to load events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <PageContainer title="College Events" description="College Official Events">
            {/* Navigation Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Breadcrumbs aria-label="breadcrumb">
                    <MuiLink component={Link} underline="hover" color="inherit" href="/">
                        Home
                    </MuiLink>
                    <MuiLink component={Link} underline="hover" color="inherit" href="/parades">
                        Parades
                    </MuiLink>
                    <Typography color="text.primary">College Events</Typography>
                </Breadcrumbs>
            </Stack>

            <Box>
                {loading && <CircularProgress />}
                {!loading && events.length === 0 && <Alert severity="info">No College Events found.</Alert>}

                <Grid container spacing={3}>
                    {events.map((event) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event["Event ID"]}>
                            <Box component={Link} href={`/parades/college-events/${event["Event ID"]}`} sx={{ textDecoration: 'none' }}>
                                <BlankCard>
                                    <CardContent sx={{ p: 0 }}>
                                        {/* Header Color Strip */}
                                        <Box sx={{ height: '8px', bgcolor: '#13DEB9', width: '100%' }} />

                                        <Box sx={{ p: 3 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                                <Typography variant="h5" fontWeight={600} color="textPrimary">
                                                    {event.Title}
                                                </Typography>
                                                <Chip
                                                    label={event.Date}
                                                    size="small"
                                                    icon={<IconCalendar size={16} />}
                                                    variant="outlined"
                                                    clickable={false}
                                                />
                                            </Stack>

                                            <Typography variant="body2" color="textSecondary" mt={1}>
                                                Time: {event.Time}
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
                                                        Scheduled
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    </CardContent>
                                </BlankCard>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </PageContainer>
    );
};

export default CollegeEvents;
