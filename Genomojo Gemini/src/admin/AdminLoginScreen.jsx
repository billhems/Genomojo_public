import React, { useState, useCallback } from 'react';
import { Button } from '../components/Button';
import { UserCog } from 'lucide-react';
import { useFirebaseApp } from '../hooks/useFirebaseApp';

export const AdminLoginScreen = ({ navigate }) => {
    const { loginAdmin, isAdmin } = useFirebaseApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const success = await loginAdmin(email, password);

        if (success) {
            navigate('admin_dashboard');
        } else {
            setError('Invalid credentials or not authorized as Admin.');
        }
        setIsLoading(false);
    }, [email, password, loginAdmin, navigate]);

    if (isAdmin) {
        navigate('admin_dashboard');
        return null;
    }

    return (
        <div className="p-4 sm:p-8 max-w-sm mx-auto mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-2xl space-y-6">
            <h1 className="text-2xl font-bold text-center text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <UserCog className="mr-2" /> Admin Login
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="admin@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10"
                    color="primary"
                >
                    {isLoading ? 'Authenticating...' : 'Log In'}
                </Button>
            </form>
            <div className="text-center">
                <Button onClick={() => navigate('landing')} color="gray" className="text-xs">
                    Back to Public Site
                </Button>
            </div>
        </div>
    );
};