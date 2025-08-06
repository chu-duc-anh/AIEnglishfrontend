
import React, { useState, useEffect, useMemo } from 'react';
import { getAllUsers } from '../services/authService';
import type { User } from '../types';
import { AlertTriangle, BarChart3, Users as UsersIcon, UserPlus, Calendar, Activity } from 'lucide-react';
import Spinner from './Spinner';

// A reusable Stat Card component for the dashboard
const StatCard = ({ title, value, icon: Icon, iconBg, iconColor }: { title: string; value: number | string; icon: React.FC<any>; iconBg: string; iconColor: string; }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center">
            <div className={`p-3 ${iconBg} rounded-full mr-4 flex-shrink-0`}>
                <Icon className={`h-7 w-7 ${iconColor}`} />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
};

// A simple, reusable bar chart component
const SimpleBarChart = ({ data, title, barColorClass = 'bg-indigo-500' }: { data: { label: string; value: number }[], title: string, barColorClass?: string }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 0), [data]);

    if (data.length === 0) {
        return <div className="text-center text-gray-500 dark:text-gray-400 py-8">No data available for this chart.</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
            <div className="space-y-4">
                {data.map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate pr-2 sm:col-span-1">{label}</div>
                        <div className="flex items-center sm:col-span-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                                <div
                                    className={`${barColorClass} h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold`}
                                    style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`, minWidth: '2rem' }}
                                >
                                    {value > 0 ? value : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// A dedicated component for the daily registrations line chart
const DailyRegistrationsChart = ({ data, title }: { data: { label: string; value: number }[]; title: string }) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 600;
    const height = 300;

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    if (data.length === 0) {
        return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">No data available for this chart.</div>
             </div>
        );
    }
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const getX = (i: number) => (i / (data.length - 1)) * xMax;
    const getY = (value: number) => yMax - (value / maxValue) * yMax;

    const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.value)}`).join(' ');
    const areaPath = `${linePath} L${getX(data.length - 1)},${yMax} L${getX(0)},${yMax} Z`;

    const yAxisTicks = [0, 0.25, 0.5, 0.75, 1].map(tick => Math.round(tick * maxValue)).filter((value, index, self) => self.indexOf(value) === index);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
            <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[600px] text-gray-500 dark:text-gray-400 font-sans">
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" className="text-indigo-500/30" stopColor="currentColor" />
                            <stop offset="100%" className="text-indigo-500/0" stopColor="currentColor" />
                        </linearGradient>
                    </defs>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {/* Y-axis grid lines and labels */}
                        {yAxisTicks.map(tick => (
                            <g key={tick} transform={`translate(0, ${getY(tick)})`}>
                                <line x1="0" y1="0" x2={xMax} y2="0" stroke="currentColor" strokeDasharray="2,2" className="text-gray-200 dark:text-gray-700" />
                                <text x="-10" y="5" textAnchor="end" className="text-xs fill-current">{tick}</text>
                            </g>
                        ))}
                        {/* X-axis labels */}
                        {data.map((d, i) => (
                            i % Math.ceil(data.length / 12) === 0 && (
                                <text key={i} x={getX(i)} y={yMax + 20} textAnchor="middle" className="text-xs fill-current">{d.label}</text>
                            )
                        ))}
                        <text x={xMax / 2} y={yMax + 35} textAnchor="middle" className="text-xs font-semibold fill-current">Last 30 Days</text>
                        {/* Data Visualization */}
                        <path d={areaPath} fill="url(#areaGradient)" />
                        <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500" strokeLinecap="round" strokeLinejoin="round" />
                        {data.map((d, i) => (
                            <circle key={i} cx={getX(i)} cy={getY(d.value)} r="3" fill="currentColor" className="text-indigo-500" />
                        ))}
                    </g>
                </svg>
            </div>
        </div>
    );
};


const StatisticsDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const fetchedUsers = await getAllUsers();
                setUsers(fetchedUsers);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch user data.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const calculateAge = (dobString: string) => {
        const birthDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const statistics = useMemo(() => {
        if (users.length === 0) {
            return {
                ageDistribution: [], last12MonthsRegistrations: [], dailyData: [],
                totalUsers: 0, totalAdmins: 0, usersToday: 0,
                usersThisMonth: 0, usersLastMonth: 0, usersThisYear: 0
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Date range calculations
        const startOfToday = new Date(today);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const filterByDate = (date: string, start: Date, end?: Date) => {
            const d = new Date(date);
            return end ? d >= start && d <= end : d >= start;
        };
        
        // Count calculations
        const usersToday = users.filter(u => u.createdAt && filterByDate(u.createdAt, startOfToday)).length;
        const usersThisMonth = users.filter(u => u.createdAt && filterByDate(u.createdAt, startOfMonth)).length;
        const usersLastMonth = users.filter(u => u.createdAt && filterByDate(u.createdAt, startOfLastMonth, endOfLastMonth)).length;
        const usersThisYear = users.filter(u => u.createdAt && filterByDate(u.createdAt, startOfYear)).length;
        
        // Age Distribution
        const ageGroups: { [key: string]: number } = { '<18': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
        users.forEach(user => {
            const age = calculateAge(user.dob);
            if (age < 18) ageGroups['<18']++; else if (age <= 25) ageGroups['18-25']++; else if (age <= 35) ageGroups['26-35']++; else if (age <= 45) ageGroups['36-45']++; else if (age <= 55) ageGroups['46-55']++; else ageGroups['56+']++;
        });
        const ageDistribution = Object.entries(ageGroups).map(([label, value]) => ({ label, value }));

        // Last 12 months registrations
        const monthLabels: string[] = [];
        const monthData: { [key: string]: { label: string, value: number }} = {};

        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthLabels.push(key);
            monthData[key] = { label, value: 0 };
        }
        
        users.forEach(user => {
            if(user.createdAt){
                const regDate = new Date(user.createdAt);
                const key = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, '0')}`;
                if (monthData[key]) {
                    monthData[key].value++;
                }
            }
        });
        
        const last12MonthsRegistrations = monthLabels.map(key => monthData[key]);


        // Daily Registrations for last 30 days
        const dailyRegistrations = Array.from({ length: 30 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return { date: d, count: 0 };
        }).reverse();
        users.forEach(user => {
            if (user.createdAt) {
                const registrationDate = new Date(user.createdAt);
                const diffTime = today.getTime() - registrationDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 30) {
                    const index = 29 - diffDays;
                    if (dailyRegistrations[index]) dailyRegistrations[index].count++;
                }
            }
        });
        const dailyData = dailyRegistrations.map(d => ({ label: `${d.date.getMonth() + 1}/${d.date.getDate()}`, value: d.count }));

        return { ageDistribution, last12MonthsRegistrations, dailyData, totalUsers: users.length, totalAdmins: users.filter(u => u.isAdmin).length, usersToday, usersThisMonth, usersLastMonth, usersThisYear };
    }, [users]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading statistics...</span>
            </div>
        );
    }

    if (error) {
        return (
             <div className="flex items-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
                <AlertTriangle className="h-6 w-6 mr-3" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Users" value={statistics.totalUsers} icon={UsersIcon} iconBg="bg-indigo-100 dark:bg-indigo-900/40" iconColor="text-indigo-600 dark:text-indigo-400" />
                <StatCard title="Total Admins" value={statistics.totalAdmins} icon={BarChart3} iconBg="bg-green-100 dark:bg-green-900/40" iconColor="text-green-600 dark:text-green-400" />
                <StatCard title="Signups Today" value={statistics.usersToday} icon={UserPlus} iconBg="bg-teal-100 dark:bg-teal-900/40" iconColor="text-teal-600 dark:text-teal-400" />
                <StatCard title="Signups This Month" value={statistics.usersThisMonth} icon={Calendar} iconBg="bg-blue-100 dark:bg-blue-900/40" iconColor="text-blue-600 dark:text-blue-400" />
                <StatCard title="Signups Last Month" value={statistics.usersLastMonth} icon={Calendar} iconBg="bg-sky-100 dark:bg-sky-900/40" iconColor="text-sky-600 dark:text-sky-400" />
                <StatCard title="Signups This Year" value={statistics.usersThisYear} icon={Activity} iconBg="bg-orange-100 dark:bg-orange-900/40" iconColor="text-orange-600 dark:text-orange-400" />
            </div>

            <DailyRegistrationsChart data={statistics.dailyData} title="Daily Registrations (Last 30 Days)" />

            <SimpleBarChart 
                title="Registrations (Last 12 Months)" 
                data={statistics.last12MonthsRegistrations}
                barColorClass="bg-blue-500"
            />
            <SimpleBarChart 
                title="User Age Distribution" 
                data={statistics.ageDistribution}
                barColorClass="bg-green-500"
            />
        </div>
    );
};

export default StatisticsDashboard;
