export interface Cadet {
    id: string;
    enrollmentId: string;
    regimentalNumber: string;
    rank: string;
    year: string;
    department: string;
    name: string;
    puRollNumber: string;
    sdSw: 'SD' | 'SW';
    mobileNumber: string;
    email: string;
    dob: string;
    bloodGroup: string;
    photo: string;
    rankHolder: boolean;
    attendedParades: number;
    totalParades: number;
}
