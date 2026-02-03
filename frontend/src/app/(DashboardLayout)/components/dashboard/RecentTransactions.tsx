import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
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
import { Link, Typography, Chip, Box, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';

const RecentTransactions = () => {
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
    <DashboardCard title="Recent Parades">
      <>
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}><CircularProgress size={24} /></Box>
        ) : (
          <Timeline
            className="theme-timeline"
            sx={{
              p: 0,
              mb: '-40px',
              '& .MuiTimelineConnector-root': {
                width: '1px',
                backgroundColor: '#efefef'
              },
              [`& .${timelineOppositeContentClasses.root}`]: {
                flex: 0.5,
                paddingLeft: 0,
              },
            }}
          >
            {events.map((ev, index) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(ev.Date)}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={getColor(ev.Type)} variant="outlined" />
                  {index < events.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography fontWeight="600" variant="subtitle2">
                    {ev.Title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {ev.Type}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
            {events.length === 0 && (
              <Typography variant="body2" textAlign="center" py={2} color="textSecondary">
                No recent events found.
              </Typography>
            )}
          </Timeline>
        )}
      </>
    </DashboardCard>
  );
};

export default RecentTransactions;
