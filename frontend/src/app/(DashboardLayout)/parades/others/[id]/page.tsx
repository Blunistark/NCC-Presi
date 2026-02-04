'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Typography, CircularProgress, Box, Alert } from '@mui/material';
import EventAttendanceView from '@/app/(DashboardLayout)/components/parades/EventAttendanceView';

const OtherEventDetails = () => {
    const params = useParams();
    const id = params.id as string;
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${id}`);
                if (!res.ok) throw new Error('Event not found');
                const data = await res.json();
                setEvent(data);
            } catch (err) {
                console.error(err);
                setError('Event not found or failed to load.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchEvent();
        }
    }, [id]);

    if (loading) return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!event) return <Typography>Event not found</Typography>;

    return (
        <EventAttendanceView
            event={event}
            categoryTitle="Other Events"
            categoryLink="/parades/others"
        />
    );
};

export default OtherEventDetails;
