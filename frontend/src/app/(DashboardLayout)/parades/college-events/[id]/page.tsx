'use client';
import { useParams } from 'next/navigation';
import { Typography } from '@mui/material';
import EventAttendanceView from '@/app/(DashboardLayout)/components/parades/EventAttendanceView';
import { mockCollegeEvents } from '@/utils/mockEvents';

const CollegeEventDetails = () => {
    const params = useParams();
    const id = Number(params.id);
    const event = mockCollegeEvents.find((e) => e.id === id);

    if (!event) return <Typography>Event not found</Typography>;

    return (
        <EventAttendanceView
            event={event}
            categoryTitle="College Events"
            categoryLink="/parades/college-events"
        />
    );
};

export default CollegeEventDetails;
