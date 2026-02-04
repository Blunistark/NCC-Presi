'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Grid, Box, Typography, Divider, Stack, Chip, Breadcrumbs, Link as MuiLink, Button, CircularProgress, Alert } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { fetchCadetById } from '@/utils/cadetService';
import { Cadet } from '@/types';
import BlankCard from '@/app/(DashboardLayout)/components/shared/BlankCard';

const CadetProfile = () => {
    const params = useParams();
    const id = params.id as string; // Expecting string ID
    const [cadet, setCadet] = useState<Cadet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCadet = async () => {
            if (!id) {
                setError('Invalid Cadet ID');
                setLoading(false);
                return;
            }

            try {
                const data = await fetchCadetById(id);
                if (data) {
                    setCadet(data);
                } else {
                    setError('Cadet not found');
                }
            } catch (err) {
                setError('Failed to load cadet details');
            } finally {
                setLoading(false);
            }
        };
        loadCadet();
    }, [id]);

    if (loading) {
        return (
            <PageContainer title="Loading..." description="Fetching Cadet Details">
                <Box textAlign="center" py={10}>
                    <CircularProgress />
                    <Typography mt={2}>Loading Cadet Profile...</Typography>
                </Box>
            </PageContainer>
        );
    }

    if (error || !cadet) {
        return (
            <PageContainer title="Error" description="Cadet Not Found">
                <Box py={5}>
                    <Alert severity="error">{error || 'Cadet not found'}</Alert>
                    <Button component={Link} href="/cadets" sx={{ mt: 2 }}>Back to Cadets</Button>
                </Box>
            </PageContainer>
        );
    }

    const DetailRow = ({ label, value }: { label: string, value: string | undefined }) => (
        <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 5, sm: 4 }}>
                <Typography variant="subtitle1" fontWeight={600} color="textSecondary">
                    {label}
                </Typography>
            </Grid>
            <Grid size={{ xs: 7, sm: 8 }}>
                <Typography variant="subtitle1" color="textPrimary">
                    {value || '-'}
                </Typography>
            </Grid>
        </Grid>
    );

    return (
        <PageContainer title={cadet.name} description="Cadet Details">
            {/* Navigation Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Breadcrumbs aria-label="breadcrumb">
                    <MuiLink component={Link} underline="hover" color="inherit" href="/">
                        Home
                    </MuiLink>
                    <MuiLink component={Link} underline="hover" color="inherit" href="/cadets">
                        Cadets
                    </MuiLink>
                    <Typography color="text.primary">Profile</Typography>
                </Breadcrumbs>
                <Button
                    component={Link}
                    href="/cadets"
                    variant="outlined"
                    startIcon={<IconArrowLeft />}
                >
                    Back to List
                </Button>
            </Stack>

            <DashboardCard title="Cadet Profile">
                <Grid container spacing={4}>
                    {/* Left Column: Basic Details */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Box>
                            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                                {cadet.name}
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            <DetailRow label="Enrollment ID" value={cadet.enrollmentId} />
                            <DetailRow label="Rank" value={cadet.rank} />
                            <DetailRow label="Year" value={cadet.year} />
                            <DetailRow label="Department" value={cadet.department} />
                            <DetailRow label="PU Roll Number" value={cadet.puRollNumber} />
                            <DetailRow label="SD/SW" value={cadet.sdSw} />
                            <DetailRow label="Mobile Number" value={cadet.mobileNumber} />
                            <DetailRow label="Email ID" value={cadet.email} />
                            <DetailRow label="Date of Birth" value={cadet.dob} />
                            <DetailRow label="Blood Group" value={cadet.bloodGroup} />
                        </Box>
                    </Grid>

                    {/* Right Column: Photo */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <BlankCard>
                            <Box
                                component="img"
                                src={cadet.photo}
                                alt={cadet.name}
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    maxHeight: '400px'
                                }}
                            />
                        </BlankCard>
                        {cadet.rankHolder && (
                            <Box mt={2} textAlign="center">
                                <Chip label="Rank Holder" color="primary" />
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </DashboardCard>
        </PageContainer>
    );
};

export default CadetProfile;
