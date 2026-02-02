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
import { Link, Typography, Box } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { mockMandatoryParades, mockSocialDrives } from '@/utils/mockEvents';

const RecentActivity = () => {
    // Combine and sort events by date (descending)
    const allEvents = [
        ...mockMandatoryParades.map(e => ({ ...e, type: 'Parade', color: 'primary.main' })),
        ...mockSocialDrives.map(e => ({ ...e, type: 'Social', color: 'secondary.main' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Take top 5

    return (
        <DashboardCard title="Recent Activity">
            <Box sx={{
                maxHeight: '300px',
                overflowY: 'auto',
                pr: 2,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
            }}>
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
                    {allEvents.map((event, index) => (
                        <TimelineItem key={`${event.type}-${event.id}`}>
                            <TimelineOppositeContent>
                                <Typography variant="body2" color="textSecondary">
                                    {event.date}
                                </Typography>
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                                <TimelineDot color={event.type === 'Parade' ? 'primary' : 'secondary'} variant="outlined" />
                                <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent>
                                <Typography fontWeight="600">{event.title}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Attendance: {event.attended}/{event.totalStrength}
                                </Typography>
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            </Box>
        </DashboardCard>
    );
};

export default RecentActivity;
