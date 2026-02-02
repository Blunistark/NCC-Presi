'use client';
import { useState, useRef, useCallback } from 'react';
import { Box, Button, TextField, Typography, Stack, Alert, Card, CardContent } from '@mui/material';
import { IconCamera, IconUserPlus } from '@tabler/icons-react';

const FaceRegistration = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
    const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [regNo, setRegNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreamActive(true);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Could not access camera by default' });
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

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        setCapturedImage(blob);
                        setCapturedPreview(URL.createObjectURL(blob));
                        stopCamera();
                    }
                }, 'image/jpeg');
            }
        }
    };

    const handleRegister = async () => {
        if (!name || !regNo || !capturedImage) {
            setMessage({ type: 'error', text: 'Please fill all details and capture a photo.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('regimental_number', regNo);
        formData.append('file', capturedImage, 'registration.jpg');

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Registration failed');

            const data = await response.json();
            setMessage({ type: 'success', text: data.message || 'Cadet registered successfully!' });

            // Reset form
            setName('');
            setRegNo('');
            setCapturedImage(null);
            setCapturedPreview(null);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to register cadet. Is the backend running?' });
        } finally {
            setLoading(false);
        }
    };

    const resetCapture = () => {
        setCapturedImage(null);
        setCapturedPreview(null);
        startCamera();
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h5" fontWeight={700} mb={3}>
                    Cadet Registration (Face ID)
                </Typography>

                <Stack spacing={3}>
                    <TextField
                        label="Full Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        label="Regimental Number"
                        fullWidth
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                    />

                    {/* Camera Preview Area */}
                    <Box sx={{
                        height: '300px',
                        bgcolor: '#000',
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {!isStreamActive && !capturedPreview && (
                            <Button
                                variant="contained"
                                startIcon={<IconCamera />}
                                onClick={startCamera}
                            >
                                Start Camera
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
                                display: isStreamActive ? 'block' : 'none'
                            }}
                        />

                        {capturedPreview && (
                            <img
                                src={capturedPreview}
                                alt="Captured"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}

                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Box>

                    {/* Camera Controls */}
                    {isStreamActive && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={captureImage}
                        >
                            Capture Photo
                        </Button>
                    )}

                    {capturedPreview && (
                        <Button
                            variant="outlined"
                            onClick={resetCapture}
                        >
                            Retake Photo
                        </Button>
                    )}

                    {/* Submit */}
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<IconUserPlus />}
                        disabled={loading || !capturedImage}
                        onClick={handleRegister}
                    >
                        {loading ? 'Registering...' : 'Register Cadet'}
                    </Button>

                    {message && (
                        <Alert severity={message.type}>
                            {message.text}
                        </Alert>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default FaceRegistration;
