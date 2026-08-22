'use client';

import { useState, useEffect } from 'react';
import { DEPT_SHORT } from '@/config/departments';

interface Count {
    id: string;
    department: string;
    section: string;
    student_count: number;
    additional_count: number;
    total: number;
    updated_at: string;
}

function relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '—';
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(iso).toLocaleDateString();
}

export default function CountsTable() {
    const [counts, setCounts] = useState<Count[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState({ student_count: '', additional_count: '' });
    const [saving, setSaving] = useState(false);

    const fetchCounts = async () => {
        try {
            const res = await fetch('/api/counts');
            const data = await res.json();
            if (res.ok) {
                setCounts(data.counts);
            }
        } catch (error) {
            console.error('Failed to fetch counts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleEdit = (count: Count) => {
        setEditingKey(`${count.department}-${count.section}`);
        setEditValue({
            student_count: count.student_count.toString(),
            additional_count: count.additional_count.toString()
        });
    };

    const handleSave = async (department: string, section: string) => {
        setSaving(true);
        try {
            const res = await fetch('/api/counts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    department,
                    section,
                    student_count: parseInt(editValue.student_count) || 0,
                    additional_count: parseInt(editValue.additional_count) || 0
                })
            });

            if (res.ok) {
                await fetchCounts();
                setEditingKey(null);
            }
        } catch (error) {
            console.error('Failed to save count:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingKey(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent, department: string, section: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!saving) handleSave(department, section);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    };

    const totalStudents = counts.reduce((sum, c) => sum + c.student_count, 0);
    const totalAdditional = counts.reduce((sum, c) => sum + c.additional_count, 0);
    const grandTotal = counts.reduce((sum, c) => sum + c.total, 0);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="h-5 w-44 bg-gray-100 rounded animate-pulse" />
                    <div className="hidden sm:flex gap-2">
                        <div className="h-6 w-24 bg-gray-100 rounded-md animate-pulse" />
                        <div className="h-6 w-28 bg-gray-100 rounded-md animate-pulse" />
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 flex items-center gap-4">
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 w-16 bg-gray-100 rounded animate-pulse" />
                                <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-8 bg-gray-100 rounded-md animate-pulse hidden sm:block" />
                            <div className="h-3.5 w-10 bg-gray-100 rounded animate-pulse hidden md:block" />
                            <div className="h-3.5 w-10 bg-gray-100 rounded animate-pulse hidden md:block" />
                            <div className="h-3.5 w-12 bg-gray-100 rounded animate-pulse hidden lg:block" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Student Headcount</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Click any row to edit counts inline</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md px-2.5 py-1.5 tabular-nums">
                        Students <span className="font-semibold text-gray-900">{totalStudents.toLocaleString()}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md px-2.5 py-1.5 tabular-nums">
                        Additional <span className="font-semibold text-gray-900">{totalAdditional.toLocaleString()}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md px-2.5 py-1.5 tabular-nums">
                        Total <span className="font-bold">{grandTotal.toLocaleString()}</span>
                    </span>
                </div>
            </div>

            {counts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-gray-900">No sections reported yet</p>
                    <p className="text-sm text-gray-500 mt-1">Counts will appear here once faculty submit their numbers.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-y border-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Additional</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 pr-6 pl-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {counts.map((count, index) => {
                                const key = `${count.department}-${count.section}`;
                                const isEditing = editingKey === key;
                                const deptShort = (DEPT_SHORT as Record<string, string>)[count.department] || count.department;
                                const startsNewGroup = index === 0 || counts[index - 1].department !== count.department;
                                return (
                                    <tr
                                        key={key}
                                        onClick={() => !isEditing && handleEdit(count)}
                                        className={`${startsNewGroup && index !== 0 ? 'border-t-2 border-gray-100' : ''} ${isEditing ? 'bg-blue-50/60' : 'hover:bg-gray-50 cursor-pointer'} transition-colors duration-150`}
                                    >
                                        <td className="px-6 py-3.5">
                                            <div className="text-sm font-semibold text-gray-900">{deptShort}</div>
                                            <div className="text-xs text-gray-500">{count.department}</div>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className="text-xs font-semibold text-gray-700 bg-gray-100 rounded-md px-2 py-1">{count.section}</span>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={editValue.student_count}
                                                    onChange={(e) => setEditValue({ ...editValue, student_count: e.target.value })}
                                                    onKeyDown={(e) => handleEditKeyDown(e, count.department, count.section)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                    className="w-20 px-2 py-1 text-center text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none tabular-nums"
                                                />
                                            ) : (
                                                <span className="text-sm font-semibold text-gray-900 tabular-nums">{count.student_count}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={editValue.additional_count}
                                                    onChange={(e) => setEditValue({ ...editValue, additional_count: e.target.value })}
                                                    onKeyDown={(e) => handleEditKeyDown(e, count.department, count.section)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-20 px-2 py-1 text-center text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none tabular-nums"
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-600 tabular-nums">{count.additional_count}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className="text-sm font-bold text-blue-600 tabular-nums">{count.total}</span>
                                        </td>
                                        <td className="pr-6 pl-2 py-3.5 text-right">
                                            {isEditing ? (
                                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleSave(count.department, count.section)}
                                                        disabled={saving}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors duration-150"
                                                    >
                                                        {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-md transition-colors duration-150"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 whitespace-nowrap">{relativeTime(count.updated_at)}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50 border-t border-gray-200">
                                <td className="px-6 py-3.5 text-sm font-semibold text-gray-900" colSpan={2}>Grand Total</td>
                                <td className="px-6 py-3.5 text-center text-sm font-semibold text-gray-900 tabular-nums">{totalStudents.toLocaleString()}</td>
                                <td className="px-6 py-3.5 text-center text-sm text-gray-600 tabular-nums">{totalAdditional.toLocaleString()}</td>
                                <td className="px-6 py-3.5 text-center text-sm font-bold text-blue-600 tabular-nums">{grandTotal.toLocaleString()}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
