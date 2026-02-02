export interface Cadet {
    id: number;
    enrollmentId: string; // "KA2023SDA012917"
    regimentalNumber: string; // Same as Enrollment ID usually? User listing has both "Enrollment ID" and "PU ROLL NUMBER". The sample shows Enrollment ID (KA...) and PU Roll (2023...). In the previous list view we used "regimentalNumber" as the KA... ID. I will map "Enrollment ID" to regimentalNumber for consistency or treat them as valid fields.
    // User Sample: 
    // Enrollment ID: KA2023SDA012917
    // RANK: CPL
    // Year: 3rd
    // DEPT: SOCSE
    // Name: Sai Tharun V
    // PU ROLL NUMBER: 20231CAI0118
    // SD/SW: SD
    // Mobile number: 8867460901
    // Email id: st308762@gmail.com
    // Date of birth: 12-07-2004
    // Blood Group: B+

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
    rankHolder: boolean; // Keep for filtering
    attendedParades: number;
    totalParades: number;
}

export const mockCadets: Cadet[] = [
    {
        id: 1,
        enrollmentId: 'KA2023SDA012917',
        regimentalNumber: 'KA2023SDA012917',
        rank: 'CPL',
        year: '3rd Year',
        department: 'SOCSE',
        name: 'Cdt. Sai Tharun V',
        puRollNumber: '20231CAI0118',
        sdSw: 'SD',
        mobileNumber: '8867460901',
        email: 'st308762@gmail.com',
        dob: '12-07-2004',
        bloodGroup: 'B+',
        photo: '/images/profile/user-1.jpg',
        rankHolder: true,
        attendedParades: 18,
        totalParades: 20,
    },
    {
        id: 2,
        enrollmentId: 'KA23SWA1002',
        regimentalNumber: 'KA23SWA1002',
        rank: 'CDT',
        year: '2nd Year',
        department: 'SOL',
        name: 'Cdt. Priya Sharma',
        puRollNumber: '20231BCL0021',
        sdSw: 'SW',
        mobileNumber: '9876543210',
        email: 'priya.s@gmail.com',
        dob: '05-09-2005',
        bloodGroup: 'O+',
        photo: '/images/profile/user-1.jpg',
        rankHolder: false,
        attendedParades: 15,
        totalParades: 20,
    },
    {
        id: 3,
        enrollmentId: 'KA22SDA1005',
        regimentalNumber: 'KA22SDA1005',
        rank: 'SGT',
        year: '3rd Year',
        department: 'SOE',
        name: 'Sgt. Rahul Singh',
        puRollNumber: '20221CVL0045',
        sdSw: 'SD',
        mobileNumber: '7766554433',
        email: 'rahul.singh@gmail.com',
        dob: '20-01-2004',
        bloodGroup: 'A+',
        photo: '/images/profile/user-1.jpg',
        rankHolder: true,
        attendedParades: 20,
        totalParades: 20,
    },
    {
        id: 4,
        enrollmentId: 'KA24SWA2001',
        regimentalNumber: 'KA24SWA2001',
        rank: 'CDT',
        year: '1st Year',
        department: 'SOM',
        name: 'Cdt. Meera Nair',
        puRollNumber: '20241BBA0101',
        sdSw: 'SW',
        mobileNumber: '9988776655',
        email: 'meera.nair@gmail.com',
        dob: '15-03-2006',
        bloodGroup: 'B-',
        photo: '/images/profile/user-1.jpg',
        rankHolder: false,
        attendedParades: 12,
        totalParades: 15,
    },
    {
        id: 5,
        enrollmentId: 'KA23SDA1050',
        regimentalNumber: 'KA23SDA1050',
        rank: 'CDT',
        year: '2nd Year',
        department: 'SOCSE',
        name: 'Cdt. Vikram Rathore',
        puRollNumber: '20231CSE0299',
        sdSw: 'SD',
        mobileNumber: '8899001122',
        email: 'vikram.r@gmail.com',
        dob: '11-11-2005',
        bloodGroup: 'AB+',
        photo: '/images/profile/user-1.jpg',
        rankHolder: false,
        attendedParades: 19,
        totalParades: 20,
    },
    {
        id: 6,
        enrollmentId: 'KA21SWA1001',
        regimentalNumber: 'KA21SWA1001',
        rank: 'SUO',
        year: '3rd Year',
        department: 'SOD',
        name: 'SUO Anjali Gupta',
        puRollNumber: '20211DES0012',
        sdSw: 'SW',
        mobileNumber: '9123456789',
        email: 'anjali.g@gmail.com',
        dob: '02-02-2003',
        bloodGroup: 'O-',
        photo: '/images/profile/user-1.jpg',
        rankHolder: true,
        attendedParades: 17,
        totalParades: 20,
    }
];
