'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Grid,
    Box,
    Typography,
    Stack,
    TextField,
    FormGroup,
    FormControlLabel,
    Checkbox,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import { IconSearch } from '@tabler/icons-react';
import BlankCard from '@/app/(DashboardLayout)/components/shared/BlankCard';
import { Cadet } from '@/types';
import { fetchCadets } from '@/utils/cadetService';

const RANKS_HIERARCHY = ['SUO', 'JUO', 'CSM', 'CQMS', 'CPL', 'LCPL'];

const CadetsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        '3rd Year': false,
        '2nd Year': false,
        '1st Year': false,
        'Rankholders': false,
    });
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchCadets();
                setCadets(data);
            } catch (err) {
                setError('Failed to load cadets from Google Sheets');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            [event.target.name]: event.target.checked,
        });
    };

    const isRankHolder = (rank: string) => {
        return RANKS_HIERARCHY.includes(rank);
    };

    const filteredCadets = cadets.filter((cadet) => {
        // 1. Search Filter
        const matchesSearch = cadet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cadet.regimentalNumber.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Checkbox Filters
        const yearFiltersActive = filters['3rd Year'] || filters['2nd Year'] || filters['1st Year'];
        const matchesYear = !yearFiltersActive || filters[cadet.year as keyof typeof filters];
        const matchesRank = !filters['Rankholders'] || isRankHolder(cadet.rank);

        return matchesSearch && matchesYear && matchesRank;
    });

    return (
        <PageContainer title="Cadets" description="Manage and View Cadets">
            <Box>
                {/* Filters and Search Bar - Flexbox Layout */}
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
                            placeholder="Search by Name or Regimental No..."
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

                {loading ? (
                    <Box textAlign="center" py={5}>
                        <CircularProgress />
                        <Typography mt={2}>Loading Cadets from Google Sheet...</Typography>
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    /* Cadet Cards Grid */
                    <Grid container spacing={3}>
                        {filteredCadets.map((cadet) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={cadet.id}>
                                {/* Make Card Clickable */}
                                <Box component={Link} href={`/cadets/${cadet.id}`} sx={{ textDecoration: 'none' }}>
                                    <BlankCard>
                                        <Box sx={{ position: 'relative', height: '350px', overflow: 'hidden', cursor: 'pointer' }}>

                                            {/* Rank Badge (Top Left) - Only if not CDT */}
                                            {cadet.rank !== 'CDT' && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 15,
                                                        left: 0,
                                                        backgroundColor: '#FFAD33', // Gold/Orange for Ranks
                                                        color: 'white',
                                                        padding: '4px 12px',
                                                        borderTopRightRadius: '20px',
                                                        borderBottomRightRadius: '20px',
                                                        zIndex: 2,
                                                        fontWeight: 'bold',
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    {cadet.rank}
                                                </Box>
                                            )}

                                            {/* Year Badge (Top Right) */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 15,
                                                    right: 0,
                                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                                    color: 'white',
                                                    padding: '4px 12px',
                                                    borderTopLeftRadius: '20px',
                                                    borderBottomLeftRadius: '20px',
                                                    zIndex: 2,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.75rem',
                                                }}
                                            >
                                                {cadet.year}
                                            </Box>

                                            {/* Photo */}
                                            <Box
                                                component="img"
                                                src={cadet.photo}
                                                alt={cadet.name}
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'scale(1.05)',
                                                    },
                                                }}
                                            />

                                            {/* Gradient Overlay & Text Content (Bottom) */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0) 100%)',
                                                    padding: '24px 16px 1px 16px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'flex-end',
                                                    minHeight: '120px',
                                                }}
                                            >
                                                <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: '#2A3547', lineHeight: 1.2 }}>
                                                    {cadet.name}
                                                </Typography>
                                                <Typography variant="subtitle2" sx={{ color: '#5A6A85', mt: 0.5, mb: 2, fontWeight: 600 }}>
                                                    {cadet.regimentalNumber}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </BlankCard>
                                </Box>
                            </Grid>
                        ))}

                        {filteredCadets.length === 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Box textAlign="center" py={5}>
                                    <Typography variant="h6" color="textSecondary">No cadets found matching your criteria.</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                )}
            </Box>
        </PageContainer>
    );
};

export default CadetsPage;
