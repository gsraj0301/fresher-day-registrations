'use client';

import { useState } from 'react';
import { DEPARTMENTS, DEPT_SECTIONS } from '@/config/departments';

interface CreateFacultyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateFacultyModal({ isOpen, onClose, onCreated }: CreateFacultyModalProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [section, setSection] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const availableSections = department ? (DEPT_SECTIONS as Record<string, string[]>)[department] || [] : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, department, section })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create faculty');
                return;
            }

            setEmail('');
            setName('');
            setDepartment('');
            setSection('');
            onCreated();
            onClose();
        } catch {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 animate-overlay-in" onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Create faculty account"
                className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-panel-in"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Create Faculty Account</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                            placeholder="Enter faculty name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                            placeholder="faculty@college.edu"
                        />
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
                        Password is set to the shared faculty password (<span className="font-semibold">freshers@3128</span>). Share it with the faculty after creating the account.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                            value={department}
                            onChange={(e) => {
                                setDepartment(e.target.value);
                                setSection('');
                            }}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                        >
                            <option value="">Select department</option>
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            required
                            disabled={!department}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 disabled:bg-gray-100"
                        >
                            <option value="">Select section</option>
                            {availableSections.map((sec) => (
                                <option key={sec} value={sec}>Section {sec}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Faculty'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
