import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaUserTie, FaCar, FaVideo, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        staffCount: 0,
        stockCount: 0,
        videoCount: 0
    });
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const staffRes = await axios.get('http://localhost:5000/api/auth/staff', config);

            let stockCount = 0;
            try {
                const stockRes = await axios.get('http://localhost:5000/api/autotrader/stock', config);
                stockCount = stockRes.data.results?.length || 0;
            } catch (e) {
                stockCount = 0;
            }

            const videoRes = await axios.get('http://localhost:5000/api/videos', config);

            setStats({
                staffCount: staffRes.data.length,
                stockCount: stockCount,
                videoCount: videoRes.data.length
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const statCards = [
        {
            title: 'Staff',
            desc: 'Create & manage staff accounts',
            count: stats.staffCount,
            icon: FaUserTie,
            bgClass: 'bg-purple-100',
            textClass: 'text-purple-600',
            path: '/admin/staff'
        },
        {
            title: 'Stock',
            desc: 'Manage vehicle inventory',
            count: stats.stockCount,
            icon: FaCar,
            bgClass: 'bg-green-100',
            textClass: 'text-green-600',
            path: '/admin/stock'
        },
        {
            title: 'Videos',
            desc: 'View uploaded video presentations',
            count: stats.videoCount,
            icon: FaVideo,
            bgClass: 'bg-blue-100',
            textClass: 'text-blue-600',
            path: '/staff/videos'
        }
    ];

    return (
        <DashboardLayout>
            <div className="w-full px-6 space-y-8 animate-fadeIn">

                {/* Weekly Activity Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Weekly Activity</h2>
                        <span className="text-sm text-gray-400">Activity Overview</span>
                    </div>

                    {/* Activity Chart Visualization */}
                    <div className="h-64 w-full bg-gray-50 rounded-lg relative overflow-hidden flex items-end justify-between px-0 pb-0">
                        {/* Simple CSS/SVG Chart */}
                        <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.2 }} />
                                    <stop offset="100%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                            <path d="M0,200 L0,50 Q250,200 500,80 T1000,100 L1000,200 Z" fill="url(#chartGrad)" />
                            <path d="M0,50 Q250,200 500,80 T1000,100" fill="none" stroke="#3b82f6" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                        </svg>

                        {/* X Axis Labels Placeholder */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-between px-8 text-xs text-gray-400 font-medium">
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                            <span>Sun</span>
                        </div>
                    </div>
                </div>

                {/* Go To Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Go To</h3>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {statCards.map((card, idx) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => navigate(card.path)}
                                        className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between h-48"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`${card.bgClass} p-3 rounded-lg`}>
                                                <Icon className={`${card.textClass}`} size={24} />
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <FaArrowRight className="text-gray-300 group-hover:text-blue-500" />
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg">{card.title}</h4>
                                            <p className="text-sm text-gray-400 mt-1 mb-3">{card.desc}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 text-sm font-medium">Total:</span>
                                                <span className="text-2xl font-bold text-gray-900">{card.count}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
