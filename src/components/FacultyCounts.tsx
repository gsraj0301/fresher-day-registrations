'use client';

import { useState, useEffect } from 'react';
import { DEPT_SHORT } from '@/config/departments';

interface FacultyUser {
    department: string;
    section: string;
}

interface Count {
    id: string;
    department: string;
    section: string;
    student_count: number;
    additional_count: number;
    total: number;
    updated_at: string;
}

interface FacultyCountsProps {
    user: FacultyUser;
}

export default function FacultyCounts({ user }: FacultyCountsProps) {
    const [count, setCount] = useState<Count | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentCount, setStudentCount] = useState('');
    const [additionalCount, setAdditionalCount] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const deptShort = (DEPT_SHORT as Record<string, string>)[user.department] || user.department;

    const fetchCount = async () => {
        try {
            const res = await fetch('/api/counts');
            const data = await res.json();
            if (res.ok) {
                const myCount = data.counts.find(
                    (c: Count) => c.department === user.department && c.section === user.section
                );
                if (myCount) {
                    setCount(myCount);
                    setStudentCount(myCount.student_count.toString());
                    setAdditionalCount(myCount.additional_count.toString());
                } else {
                    setStudentCount('0');
                    setAdditionalCount('0');
                }
            }
        } catch (error) {
            console.error('Failed to fetch count:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        setError('');
        try {
            const res = await fetch('/api/counts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    department: user.department,
                    section: user.section,
                    student_count: parseInt(studentCount) || 0,
                    additional_count: parseInt(additionalCount) || 0
                })
            });

            if (res.ok) {
                const data = await res.json();
                setCount(data.count);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || 'Failed to save. Please try again.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center gap-3 text-gray-500">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading your section...
                </div>
            </div>
        );
    }

    const total = (parseInt(studentCount) || 0) + (parseInt(additionalCount) || 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{deptShort} - Section {user.section}</h2>
                        <p className="text-sm text-gray-600">{user.department}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Current Status */}
                {count && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{count.student_count}</div>
                            <div className="text-xs text-gray-500 mt-1">Students</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{count.additional_count}</div>
                            <div className="text-xs text-gray-500 mt-1">Additional</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{count.total}</div>
                            <div className="text-xs text-gray-500 mt-1">Total</div>
                        </div>
                    </div>
                )}

                {/* Edit Form */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Update Count</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Number of Students</label>
                            <input
                                type="number"
                                value={studentCount}
                                onChange={(e) => setStudentCount(e.target.value)}
                                min="0"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-lg font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Additional Count</label>
                            <input
                                type="number"
                                value={additionalCount}
                                onChange={(e) => setAdditionalCount(e.target.value)}
                                min="0"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-lg font-semibold"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-lg font-bold text-gray-900">
                            Total: <span className="text-blue-600">{total}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {error && (
                                <span className="text-sm text-red-600 font-medium">{error}</span>
                            )}
                            {success && !error && (
                                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Saved!
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save Count'}
                            </button>
                        </div>
                    </div>
                </div>

                {count && (
                    <p className="text-xs text-gray-400 text-right">
                        Last updated: {new Date(count.updated_at).toLocaleString()}
                    </p>
                )}
            </div>
        </div>
    );
}
