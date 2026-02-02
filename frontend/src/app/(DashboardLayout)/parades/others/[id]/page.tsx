'use client';
import { useParams } from 'next/navigation';
import { Typography } from '@mui/material';
import EventAttendanceView from '@/app/(DashboardLayout)/components/parades/EventAttendanceView';
import { mockOtherEvents } from '@/utils/mockEvents';

const OtherEventDetails = () => {
    const params = useParams();
    const id = Number(params.id);
    const event = mockOtherEvents.find((e) => e.id === id);

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
