'use client';
import {
    Timeline,
    TimelineItem,
    TimelineOppositeContent,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent,
    timelineOppositeContentClasses,
} from '@mui/lab';
import { Link, Typography, Box, CircularProgress } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useState, useEffect } from 'react';

const RecentActivity = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const res = await fetch('/api/recent_events');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, []);

    // Helper to format YYYY-MM-DD
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}`; // DD-MM for timeline
        }
        return dateStr;
    };

    const getColor = (type: string) => {
        if (!type) return "primary";
        const t = type.toLowerCase();
        if (t.includes('drill') || t.includes('parade')) return "warning";
        if (t.includes('camp')) return "success";
        return "primary";
    };

    return (
        <DashboardCard title="Recent Activity">
            <Box sx={{
                maxHeight: '300px',
                overflowY: 'auto',
                pr: 2,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
            }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={2}><CircularProgress size={24} /></Box>
                ) : (
                    <Timeline
                        className="theme-timeline"
                        sx={{
                            p: 0,
                            mb: '-40px',
                            [`& .${timelineOppositeContentClasses.root}`]: {
                                flex: 0.5,
                                paddingLeft: 0,
                            },
                        }}
                    >
                        {events.map((ev, index) => (
                            <TimelineItem key={index}>
                                <TimelineOppositeContent>
                                    <Typography variant="body2" color="textSecondary">
                                        {formatDate(ev.date)}
                                    </Typography>
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color={getColor(ev.type)} variant="outlined" />
                                    <TimelineConnector />
                                </TimelineSeparator>
                                <TimelineContent>
                                    <Typography fontWeight="600">{ev.title}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {ev.type}
                                    </Typography>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                        {events.length === 0 && (
                            <Typography variant="body2" textAlign="center" py={2} color="textSecondary">
                                No recent activity found.
                            </Typography>
                        )}
                    </Timeline>
                )}
            </Box>
        </DashboardCard>
    );
};

export default RecentActivity;
