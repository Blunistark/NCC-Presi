import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Box,
    Typography,
    Chip,
    Button,
    Stack
} from '@mui/material';
import { IconDownload } from '@tabler/icons-react';

interface ODRecord {
    "Sr no": number;
    "Enrollment no": string;
    "Rank": string;
    "Year": string;
    "Dept": string;
    "Name": string;
    "PU Roll nuber": string;
    "Hours": string;
}

interface ODStatsProps {
    eventId: string;
}

const ODStats = ({ eventId }: ODStatsProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [records, setRecords] = useState<ODRecord[]>([]);

    useEffect(() => {
        const fetchODs = async () => {
            if (!eventId) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/event_ods?event_id=${eventId}`);
                if (!res.ok) throw new Error("Failed to fetch OD list");
                const data = await res.json();
                setRecords(data);
            } catch (e: any) {
                setError(e.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchODs();
    }, [eventId]);

    const handleExport = () => {
        if (!records.length) return;

        const headers = ["Sr no", "Enrollment no", "Rank", "Year", "Dept", "Name", "PU Roll nuber", "Hours"];
        const csvRows = [headers.join(",")];

        records.forEach(row => {
            const values = headers.map(header => {
                const val = (row as any)[header] || "";
                const escaped = ("" + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(","));
        });

        const csvData = csvRows.join("\n");
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("hidden", "");
        a.setAttribute("href", url);
        a.setAttribute("download", `OD_List_${eventId}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (loading) return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    if (records.length === 0) {
        return (
            <Box textAlign="center" py={5}>
                <Typography color="textSecondary">No On-Duty records found for this event.</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="flex-end" mb={2}>
                <Button
                    variant="outlined"
                    color="success"
                    startIcon={<IconDownload size={20} />}
                    onClick={handleExport}
                >
                    Export to Excel
                </Button>
            </Stack>
            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell><strong>Sr No</strong></TableCell>
                            <TableCell><strong>Enrollment ID</strong></TableCell>
                            <TableCell><strong>Rank</strong></TableCell>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Details</strong></TableCell>
                            <TableCell><strong>OD Status</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.map((row, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{row["Sr no"]}</TableCell>
                                <TableCell>{row["Enrollment no"]}</TableCell>
                                <TableCell>{row.Rank}</TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        {row.Name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {row["PU Roll nuber"]}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" display="block">
                                        {row.Year} | {row.Dept}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={row["Hours"]}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ODStats;
