'use client';
import { useState, useRef } from 'react';
import { Box, Button, Typography, Stack, Alert, Card, CardContent, CircularProgress } from '@mui/material';
import { IconScan, IconCheck, IconX } from '@tabler/icons-react';

interface FaceAttendanceProps {
    eventId: string;
}

const FaceAttendance = ({ eventId }: FaceAttendanceProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        name?: string;
        regNo?: string;
        message: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const startCamera = async () => {
        setScanResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreamActive(true);
            }
        } catch (err) {
            setScanResult({ success: false, message: 'Camera access denied' });
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

    const processAttendance = async (blob: Blob) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', blob, 'scan.jpg');

        try {
            // Step 1: Recognize
            // Note: Recognize currently checks todays_attendance which is memory based. 
            // We might want to remove that check eventually if valid for multiple events, 
            // but backend handles duplicates okay now.
            const recognizeRes = await fetch('http://localhost:8000/recognize', {
                method: 'POST',
                body: formData,
            });
            const data = await recognizeRes.json();

            if (!data.match) {
                setScanResult({ success: false, message: 'Face not recognized. Try again.' });
                setLoading(false);
                return;
            }

            // Step 2: Log Attendance
            const logFormData = new FormData();
            logFormData.append('name', data.name);
            logFormData.append('reg_no', data.reg_no);
            logFormData.append('event_id', eventId);

            const logRes = await fetch('http://localhost:8000/log_attendance', {
                method: 'POST',
                body: logFormData,
            });

            if (logRes.ok) {
                setScanResult({
                    success: true,
                    name: data.name,
                    regNo: data.reg_no,
                    message: 'Marked Present ✅'
                });
            } else {
                throw new Error('Logging failed');
            }

        } catch (error) {
            console.error(error);
            setScanResult({ success: false, message: 'System error. Is backend running?' });
        } finally {
            setLoading(false);
            stopCamera(); // Stop camera on result to show outcome clearly
        }
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
                    if (blob) processAttendance(blob);
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
                        justifyContent: 'center'
                    }}>
                        {!isStreamActive && !scanResult && !loading && (
                            <Button
                                variant="contained"
                                startIcon={<IconScan />}
                                onClick={startCamera}
                                size="large"
                            >
                                Start Scanner
                            </Button>
                        )}

                        {loading && (
                            <CircularProgress color="secondary" />
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: isStreamActive && !loading ? 'block' : 'none'
                            }}
                        />

                        {scanResult && !loading && (
                            <Stack alignItems="center" spacing={1} sx={{ color: 'white' }}>
                                {scanResult.success ? (
                                    <IconCheck size={64} color="#4caf50" />
                                ) : (
                                    <IconX size={64} color="#f44336" />
                                )}
                                <Typography variant="h4" fontWeight={700}>
                                    {scanResult.name || 'Unknown'}
                                </Typography>
                                <Typography variant="subtitle1">
                                    {scanResult.message}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    sx={{ mt: 2, color: 'white', borderColor: 'white' }}
                                    onClick={startCamera}
                                >
                                    Scan Next
                                </Button>
                            </Stack>
                        )}

                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Box>

                    {/* Scan Button */}
                    {isStreamActive && !loading && (
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
                </Stack>
            </CardContent>
        </Card>
    );
};

export default FaceAttendance;
