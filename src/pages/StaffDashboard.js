import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaCloudUploadAlt, FaVideo, FaLink, FaCopy, FaCar, FaEye, FaClock, FaChartLine, FaTimes, FaPlay, FaPaperPlane, FaExternalLinkAlt } from 'react-icons/fa';
import API_URL from '../config';

const StaffDashboard = () => {
    const [file, setFile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [stock, setStock] = useState([]);
    const [loadingStock, setLoadingStock] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { user } = useContext(AuthContext);

    // Reserve Link Modal
    const [reserveLinkModalOpen, setReserveLinkModalOpen] = useState(false);
    const [reserveLinkVideo, setReserveLinkVideo] = useState(null);
    const [reserveLink, setReserveLink] = useState('');
    const [savingReserveLink, setSavingReserveLink] = useState(false);
    const [vehicleMetadata, setVehicleMetadata] = useState({});

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
            setStock(data.results || []);
        } catch (error) {
            console.error('Failed to fetch stock', error);
            setStock([]);
        } finally {
            setLoadingStock(false);
        }
    }, [user.token]);

    const fetchAllVehicleMetadata = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/vehicle-metadata`);
            const map = {};
            data.forEach(item => {
                if (item.registration) {
                    map[item.registration.replace(/\s/g, '').toUpperCase()] = item;
                }
            });
            setVehicleMetadata(map);
        } catch (error) {
            console.error('Failed to fetch vehicle metadata', error);
        }
    }, []);

    useEffect(() => {
        fetchVideos();
        fetchStock();
        fetchAllVehicleMetadata();
    }, [fetchVideos, fetchStock, fetchAllVehicleMetadata]);

    const handleSelectStock = (car) => {
        setSelectedCar(car);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const copyLink = async (id) => {
        let shareId = '';
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.patch(`${API_URL}/api/videos/${id}/share`, {}, config);
            shareId = data.shareId;
        } catch (error) {
            console.error('Failed to register share link:', error);
        }
        let link = `${window.location.origin}/view/${id}`;
        if (shareId) link += `?s=${shareId}`;
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };

    const openReserveLinkModal = async (video) => {
        const normReg = (video.registration || '').replace(/\s/g, '').toUpperCase();
        let metadata = vehicleMetadata[normReg];
        if (!metadata && normReg) {
            try {
                const { data } = await axios.get(`${API_URL}/api/vehicle-metadata/${normReg}`);
                metadata = data;
                setVehicleMetadata(prev => ({ ...prev, [normReg]: data }));
            } catch {
                metadata = { registration: normReg, reserveLink: '' };
            }
        }
        setReserveLinkVideo(video);
        setReserveLink(metadata?.reserveLink || '');
        setReserveLinkModalOpen(true);
    };

    const handleSaveReserveLink = async () => {
        if (!reserveLinkVideo) return;
        const normReg = (reserveLinkVideo.registration || '').replace(/\s/g, '').toUpperCase();
        if (!normReg) {
            alert('This video has no registration number — cannot set a reserve link.');
            return;
        }
        setSavingReserveLink(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.patch(
                `${API_URL}/api/vehicle-metadata/${normReg}/reserve-link`,
                { reserveLink },
                config
            );
            alert('Reserve link saved successfully!');
            setVehicleMetadata(prev => ({ ...prev, [normReg]: { ...prev[normReg], reserveLink } }));
            setReserveLinkModalOpen(false);
            setReserveLinkVideo(null);
            setReserveLink('');
        } catch (error) {
            alert('Failed to save reserve link.');
        } finally {
            setSavingReserveLink(false);
        }
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

                {/* My Videos Section */}
                {videos.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">My Videos</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Showing last 5 uploaded videos</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-5 py-3">Video</th>
                                            <th className="px-5 py-3">Registration</th>
                                            <th className="px-5 py-3">Views</th>
                                            <th className="px-5 py-3">Reserve Link</th>
                                            <th className="px-5 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {videos.slice(0, 5).map((video) => {
                                            const normReg = (video.registration || '').replace(/\s/g, '').toUpperCase();
                                            const hasReserveLink = !!(vehicleMetadata[normReg]?.reserveLink);
                                            return (
                                                <tr key={video._id} className="hover:bg-gray-50 transition-colors">
                                                    {/* Thumbnail + Title */}
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-16 h-11 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                                                                {video.thumbnailUrl || video.cloudflareVideoId || video.youtubeVideoId ? (
                                                                    <img
                                                                        src={video.thumbnailUrl ||
                                                                            (video.videoSource === 'cloudflare'
                                                                                ? `https://videodelivery.net/${video.cloudflareVideoId}/thumbnails/thumbnail.jpg?time=1s&height=90`
                                                                                : `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`)}
                                                                        alt={video.title}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/120x80?text=Video'; }}
                                                                    />
                                                                ) : (
                                                                    <FaVideo className="text-gray-600" size={16} />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-800 text-sm truncate max-w-[180px]">
                                                                    {video.title || video.originalName || 'Untitled Video'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Registration */}
                                                    <td className="px-5 py-3">
                                                        <span className="text-xs font-mono font-medium text-blue-600">
                                                            {video.registration || '—'}
                                                        </span>
                                                    </td>

                                                    {/* Views */}
                                                    <td className="px-5 py-3">
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                                            <FaEye size={10} />
                                                            {video.viewCount || 0}
                                                        </div>
                                                    </td>

                                                    {/* Reserve Link Button */}
                                                    <td className="px-5 py-3">
                                                        <button
                                                            onClick={() => openReserveLinkModal(video)}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                                                hasReserveLink
                                                                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                                                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            🔒 {hasReserveLink ? 'Edit Link' : 'Add Link'}
                                                        </button>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => copyLink(video._id)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Copy Link"
                                                            >
                                                                <FaCopy size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => window.open(`${window.location.origin}/view/${video._id}`, '_blank')}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Open Video"
                                                            >
                                                                <FaExternalLinkAlt size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reserve Link Modal */}
            {reserveLinkModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                🔒 {vehicleMetadata[(reserveLinkVideo?.registration || '').replace(/\s/g, '').toUpperCase()]?.reserveLink ? 'Edit' : 'Add'} Reserve Car Link
                            </h3>
                            <button
                                onClick={() => { setReserveLinkModalOpen(false); setReserveLinkVideo(null); setReserveLink(''); }}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video</label>
                                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                    {reserveLinkVideo?.title || reserveLinkVideo?.originalName || 'Untitled'}
                                    {reserveLinkVideo?.registration && (
                                        <span className="ml-2 text-xs font-mono text-blue-600">({reserveLinkVideo.registration})</span>
                                    )}
                                </p>
                            </div>

                            {!reserveLinkVideo?.registration && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs text-amber-700">⚠️ This video has no registration number. Reserve link requires a registration to be linked to the vehicle.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Car Link URL</label>
                                <input
                                    type="url"
                                    value={reserveLink}
                                    onChange={(e) => setReserveLink(e.target.value)}
                                    placeholder="https://example.com/reserve"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    When customers click "Reserve Car", they'll be redirected to this URL.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setReserveLinkModalOpen(false); setReserveLinkVideo(null); setReserveLink(''); }}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveReserveLink}
                                    disabled={savingReserveLink || !reserveLinkVideo?.registration}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingReserveLink ? 'Saving...' : 'Save Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StaffDashboard;
