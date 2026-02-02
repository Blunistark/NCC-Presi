'use client';
import { Grid, Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import FaceRegistration from '../components/facial-recognition/FaceRegistration';

const RegisterPage = () => {
    return (
        <PageContainer title="Register Cadet" description="Register Cadet Face for Attendance">
            <Box>
                <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12} md={8} lg={6}>
                        <FaceRegistration />
                    </Grid>
                </Grid>
            </Box>
        </PageContainer>
    );
};

export default RegisterPage;
