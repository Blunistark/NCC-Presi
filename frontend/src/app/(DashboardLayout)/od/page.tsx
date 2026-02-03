'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { IconSearch } from '@tabler/icons-react';
import EventODCard from '@/app/(DashboardLayout)/components/dashboard/EventODCard';

const ODPage = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { push } = useRouter();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                }
            } catch (e) {
                console.error("Failed to fetch events");
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(ev =>
        (ev.Title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ev["Event ID"] || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCardClick = (event: any) => {
        const eid = event["Event ID"];
        if (eid) {
            push(`/od/${eid}`);
        }
    };

    return (
        <PageContainer title="On Duty Logs" description="View OD logs for events">
            <DashboardCard title="On Duty Registry">
                <Box>
                    {/* Search Bar */}
                    <Box sx={{ mb: 4, maxWidth: 500 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search Events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconSearch size={20} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    {/* Events Grid */}
                    {loading ? (
                        <Box display="flex" justifyItems="center"><CircularProgress /></Box>
                    ) : filteredEvents.length === 0 ? (
                        <Alert severity="info">No events found.</Alert>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredEvents.map((ev, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={ev["Event ID"] || index}>
                                    <EventODCard
                                        event={ev}
                                        onClick={() => handleCardClick(ev)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            </DashboardCard>
        </PageContainer>
    );
};

export default ODPage;
