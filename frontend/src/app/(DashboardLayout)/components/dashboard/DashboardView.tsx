'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Box, Typography, Stack, Button } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import { IconPlus, IconScan, IconBroadcast } from '@tabler/icons-react';
// components
import NCCStats from '@/app/(DashboardLayout)/components/dashboard/NCCStats';
import RecentActivity from '@/app/(DashboardLayout)/components/dashboard/RecentActivity';
import StrengthOverview from '@/app/(DashboardLayout)/components/dashboard/StrengthOverview';
import CreateEventDialog from '@/app/(DashboardLayout)/components/parades/CreateEventDialog';
import LiveEventCard from '@/app/(DashboardLayout)/components/dashboard/LiveEventCard';

interface DashboardViewProps {
    role: 'ANO' | 'SUO' | 'Colonel';
}

const DashboardView = ({ role }: DashboardViewProps) => {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const router = useRouter();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <PageContainer title={`${role} Dashboard`} description="NCC Management Overview">
            <Box>
                {/* Welcome Section & Actions */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {getGreeting()}, {role} 👋
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        {role === 'SUO' && (
                            <>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<IconScan />}
                                    onClick={() => router.push('/suo/attendance')}
                                >
                                    Mark Attendance
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to END the current event?')) {
                                            try {
                                                const res = await fetch('/api/end_event', { method: 'POST' });
                                                if (res.ok) alert('Event Ended Successfully');
                                                else alert('Failed to end event');
                                            } catch (e) {
                                                console.error(e);
                                                alert('Error ending event');
                                            }
                                        }
                                    }}
                                >
                                    End Event
                                </Button>
                            </>
                        )}
                        <Button
                            variant="outlined"
                            startIcon={<IconBroadcast className="animate-pulse" />}
                            onClick={async () => {
                                try {
                                    window.location.reload();
                                } catch (e) {
                                    console.error(e);
                                }
                            }}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<IconPlus />}
                            onClick={() => setDialogOpen(true)}
                            sx={{ bgcolor: '#5D87FF' }}
                        >
                            Create Event
                        </Button>
                    </Stack>
                </Stack>

                <Grid container spacing={3}>
                    {/* Top Stats Row */}
                    <Grid size={12}>
                        <NCCStats />
                    </Grid>

                    {/* Strength Table & Recent Activity */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <StrengthOverview />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={3}>
                            <LiveEventCard />
                            <RecentActivity />
                        </Stack>
                    </Grid>

                </Grid>

                <CreateEventDialog
                    open={isDialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onSuccess={() => window.location.reload()}
                />
            </Box>
        </PageContainer>
    );
}

export default DashboardView;
