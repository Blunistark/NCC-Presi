'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('userRole');

        if (!role) {
            router.push('/authentication/login');
            return;
        }

        // Simple Role-Based Access Control
        if (pathname.startsWith('/ano') && role !== 'ANO' && role !== 'Colonel') {
            // Redirect invalid role access
            if (role === 'SUO') router.push('/suo');
            else router.push('/authentication/login');
            return;
        }

        if (pathname.startsWith('/suo') && role !== 'SUO') {
            if (role === 'ANO') router.push('/ano');
            else if (role === 'Colonel') router.push('/colonel');
            else router.push('/authentication/login');
            return;
        }

        if (pathname.startsWith('/colonel') && role !== 'Colonel') {
            if (role === 'ANO') router.push('/ano');
            else router.push('/authentication/login');
            return;
        }

        setAuthorized(true);
    }, [pathname, router]);

    if (!authorized) {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
};

export default AuthGuard;
