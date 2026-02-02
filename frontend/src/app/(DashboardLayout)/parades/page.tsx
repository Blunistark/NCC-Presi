'use client';
import { Grid, Box, Typography, CardContent, Stack, Avatar } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import BlankCard from '@/app/(DashboardLayout)/components/shared/BlankCard';
import {
    IconWalk,
    IconHeartHandshake,
    IconSchool,
    IconTent,
    IconDots,
    IconPlus,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@mui/material';
import CreateEventDialog from '@/app/(DashboardLayout)/components/parades/CreateEventDialog';

const paradeCategories = [
    {
        id: 1,
        title: 'Mandatory Parades',
        icon: IconWalk,
        color: '#5D87FF', // Primary Blue
        bgColor: '#E8F7FF',
        link: '/parades/mandatory',
    },
    {
        id: 2,
        title: 'Social Drives',
        icon: IconHeartHandshake,
        color: '#49BEFF', // Secondary Blue
        bgColor: '#E1F5FF',
        link: '/parades/social-drives',
    },
    {
        id: 3,
        title: 'College Events',
        icon: IconSchool,
        color: '#13DEB9', // Success/Teal
        bgColor: '#E6FFFA',
        link: '/parades/college-events',
    },
    {
        id: 4,
        title: 'Camps',
        icon: IconTent,
        color: '#FFAE1F', // Warning/Orange
        bgColor: '#FEF5E5',
        link: '/parades/camps',
    },
    {
        id: 5,
        title: 'Others',
        icon: IconDots,
        color: '#FA896B', // Error/Red
        bgColor: '#FBF2EF',
        link: '/parades/others',
    },
];

const ParadesPage = () => {
    const [isDialogOpen, setDialogOpen] = useState(false);

    return (
        <PageContainer title="Parades" description="Select Parade Category">
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Parade Categories
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<IconPlus />}
                        onClick={() => setDialogOpen(true)}
                        sx={{ bgcolor: '#5D87FF' }}
                    >
                        Create Event
                    </Button>
                </Stack>

                <Grid container spacing={3}>
                    {paradeCategories.map((category) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
                            <Box component={Link} href={category.link} sx={{ textDecoration: 'none' }}>
                                <BlankCard>
                                    <CardContent sx={{ p: 4, textAlign: 'center', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                                        <Stack direction="column" alignItems="center" spacing={2}>
                                            <Avatar
                                                variant="rounded"
                                                sx={{
                                                    bgcolor: category.bgColor,
                                                    color: category.color,
                                                    width: 80,
                                                    height: 80,
                                                }}
                                            >
                                                <category.icon size={40} stroke={1.5} />
                                            </Avatar>
                                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2A3547' }}>
                                                {category.title}
                                            </Typography>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                View Details
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </BlankCard>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <CreateEventDialog open={isDialogOpen} onClose={() => setDialogOpen(false)} />
            </Box>
        </PageContainer>
    );
};

export default ParadesPage;
