'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CountsTable from '@/components/CountsTable';
import { roleHome, isLeadership, ROLE_LABELS, type Role } from '@/config/roles';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string | null;
    section: string | null;
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join('');
}

export default function OverviewPage() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) {
                router.replace('/');
                return;
            }
            const data = await res.json();
            if (!isLeadership(data.user.role)) {
                router.replace(roleHome(data.user.role));
                return;
            }
            setUser(data.user);
        } catch {
            router.replace('/');
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/');
    };

    if (!user) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading...
                </div>
            </div>
        );
    }

    const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role;

    return (
        <div className="min-h-full bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-gray-900 leading-tight">Leadership Overview</h1>
                                <p className="text-xs text-gray-500">Fresher&apos;s Day Registrations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2.5 mr-1">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                                    {initials(user.name)}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{roleLabel}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CountsTable readOnly />
                <p className="mt-6 text-center text-xs text-gray-400">
                    Read-only view — contact the admin for corrections.
                </p>
            </main>
        </div>
    );
}
