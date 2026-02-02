'use client';
import { Grid, Box, Stack, Typography, Avatar, Skeleton } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { IconUsers, IconFlag, IconBuildingSkyscraper, IconHeartHandshake } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

const NCCStats = () => {
    const [statsData, setStatsData] = useState({
        totalStrength: 0,
        mandatoryCount: 0,
        socialCount: 0,
        collegeCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Strength
                const strengthRes = await fetch('http://localhost:8000/strength');
                const strengthData = await strengthRes.json();
                const totalStrength = strengthData.total || 0;

                // Fetch Events
                const eventsRes = await fetch('http://localhost:8000/events');
                const eventsData = await eventsRes.json();

                const mandatoryCount = eventsData.filter((e: any) => e.Type === 'Mandatory Parade').length;
                const socialCount = eventsData.filter((e: any) => e.Type === 'Social Drive').length;
                const collegeCount = eventsData.filter((e: any) => e.Type === 'College Event').length;

                setStatsData({
                    totalStrength,
                    mandatoryCount,
                    socialCount,
                    collegeCount
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const stats = [
        {
            title: "Total Strength",
            value: statsData.totalStrength.toString(),
            subtitle: "Enrolled Cadets",
            icon: IconUsers,
            color: '#5D87FF',
            bgcolor: '#ecf2ff',
        },
        {
            title: "Mandatory Parades",
            value: statsData.mandatoryCount.toString(),
            subtitle: "Conducted",
            icon: IconFlag,
            color: '#FFAD33', // Orange
            bgcolor: '#FFF7E6',
        },
        {
            title: "Social Drives",
            value: statsData.socialCount.toString(),
            subtitle: "Conducted",
            icon: IconHeartHandshake,
            color: '#13DEB9', // Teal
            bgcolor: '#E6FFFA',
        },
        {
            title: "College Events",
            value: statsData.collegeCount.toString(),
            subtitle: "Conducted",
            icon: IconBuildingSkyscraper,
            color: '#FA896B', // Redish
            bgcolor: '#FBF2EF',
        },
    ];

    return (
        <Grid container spacing={3}>
            {stats.map((stat, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                    <DashboardCard title={stat.title}>
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Avatar
                                variant="rounded"
                                sx={{
                                    bgcolor: stat.bgcolor,
                                    color: stat.color,
                                    width: 50,
                                    height: 50,
                                }}
                            >
                                <stat.icon width={30} height={30} stroke={2} />
                            </Avatar>
                            <Box>
                                {loading ? (
                                    <Skeleton variant="text" width={60} height={40} />
                                ) : (
                                    <Typography variant="h3" fontWeight="700">
                                        {stat.value}
                                    </Typography>
                                )}
                                <Typography variant="subtitle2" color="textSecondary">
                                    {stat.subtitle}
                                </Typography>
                            </Box>
                        </Stack>
                    </DashboardCard>
                </Grid>
            ))}
        </Grid>
    );
};

export default NCCStats;
