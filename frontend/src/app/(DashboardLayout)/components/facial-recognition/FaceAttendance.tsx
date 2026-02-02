'use client';
import { useState, useRef } from 'react';
import { Box, Button, Typography, Stack, Alert, Card, CardContent, CircularProgress, Grid, FormControlLabel, Checkbox } from '@mui/material';
import { IconScan, IconCheck, IconX, IconUserCheck, IconClock } from '@tabler/icons-react';

interface FaceAttendanceProps {
    eventId: string;
}

type RecognitionStep = 'scanning' | 'verified' | 'od_selection' | 'success' | 'error';

const FaceAttendance = ({ eventId }: FaceAttendanceProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);

    // State for the new flow
    const [step, setStep] = useState<RecognitionStep>('scanning');
    const [detectedPerson, setDetectedPerson] = useState<{ name: string; regNo: string } | null>(null);
    const [selectedHours, setSelectedHours] = useState<number[]>([]);
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const startCamera = async () => {
        setStep('scanning');
        setDetectedPerson(null);
        setSelectedHours([]);
        setMessage('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreamActive(true);
            }
        } catch (err) {
            setStep('error');
            setMessage('Camera access denied');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsStreamActive(false);
        }
    };

    const processRecognition = async (blob: Blob) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', blob, 'scan.jpg');

        try {
            const recognizeRes = await fetch('/api/recognize', {
                method: 'POST',
                body: formData,
            });
            const data = await recognizeRes.json();

            if (!data.match) {
                setMessage('Face not recognized. Try again.');
                setLoading(false);
                return; // Keep camera running or let user try again
            }

            // Match found! Pause and show options
            setDetectedPerson({ name: data.name, regNo: data.reg_no });
            setStep('verified');
            // We do NOT stop the camera here to keep the "live" feel, 
            // but we stop auto-scanning (if we had a loop). 
            // Since this is manual trigger, we just wait.

        } catch (error) {
            console.error(error);
            setMessage('System error during recognition.');
        } finally {
            setLoading(false);
        }
    };

    const submitAttendance = async (status: string) => {
        if (!detectedPerson) return;
        setLoading(true);

        const logFormData = new FormData();
        logFormData.append('name', detectedPerson.name);
        logFormData.append('reg_no', detectedPerson.regNo);
        logFormData.append('event_id', eventId);
        logFormData.append('status', status);

        try {
            const logRes = await fetch('/api/log_attendance', {
                method: 'POST',
                body: logFormData,
            });

            if (logRes.ok) {
                setStep('success');
                setMessage(status === 'Present' ? 'Marked Present ✅' : `OD Request Submitted: ${status}`);
                stopCamera();
            } else {
                throw new Error('Logging failed');
            }
        } catch (error) {
            console.error(error);
            setMessage('Failed to log attendance.');
        } finally {
            setLoading(false);
        }
    };

    const handleODSelectionToggle = (hour: number) => {
        setSelectedHours(prev => {
            if (prev.includes(hour)) {
                return prev.filter(h => h !== hour);
            } else {
                return [...prev, hour].sort((a, b) => a - b);
            }
        });
    };

    const captureAndScan = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) processRecognition(blob);
                }, 'image/jpeg');
            }
        }
    };

    return (
        <Card sx={{ height: '100%', bgcolor: '#e8f5e9' }}>
            <CardContent>
                <Typography variant="h5" fontWeight={700} mb={3} color="primary.dark">
                    Mark Attendance (AI)
                </Typography>

                <Stack spacing={2} alignItems="center">
                    {/* Camera/Result Box */}
                    <Box sx={{
                        width: '100%',
                        height: '300px',
                        bgcolor: '#000',
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}>
                        {!isStreamActive && step === 'scanning' && (
                            <Button
                                variant="contained"
                                startIcon={<IconScan />}
                                onClick={startCamera}
                                size="large"
                            >
                                Start Scanner
                            </Button>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: isStreamActive ? 'block' : 'none',
                                opacity: step === 'verified' || step === 'od_selection' ? 0.4 : 1 // Dim video when options appear
                            }}
                        />

                        {/* Overlays */}
                        {loading && (
                            <Box position="absolute" display="flex" flexDirection="column" alignItems="center">
                                <CircularProgress color="secondary" />
                                <Typography color="white" mt={1}>Processing...</Typography>
                            </Box>
                        )}

                        {message && step === 'scanning' && !loading && (
                            <Typography color="error" position="absolute" bottom={10} bgcolor="rgba(0,0,0,0.7)" p={1} borderRadius={1}>
                                {message}
                            </Typography>
                        )}

                        {step === 'success' && (
                            <Stack alignItems="center" spacing={1} sx={{ color: 'white', position: 'absolute', zIndex: 2 }}>
                                <IconCheck size={64} color="#4caf50" />
                                <Typography variant="h4" fontWeight={700}>
                                    {detectedPerson?.name}
                                </Typography>
                                <Typography variant="h6">
                                    {message}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    sx={{ mt: 2, color: 'white', borderColor: 'white' }}
                                    onClick={startCamera}
                                >
                                    Scan Next Person
                                </Button>
                            </Stack>
                        )}

                        {step === 'error' && (
                            <Stack alignItems="center" spacing={1} sx={{ color: 'white', position: 'absolute', zIndex: 2 }}>
                                <IconX size={64} color="#f44336" />
                                <Typography variant="h6">{message}</Typography>
                                <Button onClick={startCamera} sx={{ color: 'white' }}>Retry</Button>
                            </Stack>
                        )}
                    </Box>

                    {/* Controls Area */}

                    {step === 'scanning' && isStreamActive && !loading && (
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            onClick={captureAndScan}
                            fullWidth
                            startIcon={<IconScan />}
                        >
                            Capture & Verify
                        </Button>
                    )}

                    {step === 'verified' && detectedPerson && (
                        <Box width="100%" textAlign="center">
                            <Typography variant="h4" color="primary" fontWeight={700} gutterBottom>
                                {detectedPerson.name}
                            </Typography>
                            <Typography variant="body1" color="textSecondary" mb={2}>
                                {detectedPerson.regNo}
                            </Typography>

                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<IconUserCheck />}
                                    onClick={() => submitAttendance('Present')}
                                >
                                    Mark Present
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    size="large"
                                    startIcon={<IconClock />}
                                    onClick={() => setStep('od_selection')}
                                >
                                    Request OD
                                </Button>
                            </Stack>
                            <Button size="small" sx={{ mt: 1 }} onClick={startCamera}>Cancel / Rescan</Button>
                        </Box>
                    )}

                    {step === 'od_selection' && (
                        <Box width="100%">
                            <Typography variant="h6" align="center" gutterBottom>
                                Select OD Hours for {detectedPerson?.name}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" mb={2} useFlexGap>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                                    <Box key={hour}>
                                        <Button
                                            variant={selectedHours.includes(hour) ? "contained" : "outlined"}
                                            color={selectedHours.includes(hour) ? "warning" : "inherit"}
                                            onClick={() => handleODSelectionToggle(hour)}
                                            sx={{ minWidth: '40px' }}
                                        >
                                            {hour}
                                        </Button>
                                    </Box>
                                ))}
                            </Stack>

                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button
                                    variant="contained"
                                    color="warning"
                                    disabled={selectedHours.length === 0}
                                    onClick={() => submitAttendance(selectedHours.join(', '))}
                                >
                                    Submit OD ({selectedHours.length} slots)
                                </Button>
                                <Button variant="text" onClick={() => setStep('verified')}>
                                    Back
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </Stack>
            </CardContent>
        </Card>
    );
};

export default FaceAttendance;
