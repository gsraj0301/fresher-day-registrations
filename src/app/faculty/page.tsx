'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FacultyCounts from '@/components/FacultyCounts';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string | null;
    section: string | null;
}

export default function FacultyPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) {
                router.push('/');
                return;
            }
            const data = await res.json();
            setUser(data.user);
        } catch {
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Faculty Dashboard</h1>
                                <p className="text-xs text-gray-500">Fresher&apos;s Day Counter</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{user.name}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome, {user.name}!</h2>
                    <p className="text-gray-600 mt-1">Update your section&apos;s student count below.</p>
                </div>

                {/* Counts Form */}
                {user.department && user.section ? (
                    <FacultyCounts user={{ department: user.department, section: user.section }} />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Section Assigned</h3>
                        <p className="text-gray-500">Contact admin to assign a department and section.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
