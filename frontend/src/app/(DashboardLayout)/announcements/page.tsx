'use client';
import { Box, Typography, Avatar, Stack } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { IconSpeakerphone } from '@tabler/icons-react';

const AnnouncementsPage = () => {
    return (
        <PageContainer title="Announcements" description="Coming Soon">
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <DashboardCard title="Announcements">
                    <Stack direction="column" alignItems="center" spacing={3} p={5}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 100, height: 100, mb: 2 }}>
                            <IconSpeakerphone size={50} color="#5D87FF" />
                        </Avatar>

                        <Typography variant="h2" fontWeight={700} color="primary" align="center">
                            Coming Soon
                        </Typography>

                        <Typography variant="h5" color="textSecondary" align="center" sx={{ maxWidth: '400px' }}>
                            We are working hard to bring you the announcement features. Stay tuned for updates!
                        </Typography>
                    </Stack>
                </DashboardCard>
            </Box>
        </PageContainer>
    );
};

export default AnnouncementsPage;
