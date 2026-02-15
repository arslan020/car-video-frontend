import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaCloudUploadAlt, FaVideo, FaLink, FaCopy, FaCar, FaEye, FaClock, FaChartLine } from 'react-icons/fa';
import API_URL from '../config';

const StaffDashboard = () => {
    const [file, setFile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [stock, setStock] = useState([]); // AutoTrader Stock
    const [loadingStock, setLoadingStock] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { user } = useContext(AuthContext);


    const fetchVideos = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/videos`, config);
            setVideos(data);
        } catch (error) {
            console.error(error);
        }
    }, [user.token]);

    const fetchStock = useCallback(async () => {
        setLoadingStock(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/autotrader/stock`, config);
            // API returns { results: [...] } directly
            setStock(data.results || []);
        } catch (error) {
            console.error('Failed to fetch stock', error);
            setStock([]);
        } finally {
            setLoadingStock(false);
        }
    }, [user.token]);

    useEffect(() => {
        fetchVideos();
        fetchStock();
    }, [fetchVideos, fetchStock]);


    const handleSelectStock = (car) => {
        setSelectedCar(car);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);

        // Use selected car info for title if available
        if (selectedCar) {
            const title = `${selectedCar.vehicle.make} ${selectedCar.vehicle.model} - ${selectedCar.vehicle.registration || ''}`;
            formData.append('title', title);
        }

        setUploading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.post(`${API_URL}/api/videos`, formData, config);
            setFile(null);
            setSelectedCar(null); // Reset selection
            fetchVideos();
            alert('Video uploaded successfully for ' + (selectedCar ? selectedCar.vehicle.make : 'vehicle'));
        } catch (error) {
            console.error(error);
            alert('Video upload failed');
        } finally {
            setUploading(false);
        }
    };

    const copyLink = (id) => {
        const link = `${window.location.origin}/view/${id}`;
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };

    return (
        <DashboardLayout>
            <div className="w-full px-6">
                <header className="mb-6 md:mb-8 border-b pb-4 border-gray-200 animate-fadeIn">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Staff Dashboard</h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1">Upload and manage car videos.</p>
                </header>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Videos Card */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <FaVideo size={24} />
                            </div>
                            <FaChartLine className="text-white opacity-50" size={20} />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">{videos.length}</h3>
                        <p className="text-blue-100 text-sm font-medium">Total Videos</p>
                    </div>

                    {/* Total Views Card */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <FaEye size={24} />
                            </div>
                            <FaChartLine className="text-white opacity-50" size={20} />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">
                            {videos.reduce((sum, video) => sum + (video.viewCount || 0), 0)}
                        </h3>
                        <p className="text-purple-100 text-sm font-medium">Total Views</p>
                    </div>

                    {/* Recent Uploads Card */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <FaClock size={24} />
                            </div>
                            <FaChartLine className="text-white opacity-50" size={20} />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">
                            {videos.filter(v => {
                                const uploadDate = new Date(v.createdAt);
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                return uploadDate >= weekAgo;
                            }).length}
                        </h3>
                        <p className="text-green-100 text-sm font-medium">Last 7 Days</p>
                    </div>

                    {/* Stock Count Card */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <FaCar size={24} />
                            </div>
                            <FaChartLine className="text-white opacity-50" size={20} />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">{stock.length}</h3>
                        <p className="text-orange-100 text-sm font-medium">Cars in Stock</p>
                    </div>
                </div>

            </div>

        </DashboardLayout >
    );
};

export default StaffDashboard;
