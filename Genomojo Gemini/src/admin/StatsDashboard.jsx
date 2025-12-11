import React, { useState, useEffect } from 'react';
import { useFirebaseApp, collection, getCollectionPath, onSnapshot, query, orderBy, limit, doc } from '../hooks/useFirebaseApp';

export const StatsDashboard = () => {
    const { db } = useFirebaseApp();
    const [globalCounts, setGlobalCounts] = useState(null);
    const [voteTotals, setVoteTotals] = useState(null);
    const [dailyStats, setDailyStats] = useState([]);
    const [topVoters, setTopVoters] = useState([]);
    const [topContributors, setTopContributors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const basePath = getCollectionPath(''); // artifacts/{appId}/public/data

        // 1. Fetch Global Counts
        const globalCountsRef = doc(db, getCollectionPath('stats'), 'global_counts');
        const unsubGlobal = onSnapshot(globalCountsRef, (doc) => {
            setGlobalCounts(doc.data() || {});
        });

        // 2. Fetch Vote Totals
        const voteTotalsRef = doc(db, getCollectionPath('stats'), 'vote_totals');
        const unsubVotes = onSnapshot(voteTotalsRef, (doc) => {
            setVoteTotals(doc.data() || {});
        });

        // 3. Fetch Daily Stats (Last 30 days)
        const dailyRef = collection(db, getCollectionPath('stats_daily'));
        const dailyQ = query(dailyRef, orderBy('date', 'desc'), limit(30));
        const unsubDaily = onSnapshot(dailyQ, (snapshot) => {
            const stats = snapshot.docs.map(d => d.data());
            setDailyStats(stats);
        });

        // 4. Fetch Top Users (Voters)
        const usersRef = collection(db, getCollectionPath('users'));
        const topVotersQ = query(usersRef, orderBy('voteCount', 'desc'), limit(5));
        const unsubTopVoters = onSnapshot(topVotersQ, (snapshot) => {
            setTopVoters(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 5. Fetch Top Users (Contributors)
        const topContribQ = query(usersRef, orderBy('itemCount', 'desc'), limit(5));
        const unsubTopContrib = onSnapshot(topContribQ, (snapshot) => {
            setTopContributors(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => {
            unsubGlobal();
            unsubVotes();
            unsubDaily();
            unsubTopVoters();
            unsubTopContrib();
        };
    }, [db]);

    if (loading) return <div className="p-4 text-center text-gray-500">Loading Stats...</div>;

    const totalUsers = globalCounts?.totalUsers || 0;
    const totalItems = globalCounts?.totalItems || 0;
    const totalVotes = voteTotals?.totalVotes || 0;

    const avgVotesPerUser = totalUsers > 0 ? (totalVotes / totalUsers).toFixed(1) : 0;
    const avgItemsPerUser = totalUsers > 0 ? (totalItems / totalUsers).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={totalUsers} color="bg-blue-50 text-blue-700" />
                <StatCard label="Total Votes" value={totalVotes} color="bg-green-50 text-green-700" />
                <StatCard label="Total Mojo Items" value={totalItems} color="bg-purple-50 text-purple-700" />
                <StatCard label="Avg Votes/User" value={avgVotesPerUser} color="bg-orange-50 text-orange-700" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Activity Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Activity (30 Days)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {dailyStats.map((stat) => (
                                    <tr key={stat.date}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{stat.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.newUsers || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.newVotes || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="text-green-600 font-medium">{stat.newMohis || 0}</span> /
                                            <span className="text-red-500 font-medium"> {stat.newMolos || 0}</span>
                                        </td>
                                    </tr>
                                ))}
                                {dailyStats.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No data yet. Waiting for new activity...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Leaderboards */}
                <div className="space-y-6">
                    <LeaderboardCard title="Top Voters" users={topVoters} metric="voteCount" label="Votes" />
                    <LeaderboardCard title="Top Contributors" users={topContributors} metric="itemCount" label="Items" />
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div className={`p-4 rounded-xl ${color}`}>
        <p className="text-xs font-semibold uppercase opacity-70">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

const LeaderboardCard = ({ title, users, metric, label }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
        <div className="space-y-3">
            {users.map((user, idx) => (
                <div key={user.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                        <span className="w-6 text-gray-400 font-mono">{idx + 1}</span>
                        <span className="text-gray-700 dark:text-gray-300 font-mono text-xs truncate max-w-[150px]" title={user.id}>
                            {user.email || user.id}
                        </span>
                        {user.isAnonymous && <span className="ml-2 px-1 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">Anon</span>}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{user[metric] || 0} {label}</span>
                </div>
            ))}
            {users.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No active users found.</p>}
        </div>
    </div>
);
