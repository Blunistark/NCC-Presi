'use client';
import { useParams } from 'next/navigation';
import { Typography } from '@mui/material';
import EventAttendanceView from '@/app/(DashboardLayout)/components/parades/EventAttendanceView';
import { mockMandatoryParades } from '@/utils/mockEvents';

const MandatoryParadeDetails = () => {
    const params = useParams();
    const id = Number(params.id);
    const event = mockMandatoryParades.find((e) => e.id === id);

    if (!event) return <Typography>Event not found</Typography>;

    return (
        <EventAttendanceView
            event={event}
            categoryTitle="Mandatory Parades"
            categoryLink="/parades/mandatory"
        />
    );
};

export default MandatoryParadeDetails;
