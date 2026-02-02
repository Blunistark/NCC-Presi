'use client';
import { useState } from 'react';
import {
    Box,
    Typography,
    Stack,
    TextField,
    FormGroup,
    FormControlLabel,
    Checkbox,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    Breadcrumbs,
    Link as MuiLink
} from '@mui/material';
import { IconSearch, IconArrowLeft, IconCheck, IconX } from '@tabler/icons-react';
import { mockCadets } from '@/utils/mockCadets';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface EventData {
    id: number;
    title: string;
    date: string;
    attended: number;
    totalStrength: number;
}

interface Props {
    event: EventData;
    categoryTitle: string;
    categoryLink: string;
}

const EventAttendanceView = ({ event, categoryTitle, categoryLink }: Props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        '3rd Year': false,
        '2nd Year': false,
        '1st Year': false,
        'Present': false,
        'Absent': false,
    });

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            [event.target.name]: event.target.checked,
        });
    };

    // Mocking attendance status for this specific event
    // In a real app, this would come from an API based on event ID
    const extendedCadets = mockCadets.map((cadet, index) => ({
        ...cadet,
        status: (index + event.id) % 5 === 0 ? 'Absent' : 'Present' // Randomized stable mock status
    }));

    const filteredCadets = extendedCadets.filter((cadet) => {
        // 1. Search Filter
        const matchesSearch = cadet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cadet.regimentalNumber.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Year Filters
        const yearFiltersActive = filters['3rd Year'] || filters['2nd Year'] || filters['1st Year'];
        const matchesYear = !yearFiltersActive || filters[cadet.year as keyof typeof filters];

        // 3. Status Filters
        const statusFiltersActive = filters['Present'] || filters['Absent'];
        const matchesStatus = !statusFiltersActive || filters[cadet.status as keyof typeof filters];

        return matchesSearch && matchesYear && matchesStatus;
    });

    return (
        <PageContainer title={event.title} description="Event Attendance Details">
            {/* Navigation Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Breadcrumbs aria-label="breadcrumb">
                    <MuiLink component={Link} underline="hover" color="inherit" href="/">
                        Home
                    </MuiLink>
                    <MuiLink component={Link} underline="hover" color="inherit" href="/parades">
                        Parades
                    </MuiLink>
                    <MuiLink component={Link} underline="hover" color="inherit" href={categoryLink}>
                        {categoryTitle}
                    </MuiLink>
                    <Typography color="text.primary">{event.title}</Typography>
                </Breadcrumbs>
                <Button
                    component={Link}
                    href={categoryLink}
                    variant="outlined"
                    startIcon={<IconArrowLeft />}
                >
                    Back to {categoryTitle}
                </Button>
            </Stack>

            <DashboardCard title={`${event.title} - Attendance Record`}>
                <Box>
                    <Typography variant="subtitle1" color="textSecondary" mb={3}>
                        Date: {event.date} | Total Strength: {event.totalStrength} | Present: {event.attended}
                    </Typography>

                    {/* Filters and Search Bar */}
                    <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems="center"
                        mb={4}
                    >
                        {/* Search Bar */}
                        <Box sx={{ width: { xs: '100%', lg: '30%' } }}>
                            <TextField
                                fullWidth
                                size='small'
                                variant="outlined"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconSearch size={20} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        {/* Filters */}
                        <Box>
                            <FormGroup row>
                                <FormControlLabel
                                    control={<Checkbox size='small' checked={filters['3rd Year']} onChange={handleFilterChange} name="3rd Year" />}
                                    label={<Typography variant="body2">3rd Year</Typography>}
                                />
                                <FormControlLabel
                                    control={<Checkbox size='small' checked={filters['2nd Year']} onChange={handleFilterChange} name="2nd Year" />}
                                    label={<Typography variant="body2">2nd Year</Typography>}
                                />
                                <FormControlLabel
                                    control={<Checkbox size='small' checked={filters['1st Year']} onChange={handleFilterChange} name="1st Year" />}
                                    label={<Typography variant="body2">1st Year</Typography>}
                                />
                                <Box mx={2} sx={{ borderRight: '1px solid #e0e0e0' }} />
                                <FormControlLabel
                                    control={<Checkbox size='small' checked={filters['Present']} onChange={handleFilterChange} name="Present" color="success" />}
                                    label={<Typography variant="body2">Present</Typography>}
                                />
                                <FormControlLabel
                                    control={<Checkbox size='small' checked={filters['Absent']} onChange={handleFilterChange} name="Absent" color="error" />}
                                    label={<Typography variant="body2">Absent</Typography>}
                                />
                            </FormGroup>
                        </Box>
                    </Stack>

                    {/* Attendance Table */}
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table sx={{ minWidth: 650 }} aria-label="attendance table">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Regimental No</strong></TableCell>
                                    <TableCell><strong>Rank</strong></TableCell>
                                    <TableCell><strong>Name</strong></TableCell>
                                    <TableCell><strong>Year</strong></TableCell>
                                    <TableCell align="center"><strong>Status</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCadets.map((cadet) => (
                                    <TableRow
                                        key={cadet.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Typography variant="body2">{cadet.regimentalNumber}</Typography>
                                        </TableCell>
                                        <TableCell>{cadet.rank}</TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                {cadet.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{cadet.year}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={cadet.status}
                                                color={cadet.status === 'Present' ? 'success' : 'error'}
                                                size="small"
                                                icon={cadet.status === 'Present' ? <IconCheck size={16} /> : <IconX size={16} />}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredCadets.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Box py={3}>
                                                <Typography color="textSecondary">No records found</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DashboardCard>
        </PageContainer>
    );
};

export default EventAttendanceView;
