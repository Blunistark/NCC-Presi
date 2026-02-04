'use client';
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Stack,
    Alert,
    CircularProgress
} from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import FaceAttendance from '@/app/(DashboardLayout)/components/facial-recognition/FaceAttendance';
import { IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    type: string;
}

const AttendancePage = () => {
    const router = useRouter();
    const [selectedEvent, setSelectedEvent] = useState('');
    const [isAttendanceMode, setIsAttendanceMode] = useState(false);
    const [activeEvents, setActiveEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActiveEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/events');
            if (response.ok) {
                const data = await response.json();
                setActiveEvents(data);
            }
        } catch (error) {
            console.error('Failed to load events', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveEvents();
    }, []);

    const handleStart = () => {
        if (selectedEvent) {
            setIsAttendanceMode(true);
        }
    };

    return (
        <PageContainer title="Mark Attendance" description="Select Event and Mark Attendance">
            <Box>
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Button
                            startIcon={<IconArrowLeft />}
                            onClick={() => router.back()}
                            color="inherit"
                        >
                            Back
                        </Button>
                        <Typography variant="h4" fontWeight={700}>
                            Mark Attendance
                        </Typography>
                    </Stack>

                    {!isAttendanceMode && (
                        <Button
                            startIcon={<IconRefresh />}
                            onClick={fetchActiveEvents}
                            size="small"
                        >
                            Refresh List
                        </Button>
                    )}
                </Stack>

                {!isAttendanceMode ? (
                    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 5 }}>
                        <CardContent>
                            <Typography variant="h5" fontWeight={600} mb={3}>
                                Select Event / Parade
                            </Typography>

                            {loading ? (
                                <Box textAlign="center" py={3}>
                                    <CircularProgress />
                                    <Typography mt={2}>Loading active events...</Typography>
                                </Box>
                            ) : activeEvents.length > 0 ? (
                                <>
                                    <FormControl fullWidth sx={{ mb: 3 }}>
                                        <InputLabel>Active Event</InputLabel>
                                        <Select
                                            value={selectedEvent}
                                            label="Active Event"
                                            onChange={(e) => setSelectedEvent(e.target.value)}
                                        >
                                            {activeEvents.map((event) => (
                                                <MenuItem key={event.id} value={event.id}>
                                                    {event.title} ({event.date} | {event.time})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        disabled={!selectedEvent}
                                        onClick={handleStart}
                                    >
                                        Start Attendance
                                    </Button>
                                </>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <Typography color="textSecondary">No events found.</Typography>
                                    <Typography variant="body2" mt={1}>Create an event from the Dashboard first.</Typography>
                                </Box>
                            )}

                            <Alert severity="info" sx={{ mt: 3 }}>
                                Please ensure you are connected to the internet and have camera permissions enabled.
                            </Alert>
                        </CardContent>
                    </Card>
                ) : (
                    /* Attendance Mode */
                    <Grid container justifyContent="center">
                        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
                            <Box sx={{ height: '80vh' }}>
                                <FaceAttendance eventId={selectedEvent} />
                            </Box>
                            <Button
                                fullWidth
                                color="error"
                                sx={{ mt: 2 }}
                                onClick={() => setIsAttendanceMode(false)}
                            >
                                Stop Session
                            </Button>
                        </Grid>
                    </Grid>
                )}
            </Box>
        </PageContainer>
    );
};

export default AttendancePage;
