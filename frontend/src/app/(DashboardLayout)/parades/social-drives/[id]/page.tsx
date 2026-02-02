'use client';
import { useParams } from 'next/navigation';
import { Typography } from '@mui/material';
import EventAttendanceView from '@/app/(DashboardLayout)/components/parades/EventAttendanceView';
import { mockSocialDrives } from '@/utils/mockEvents';

const SocialDriveDetails = () => {
    const params = useParams();
    const id = Number(params.id);
    const event = mockSocialDrives.find((e) => e.id === id);

    if (!event) return <Typography>Event not found</Typography>;

    return (
        <EventAttendanceView
            event={event}
            categoryTitle="Social Drives"
            categoryLink="/parades/social-drives"
        />
    );
};

export default SocialDriveDetails;
