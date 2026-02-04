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
    CircularProgress,
    Alert
} from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { IconSearch } from '@tabler/icons-react';

interface AttendanceRecord {
    "Sr No": string | number;
    "Enrollment ID": string;
    "RANK": string;
    "Year": string;
    "Name": string;
    "DEPT": string;
    "PU ROLL NUMBER": string;
    "Mandatory Parade": number | string;
    "Social Drives": number | string;
    "College Events": number | string;
    "Others": number | string;
    "Total": number | string;
}

const AttendancePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        '3rd Year': false,
        '2nd Year': false,
        '1st Year': false,
        'Rankholders': false,
    });

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await fetch('/api/attendance-summary');
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setRecords(data);
            } catch (e) {
                setError('Failed to load attendance records');
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            [event.target.name]: event.target.checked,
        });
    };

    const filteredRecords = records.filter((rec) => {
        // 1. Search Filter
        const nameMatch = String(rec.Name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const regMatch = String(rec["Enrollment ID"] || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = nameMatch || regMatch;

        // 2. Checkbox Filters
        // Normalize Year string from sheet (e.g. "3rd", "3rd Year")
        const recYear = String(rec.Year || '');
        const is3rd = recYear.includes('3rd');
        const is2nd = recYear.includes('2nd');
        const is1st = recYear.includes('1st');

        // Check if any year filter is active
        const anyYearFilter = filters['3rd Year'] || filters['2nd Year'] || filters['1st Year'];

        let matchesYear = true;
        if (anyYearFilter) {
            matchesYear = (filters['3rd Year'] && is3rd) ||
                (filters['2nd Year'] && is2nd) ||
                (filters['1st Year'] && is1st);
        }

        // Rank filter (simple heuristic: if RANK is not CDT)
        const isRankHolder = rec.RANK && rec.RANK !== 'CDT';
        const matchesRank = !filters['Rankholders'] || isRankHolder;

        return matchesSearch && matchesYear && matchesRank;
    });

    return (
        <PageContainer title="Attendance" description="Cadet Attendance Records">
            <DashboardCard title="Attendance Registry">
                <Box>
                    {/* Filters and Search Bar */}
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems="center"
                        mb={4}
                    >
                        {/* Search Bar - Left */}
                        <Box sx={{ width: { xs: '100%', md: '40%' } }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Search by Name or Enrollment ID..."
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

                        {/* Filters - Right */}
                        <Box>
                            <FormGroup row>
                                <FormControlLabel
                                    control={<Checkbox checked={filters['3rd Year']} onChange={handleFilterChange} name="3rd Year" />}
                                    label="3rd Year"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={filters['2nd Year']} onChange={handleFilterChange} name="2nd Year" />}
                                    label="2nd Year"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={filters['1st Year']} onChange={handleFilterChange} name="1st Year" />}
                                    label="1st Year"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={filters['Rankholders']} onChange={handleFilterChange} name="Rankholders" />}
                                    label="Rankholders"
                                />
                            </FormGroup>
                        </Box>
                    </Stack>

                    {/* Attendance Table */}
                    {loading && <CircularProgress />}
                    {error && <Alert severity="error">{error}</Alert>}

                    {!loading && !error && (
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table sx={{ minWidth: 650 }} aria-label="attendance table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Enrollment ID</strong></TableCell>
                                        <TableCell><strong>Rank</strong></TableCell>
                                        <TableCell><strong>Name</strong></TableCell>
                                        <TableCell align="center"><strong>Mandatory</strong></TableCell>
                                        <TableCell align="center"><strong>Social</strong></TableCell>
                                        <TableCell align="center"><strong>College</strong></TableCell>
                                        <TableCell align="center"><strong>Others</strong></TableCell>
                                        <TableCell align="center"><strong>Total</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredRecords.map((row, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {row["Enrollment ID"]}
                                            </TableCell>
                                            <TableCell>{row.RANK}</TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {row.Name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {row.Year} | {row.DEPT}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">{row["Mandatory Parade"]}</TableCell>
                                            <TableCell align="center">{row["Social Drives"]}</TableCell>
                                            <TableCell align="center">{row["College Events"]}</TableCell>
                                            <TableCell align="center">{row["Others"]}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={row.Total}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredRecords.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">
                                                <Box py={3}>
                                                    <Typography color="textSecondary">No records found</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </DashboardCard>
        </PageContainer>
    );
};

export default AttendancePage;
