'use client';
import { useState, useEffect } from 'react';
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
    Link as MuiLink,
    CircularProgress,
    Alert
} from '@mui/material';
import { IconSearch, IconArrowLeft, IconCheck, IconX } from '@tabler/icons-react';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import Link from 'next/link';

interface EventData {
    id: string; // Changed to string
    title: string;
    date: string;
    attended: number;
    totalStrength: number;
}

interface CadetAttendance {
    id: string;
    regimentalNumber: string;
    rank: string;
    name: string;
    year: string;
    status: string;
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
        'OD': false,
    });

    const [attendanceList, setAttendanceList] = useState<CadetAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await fetch(`/api/event_attendance/${event.id}`);
                if (!res.ok) throw new Error('Failed to fetch attendance list');
                const data = await res.json();
                setAttendanceList(data);
            } catch (err) {
                console.error(err);
                setError('Could not load attendance list.');
            } finally {
                setLoading(false);
            }
        };

        if (event.id) {
            fetchAttendance();
        }
    }, [event.id]);

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            [event.target.name]: event.target.checked,
        });
    };

    const filteredCadets = attendanceList.filter((cadet) => {
        // 1. Search Filter
        const matchesSearch = cadet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cadet.regimentalNumber.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Year Filters
        const yearFiltersActive = filters['3rd Year'] || filters['2nd Year'] || filters['1st Year'];
        const matchesYear = !yearFiltersActive || filters[cadet.year as keyof typeof filters];

        // 3. Status Filters
        const statusFiltersActive = filters['Present'] || filters['Absent'] || filters['OD'];
        let matchesStatus = true;
        if (statusFiltersActive) {
            if (cadet.status === 'Present') matchesStatus = filters['Present'];
            else if (cadet.status === 'Absent') matchesStatus = filters['Absent'];
            else matchesStatus = filters['OD']; // Treat anything else as OD
        }

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
                                <FormControlLabel
                                    control={<Checkbox size='small' checked={filters['OD']} onChange={handleFilterChange} name="OD" color="warning" />}
                                    label={<Typography variant="body2">OD</Typography>}
                                />
                            </FormGroup>
                        </Box>
                    </Stack>

                    {/* Attendance Lists */}
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : (
                        <Box>
                            {/* Present & OD List */}
                            <Typography variant="h6" color="success.main" mb={2}>Present / OD</Typography>
                            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 4 }}>
                                <Table sx={{ minWidth: 650 }} aria-label="present table">
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
                                        {filteredCadets.filter(c => c.status === 'Present' || c.status !== 'Absent').map((cadet) => (
                                            <TableRow key={cadet.id}>
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
                                                        color={cadet.status === 'Present' ? 'success' : 'warning'}
                                                        size="small"
                                                        icon={cadet.status === 'Present' ? <IconCheck size={16} /> : undefined}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredCadets.filter(c => c.status !== 'Absent').length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">No cadets present.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Absent List */}
                            <Typography variant="h6" color="error.main" mb={2}>Absent</Typography>
                            <TableContainer component={Paper} elevation={0} variant="outlined">
                                <Table sx={{ minWidth: 650 }} aria-label="absent table">
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
                                        {filteredCadets.filter(c => c.status === 'Absent').map((cadet) => (
                                            <TableRow key={cadet.id}>
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
                                                        label="Absent"
                                                        color="error"
                                                        size="small"
                                                        icon={<IconX size={16} />}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredCadets.filter(c => c.status === 'Absent').length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">No cadets absent.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Box>
            </DashboardCard>
        </PageContainer>
    );
};

export default EventAttendanceView;
