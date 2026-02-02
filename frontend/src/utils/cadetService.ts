import { Cadet } from './mockCadets';

export const fetchCadets = async (): Promise<Cadet[]> => {
    try {
        const response = await fetch('/api/cadets');
        if (!response.ok) throw new Error('Failed to fetch cadets');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching cadets:', error);
        return [];
    }
};

export const fetchCadetById = async (id: number): Promise<Cadet | null> => {
    try {
        const cadets = await fetchCadets();
        return cadets.find(c => c.id === id) || null;
    } catch (error) {
        console.error('Error fetching cadet by ID:', error);
        return null;
    }
};
