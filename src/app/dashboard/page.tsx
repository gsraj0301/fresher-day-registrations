'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CountsTable from '@/components/CountsTable';
import CreateFacultyModal from '@/components/CreateFacultyModal';
import { DEPT_SHORT } from '@/config/departments';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string | null;
    section: string | null;
}

interface FacultyUser {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string | null;
    section: string | null;
    created_at: string;
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join('');
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [faculty, setFaculty] = useState<FacultyUser[]>([]);
    const [facultyLoading, setFacultyLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) {
                router.replace('/');
                return;
            }
            const data = await res.json();
            setUser(data.user);
        } catch {
            router.replace('/');
        }
    };

    const fetchFaculty = async () => {
        setFacultyLoading(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setFaculty(data.users.filter((u: FacultyUser) => u.role === 'faculty'));
            }
        } catch (error) {
            console.error('Failed to fetch faculty:', error);
        } finally {
            setFacultyLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUser();
        fetchFaculty();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/');
    };

    const handleConfirmDelete = async (id: string) => {
        setDeleting(true);
        setDeleteError('');
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
                setDeleteError(data.error || 'Failed to delete faculty');
                return;
            }
            setConfirmingId(null);
            await fetchFaculty();
        } catch {
            setDeleteError('Something went wrong while deleting');
        } finally {
            setDeleting(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42a12.08 12.08 0 01-2.83 7.28A12.06 12.06 0 0112 21a12.06 12.06 0 01-3.33-6.14A12.08 12.08 0 015.84 10.6L12 14z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-gray-900 leading-tight">Admin Dashboard</h1>
                                <p className="text-xs text-gray-500">Fresher&apos;s Day Counter</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2.5 mr-1">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                                    {initials(user.name)}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">Administrator</div>
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
                {/* Overview strip */}
                <section aria-label="Overview" className="bg-white border border-gray-200 rounded-xl mb-8 grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-gray-100 overflow-hidden">
                    <div className="flex items-center gap-4 p-5">
                        <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m4-12h.01M13 9h.01M9 13h.01M13 13h.01M9 17h.01M13 17h.01" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Departments</div>
                            <div className="text-2xl font-semibold text-gray-900 tabular-nums">10</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-5 border-t sm:border-t-0 border-gray-100">
                        <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Sections</div>
                            <div className="text-2xl font-semibold text-gray-900 tabular-nums">14</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-5 border-t sm:border-t-0 border-gray-100">
                        <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4m4 4a4 4 0 11-4-4" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Faculty Accounts</div>
                            <div className="text-2xl font-semibold text-gray-900 tabular-nums">
                                {facultyLoading ? (
                                    <span className="inline-block h-7 w-8 rounded bg-gray-100 animate-pulse align-middle" />
                                ) : (
                                    faculty.length
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Headcount */}
                <CountsTable />

                {/* Faculty list */}
                <section className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Faculty Members</h2>
                        {!facultyLoading && faculty.length > 0 && (
                            <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1 tabular-nums">
                                {faculty.length}
                            </span>
                        )}
                    </div>

                    {deleteError && (
                        <div className="px-6 pt-4">
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {deleteError}
                            </div>
                        </div>
                    )}
                    {facultyLoading ? (
                        <div className="p-6 space-y-4">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3.5 w-40 bg-gray-100 rounded animate-pulse" />
                                        <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
                                    </div>
                                    <div className="hidden md:block h-6 w-20 bg-gray-100 rounded-md animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : faculty.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto w-11 h-11 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900">No faculty accounts yet</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Click <span className="font-medium text-gray-700">Create Faculty</span> to assign a department and section.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {faculty.map((f) => {
                                const isConfirming = confirmingId === f.id;
                                return (
                                    <li
                                        key={f.id}
                                        className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors duration-150 ${isConfirming ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${isConfirming ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {initials(f.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                                                <div className="text-sm text-gray-500 truncate">{f.email}</div>
                                            </div>
                                        </div>
                                        {isConfirming ? (
                                            <div className="flex items-center gap-3 pl-12 sm:pl-0">
                                                <span className="text-sm text-red-700 font-medium">
                                                    Remove this faculty account?
                                                </span>
                                                <button
                                                    onClick={() => handleConfirmDelete(f.id)}
                                                    disabled={deleting}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors duration-150"
                                                >
                                                    {deleting ? 'Deleting…' : 'Delete'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingId(null)}
                                                    disabled={deleting}
                                                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-xs font-medium rounded-md transition-colors duration-150"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3 sm:gap-6 pl-12 sm:pl-0 flex-1 sm:flex-none">
                                                    <div className="min-w-[9rem]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-gray-700 bg-gray-100 rounded-md px-1.5 py-0.5">
                                                                {(DEPT_SHORT as Record<string, string>)[f.department || ''] || f.department}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[14rem]">{f.department}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-medium text-blue-700 bg-blue-50 rounded-md px-2 py-1">
                                                            Section {f.section || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="pl-12 sm:pl-2">
                                                    <button
                                                        onClick={() => {
                                                            setDeleteError('');
                                                            setConfirmingId(f.id);
                                                        }}
                                                        aria-label={`Delete ${f.name}`}
                                                        title="Delete faculty"
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </main>

            {/* Create Faculty Modal */}
            <CreateFacultyModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreated={fetchFaculty}
            />
        </div>
    );
}
