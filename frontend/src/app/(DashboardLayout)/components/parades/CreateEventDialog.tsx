'use client';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Stack,
    FormControl,
    InputLabel,
    Select,
    Typography,
    Box,
    FormControlLabel,
    Checkbox,
    Radio,
    RadioGroup,
    Chip,
    Autocomplete,
} from '@mui/material';
import { fetchCadets } from '@/utils/cadetService';
import { Cadet } from '@/types';


type EventType = 'Mandatory Parade' | 'Social Drive' | 'College Event' | 'Camp' | '';
type CampType = 'Mandatory' | 'Special' | '';

interface CreateEventDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CreateEventDialog = ({ open, onClose, onSuccess }: CreateEventDialogProps) => {
    const [eventType, setEventType] = useState<EventType>('');
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);

    // Target Selection State
    const [years, setYears] = useState({
        first: false,
        second: false,
        third: false,
    });
    const [targetMode, setTargetMode] = useState<'year' | 'individual'>('year');
    const [selectedCadets, setSelectedCadets] = useState<any[]>([]);
    const [allCadets, setAllCadets] = useState<Cadet[]>([]);

    useEffect(() => {
        const loadCadets = async () => {
            try {
                const data = await fetchCadets();
                setAllCadets(data);
            } catch (error) {
                console.error("Failed to load cadets list");
            }
        };
        loadCadets();
    }, []);


    // Camp Specific State
    const [campType, setCampType] = useState<CampType>('Mandatory');

    const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setYears({ ...years, [event.target.name]: event.target.checked });
    };

    const handleCreate = async () => {
        setLoading(true);
        const eventData = {
            title: eventType === 'Mandatory Parade' ? `Parade - ${date}` : title,
            type: eventType,
            date,
            time,
        };

        try {
            const response = await fetch('/api/create_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Event created:', result);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                console.error('Failed to create event');
                alert('Failed to create event');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Error connecting to backend');
        } finally {
            setLoading(false);
        }
    };

    const renderCommonFields = () => (
        <Stack direction="row" spacing={2} mb={2}>
            <TextField
                label="Date"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
            />
            <TextField
                label="Time"
                type="time"
                fullWidth
                value={time}
                onChange={(e) => setTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
            />
        </Stack>
    );

    const renderYearSelection = () => (
        <Box mb={2}>
            <Typography variant="subtitle2" mb={1}>Select Years:</Typography>
            <Stack direction="row" spacing={1}>
                <FormControlLabel control={<Checkbox checked={years.first} onChange={handleYearChange} name="first" />} label="1st Year" />
                <FormControlLabel control={<Checkbox checked={years.second} onChange={handleYearChange} name="second" />} label="2nd Year" />
                <FormControlLabel control={<Checkbox checked={years.third} onChange={handleYearChange} name="third" />} label="3rd Year" />
                <FormControlLabel
                    control={<Checkbox
                        checked={years.first && years.second && years.third}
                        onChange={(e) => setYears({ first: e.target.checked, second: e.target.checked, third: e.target.checked })}
                    />}
                    label="All"
                />
            </Stack>
        </Box>
    );

    const renderIndividualSelection = () => (
        <Box mb={2}>
            <Autocomplete
                multiple
                options={allCadets}
                getOptionLabel={(option) => `${option.rank} ${option.name} (${option.regimentalNumber})`}
                value={selectedCadets}
                onChange={(event, newValue) => {
                    setSelectedCadets(newValue);
                }}
                renderTags={(value: readonly any[], getTagProps) =>
                    value.map((option: any, index: number) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                            <Chip
                                variant="outlined"
                                label={option.name}
                                size="small"
                                key={key}
                                {...tagProps}
                            />
                        );
                    })
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Select Cadets"
                        placeholder="Search by name or number"
                    />
                )}
            />
        </Box>
    );

    const renderMandatoryParadeForm = () => (
        <>
            {renderCommonFields()}
            {renderYearSelection()}
        </>
    );

    const renderEventForm = () => (
        <>
            <TextField
                label="Event Name"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
            />
            {renderCommonFields()}

            <FormControl component="fieldset" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" mb={1}>Target Group:</Typography>
                <RadioGroup row value={targetMode} onChange={(e) => setTargetMode(e.target.value as 'year' | 'individual')}>
                    <FormControlLabel value="year" control={<Radio />} label="By Year" />
                    <FormControlLabel value="individual" control={<Radio />} label="Select Cadets" />
                </RadioGroup>
            </FormControl>

            {targetMode === 'year' ? renderYearSelection() : renderIndividualSelection()}
        </>
    );

    const renderCampForm = () => (
        <>
            <TextField
                label="Camp Name"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
            />
            {renderCommonFields()}

            <FormControl component="fieldset" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" mb={1}>Camp Type:</Typography>
                <RadioGroup row value={campType} onChange={(e) => setCampType(e.target.value as CampType)}>
                    <FormControlLabel value="Mandatory" control={<Radio />} label="Mandatory (All)" />
                    <FormControlLabel value="Special" control={<Radio />} label="Special (Selection)" />
                </RadioGroup>
            </FormControl>

            {campType === 'Mandatory' ? (
                <Typography variant="body2" color="textSecondary">
                    *Mandatory camps apply to ALL eligible cadets.
                </Typography>
            ) : (
                renderIndividualSelection()
            )}
        </>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create New Event</DialogTitle>
            <DialogContent dividers>
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="event-type-label">Select Event Type</InputLabel>
                    <Select
                        labelId="event-type-label"
                        value={eventType}
                        label="Select Event Type"
                        onChange={(e) => {
                            setEventType(e.target.value as EventType);
                            // Reset conditional states when type changes
                            setTargetMode('year');
                            setCampType('Mandatory');
                        }}
                    >
                        <MenuItem value="Mandatory Parade">Mandatory Parade</MenuItem>
                        <MenuItem value="Social Drive">Social Drive</MenuItem>
                        <MenuItem value="College Event">College Event</MenuItem>
                        <MenuItem value="Camp">Camp</MenuItem>
                    </Select>
                </FormControl>

                {eventType === 'Mandatory Parade' && renderMandatoryParadeForm()}
                {(eventType === 'Social Drive' || eventType === 'College Event') && renderEventForm()}
                {eventType === 'Camp' && renderCampForm()}

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="error">Cancel</Button>
                <Button onClick={handleCreate} variant="contained" disabled={!eventType || loading}>
                    {loading ? 'Creating...' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateEventDialog;
