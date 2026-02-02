'use client';
import { useParams } from 'next/navigation';
import { Typography } from '@mui/material';
import EventAttendanceView from '@/app/(DashboardLayout)/components/parades/EventAttendanceView';
import { mockCamps } from '@/utils/mockEvents';

const CampDetails = () => {
    const params = useParams();
    const id = Number(params.id);
    const event = mockCamps.find((e) => e.id === id);

    if (!event) return <Typography>Event not found</Typography>;

    return (
        <EventAttendanceView
            event={event}
            categoryTitle="Camps"
            categoryLink="/parades/camps"
        />
    );
};

export default CampDetails;
