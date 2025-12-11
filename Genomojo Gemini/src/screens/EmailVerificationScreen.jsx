import React, { useEffect, useState } from 'react';
import { useFirebaseApp } from '../hooks/useFirebaseApp';
import { Button } from '../components/Button';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export const EmailVerificationScreen = ({ navigate }) => {
    const { applyActionCode } = useFirebaseApp();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verifyEmail = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const mode = urlParams.get('mode');
            const actionCode = urlParams.get('oobCode');

            if (mode !== 'verifyEmail' || !actionCode) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                await applyActionCode(actionCode);
                setStatus('success');
                setMessage('Your email has been verified successfully! You can now access all features.');
            } catch (error) {
                console.error("Verification error:", error);
                setStatus('error');
                setMessage(error.message || 'Failed to verify email. The link may have expired or already been used.');
            }
        };

        verifyEmail();
    }, [applyActionCode]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center space-y-6">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader className="animate-spin text-indigo-600 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifying...</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-500 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">{message}</p>
                        <div className="mt-6 w-full">
                            <Button onClick={() => navigate('profile')} color="primary" className="w-full justify-center">
                                Continue to Profile
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="text-red-500 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">{message}</p>
                        <div className="mt-6 w-full">
                            <Button onClick={() => navigate('landing')} color="gray" className="w-full justify-center">
                                Back to Home
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
