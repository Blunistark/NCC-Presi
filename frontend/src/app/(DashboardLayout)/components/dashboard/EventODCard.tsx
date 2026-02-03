import React from 'react';
import { Card, CardContent, Typography, Stack, Box, Chip } from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';

interface EventODCardProps {
    event: {
        "Event ID": string;
        "Title": string;
        "Date": string;
        "Type": string;
    };
    onClick: () => void;
}

const EventODCard = ({ event, onClick }: EventODCardProps) => {
    return (
        <Card
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                },
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.main',
                        }}
                    >
                        <IconCalendarEvent size={20} />
                    </Box>
                    <Chip
                        label={event.Type || 'Event'}
                        size="small"
                        color={event.Type === 'Mandatory Parade' ? 'error' : 'secondary'}
                        variant="outlined"
                    />
                </Stack>

                <Typography variant="h5" fontWeight={600} gutterBottom noWrap>
                    {event.Title || 'Untitled Event'}
                </Typography>

                <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                        {event.Date}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                        {event["Event ID"]}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default EventODCard;
