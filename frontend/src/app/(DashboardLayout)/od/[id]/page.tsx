'use client';
import { Box, Button, Stack, Typography } from '@mui/material';
import { use, useState, useEffect } from 'react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import ODStats from '@/app/(DashboardLayout)/components/dashboard/ODStats';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ODDetailPage = ({ params }: Props) => {
    const { id: eventId } = use(params);
    const [eventTitle, setEventTitle] = useState(eventId);
    const [eventDate, setEventDate] = useState('');

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const res = await fetch('/api/events');
                if (res.ok) {
                    const events = await res.json();
                    const found = events.find((e: any) => e["Event ID"] === eventId);
                    if (found) {
                        setEventTitle(found.Title);
                        setEventDate(found.Date);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch event details");
            }
        };
        fetchEventDetails();
    }, [eventId]);

    return (
        <PageContainer title="OD Details" description="List of cadets on OD">
            <DashboardCard title="On Duty List">
                <Box>
                    <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                        <Button
                            component={Link}
                            href="/od"
                            startIcon={<IconArrowLeft />}
                            color="inherit"
                        >
                            Back to Events
                        </Button>
                        <Box>
                            <Typography variant="h4" fontWeight={600} color="primary">
                                {eventTitle}
                            </Typography>
                            <Typography variant="subtitle1" color="textSecondary">
                                {eventDate ? `Date: ${eventDate}` : `Event ID: ${eventId}`}
                            </Typography>
                        </Box>
                    </Stack>

                    <ODStats eventId={eventId} />
                </Box>
            </DashboardCard>
        </PageContainer>
    );
};

export default ODDetailPage;
