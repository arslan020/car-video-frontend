import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import UKPhoneInput from '../components/UKPhoneInput';
import {
    FaCar, FaCopy, FaCheck, FaExternalLinkAlt, FaPaperPlane, FaSearch,
    FaEllipsisV, FaVideo, FaVideoSlash, FaTrash
} from 'react-icons/fa';
import API_URL from '../config';

const AdminStock = () => {
    const [stock, setStock] = useState([]);
    const [videos, setVideos] = useState([]);
    const [vehicleMetadata, setVehicleMetadata] = useState({});
    const [loading, setLoading] = useState(false);

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [activeMenu, setActiveMenu] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const [copiedId, setCopiedId] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Send Modal States
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [customerTitle, setCustomerTitle] = useState('Mr');
    const [customerName, setCustomerName] = useState('');
    const [sendEmail, setSendEmail] = useState('');
    const [sendMobile, setSendMobile] = useState('');
    const [sending, setSending] = useState(false);

    const handleCloseSendModal = () => {
        setSendModalOpen(false);
        setCustomerTitle('Mr');
        setCustomerName('');
        setSendEmail('');
        setSendMobile('');
    };

    // Reserve Link Modal States
    const [reserveLinkModalOpen, setReserveLinkModalOpen] = useState(false);
    const [reserveLink, setReserveLink] = useState('');
    const [savingReserveLink, setSavingReserveLink] = useState(false);

    const { user } = useContext(AuthContext);
    const [syncStatus, setSyncStatus] = useState({ type: '', message: '' });
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const fetchStock = useCallback(async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/autotrader/stock`, config);
            setStock(data.results || []);
            setLastSyncTime(data.lastSyncTime);

            if (data.syncStatus === 'success') {
                setSyncStatus({
                    type: 'success',
                    message: `Last synced: ${new Date(data.lastSyncTime).toLocaleString()} (${data.totalVehicles} vehicles)`
                });
            } else if (data.syncStatus === 'in_progress') {
                setSyncStatus({ type: 'info', message: 'Stock sync in progress...' });
            }
        } catch (error) {
            console.error('Failed to fetch stock', error);
            setSyncStatus({ type: 'error', message: 'Failed to load stock data.' });
            setStock([]);
        } finally {
            setLoading(false);
        }
    }, [user.token]);

    const fetchVideos = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/videos`, config);
            setVideos(data);
        } catch (error) {
            console.error('Failed to fetch videos', error);
        }
    }, [user.token]);

    const fetchVehicleMetadata = useCallback(async (registration) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/vehicle-metadata/${registration}`, config);
            return data;
        } catch (error) {
            console.error('Failed to fetch vehicle metadata', error);
            return { registration, reserveLink: '' };
        }
    }, [user.token]);

    useEffect(() => {
        fetchStock();
        fetchVideos();
    }, [fetchStock, fetchVideos]);

    // Helper to find matching videos
    const getMatchingVideos = (stockItem) => {
        const matches = videos.filter(video => {
            const stockReg = (stockItem.vehicle.registration || '').replace(/\s/g, '').toUpperCase();

            // Safety check: if stock car has no registration, it shouldn't match anything
            if (!stockReg) {
                return false;
            }

            // 1. Try exact registration match (if video has registration field)
            if (video.registration) {
                const videoReg = (video.registration || '').replace(/\s/g, '').toUpperCase();
                const isMatch = videoReg === stockReg;
                return isMatch;
            }

            // 2. Fallback to title match (but stricter)
            const title = (video.title || '').toUpperCase().replace(/\s/g, '');
            const isMatch = title.includes(stockReg);

            return isMatch;
        });

        return matches;
    };

    // Filter Logic
    const filteredStock = stock.filter(item => {
        const matchesSearch =
            (item.vehicle.make?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.vehicle.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.vehicle.registration?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchingVideos = getMatchingVideos(item);
        const hasVideo = matchingVideos.length > 0;

        const matchesFilter =
            filterStatus === 'All' ||
            (filterStatus === 'With Video' && hasVideo) ||
            (filterStatus === 'No Video' && !hasVideo);

        return matchesSearch && matchesFilter;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredStock.length / ITEMS_PER_PAGE);
    const paginatedStock = filteredStock.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const startEntry = filteredStock.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endEntry = Math.min(currentPage * ITEMS_PER_PAGE, filteredStock.length);

    const copyToClipboard = (videoId) => {
        const video = videos.find(v => v._id === videoId);
        // If Admin, use 'Eesa Nasim', otherwise Sender Name, fallback to uploader
        const refName = user.role === 'admin' ? 'Eesa Nasim' : (user.name || user.username || video?.uploadedBy?.name || video?.uploadedBy?.username);
        const link = `${window.location.origin}/view/${videoId}?ref=${encodeURIComponent(refName)}`;
        navigator.clipboard.writeText(link);
        setCopiedId(videoId);
        setTimeout(() => setCopiedId(null), 2000);
        setActiveMenu(null);
    };

    const handleActionClick = (e, itemId) => {
        e.stopPropagation();
        if (activeMenu === itemId) {
            setActiveMenu(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 5,
                right: window.innerWidth - rect.right
            });
            setActiveMenu(itemId);
        }
    };

    const handleSaveReserveLink = async () => {
        if (!selectedVideo) return;
        setSavingReserveLink(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const registration = selectedVideo.registration || selectedVideo.vehicle?.registration;

            await axios.patch(
                `${API_URL}/api/vehicle-metadata/${registration}/reserve-link`,
                { reserveLink: reserveLink },
                config
            );

            alert('Reserve link saved successfully!');
            setReserveLinkModalOpen(false);
            setReserveLink('');
            setSelectedVideo(null);

            // Update local metadata cache
            setVehicleMetadata(prev => ({
                ...prev,
                [registration]: { registration, reserveLink }
            }));
        } catch (error) {
            alert('Failed to save reserve link.');
        } finally {
            setSavingReserveLink(false);
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${API_URL}/api/videos/${videoId}`, config);

            // Update local state
            setVideos(videos.filter(v => v._id !== videoId));

            // If the deleted video was selected, clear selection
            if (selectedVideo?._id === videoId) {
                setSelectedVideo(null);
            }

            alert('Video deleted successfully');
            setActiveMenu(null);
        } catch (error) {
            console.error('Delete video error:', error);
            alert(error.response?.data?.message || 'Failed to delete video');
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full px-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Stock Status</h1>
                        <p className="text-gray-500 mt-1">Manage your vehicle inventory and video status.</p>
                        {lastSyncTime && (
                            <p className="text-xs text-gray-400 mt-1">
                                Last sync: {new Date(lastSyncTime).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* Toolbar */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                            {['All', 'With Video', 'No Video'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filterStatus === status
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 sm:max-w-xs">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search vehicles..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto lg:overflow-visible">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 bg-gray-50">Vehicle</th>
                                        <th className="px-6 py-4 bg-gray-50">Details</th>
                                        <th className="px-6 py-4 bg-gray-50">Reserve Link</th>
                                        <th className="px-6 py-4 bg-gray-50">Status</th>
                                        <th className="px-6 py-4 text-right bg-gray-50">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedStock.length > 0 ? (
                                        paginatedStock.map((item, index) => {
                                            const uniqueId = `${item.id}-${index}`;
                                            const matchingVideos = getMatchingVideos(item);
                                            const videoExists = matchingVideos.length > 0;

                                            // Image handling
                                            const imageUrl = item.media?.images?.[0]?.href || item.media?.images?.[0]?.url;

                                            return (
                                                <tr key={uniqueId} className={`transition relative ${videoExists
                                                    ? 'bg-emerald-50 hover:bg-emerald-100'
                                                    : 'hover:bg-gray-50'
                                                    }`}>
                                                    {/* Vehicle Image & Name */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                                                {imageUrl ? (
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={item.vehicle.make}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                                                            e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" class="text-gray-400 text-xl"><path d="M480 160H32c-17.67 0-32 14.33-32 32v224c0 17.67 14.33 32 32 32h448c17.67 0 32-14.33 32-32V192c0-17.67-14.33-32-32-32zM80 329.83c-13.62 0-24.6-11.23-24.6-24.91 0-13.69 10.98-24.91 24.6-24.91 13.61 0 24.59 11.23 24.59 24.91 0 13.69-10.98 24.91-24.59 24.91zm160 0c-13.62 0-24.6-11.23-24.6-24.91 0-13.69 10.98-24.91 24.6-24.91 13.61 0 24.59 11.23 24.59 24.91 0 13.69-10.98 24.91-24.59 24.91zm160 0c-13.62 0-24.6-11.23-24.6-24.91 0-13.69 10.98-24.91 24.6-24.91 13.61 0 24.59 11.23 24.59 24.91 0 13.69-10.98 24.91-24.59 24.91zM576 224h-64v-16c0-35.35-28.65-64-64-64h-32V80c0-26.51-21.49-48-48-48H16C7.16 32 0 39.16 0 48v64h128v64h320v48h64c35.35 0 64 28.65 64 64v128c0 35.35-28.65 64-64 64h-64V224z"></path></svg>';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                                                                        <FaCar size={20} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-800 text-sm">
                                                                    {item.vehicle.make} {item.vehicle.model}
                                                                </h3>
                                                                <p className="text-xs text-blue-600 font-mono font-medium">{item.vehicle.registration}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Details */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <p className="text-sm text-gray-600">{item.vehicle.derivative}</p>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200">
                                                                    {(item.vehicle.mileage || item.vehicle.odometerReadingMiles)?.toLocaleString()} miles
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Reserve Link */}
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={async () => {
                                                                const registration = item.vehicle.registration;
                                                                let metadata = vehicleMetadata[registration];

                                                                if (!metadata) {
                                                                    metadata = await fetchVehicleMetadata(registration);
                                                                    setVehicleMetadata(prev => ({ ...prev, [registration]: metadata }));
                                                                }

                                                                setSelectedVideo({ ...item, registration });
                                                                setReserveLink(metadata.reserveLink || '');
                                                                setReserveLinkModalOpen(true);
                                                            }}
                                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${vehicleMetadata[item.vehicle.registration]?.reserveLink
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            🔒 {vehicleMetadata[item.vehicle.registration]?.reserveLink ? 'Edit Link' : 'Add Link'}
                                                        </button>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-6 py-4">
                                                        {videoExists ? (
                                                            <div className="space-y-1">
                                                                <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    {matchingVideos.length} Video{matchingVideos.length > 1 ? 's' : ''}
                                                                </span>
                                                                {matchingVideos[0]?.uploadedBy && (
                                                                    <p className="text-xs text-gray-500">
                                                                        by {matchingVideos[0].uploadedBy.name || matchingVideos[0].uploadedBy.username}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-400">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                                No Video
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="relative inline-block">
                                                            {videoExists ? (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => handleActionClick(e, uniqueId)}
                                                                        className={`p-2 rounded-full transition ${activeMenu === uniqueId ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                                    >
                                                                        <FaEllipsisV />
                                                                    </button>

                                                                    {/* Dropdown Menu */}
                                                                    {activeMenu === uniqueId && (
                                                                        <>
                                                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                                                                            <div
                                                                                className="absolute w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 p-1 animate-fade-in origin-top-right"
                                                                                style={{ top: '100%', right: 0, marginTop: '5px' }}
                                                                            >
                                                                                {matchingVideos.map((vid, idx) => (
                                                                                    <div key={vid._id}>
                                                                                        {matchingVideos.length > 1 && (
                                                                                            <div className="px-4 py-1.5 text-xs font-bold text-gray-400 bg-gray-50 uppercase tracking-wider">
                                                                                                Video {idx + 1}
                                                                                            </div>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={() => copyToClipboard(vid._id)}
                                                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2 transition"
                                                                                        >
                                                                                            {copiedId === vid._id ? <FaCheck size={14} className="text-green-500" /> : <FaCopy size={14} className="text-gray-400" />}
                                                                                            {copiedId === vid._id ? 'Copied!' : 'Copy Link'}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                window.open(`/view/${vid._id}`, '_blank');
                                                                                                setActiveMenu(null);
                                                                                            }}
                                                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2 transition"
                                                                                        >
                                                                                            <FaExternalLinkAlt size={14} className="text-gray-400" /> Open Video
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setSelectedVideo(vid);
                                                                                                setSendModalOpen(true);
                                                                                                setActiveMenu(null);
                                                                                            }}
                                                                                            className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md flex items-center gap-2 transition"
                                                                                        >
                                                                                            <FaPaperPlane size={14} className="text-purple-500/70" /> Send to Customer
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleDeleteVideo(vid._id)}
                                                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 transition"
                                                                                        >
                                                                                            <FaTrash size={14} className="text-red-500/70" /> Delete Video
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-300 text-sm select-none">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                No stock found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <p>Showing <span className="font-medium text-gray-800">{startEntry}-{endEntry}</span> of <span className="font-medium text-gray-800">{filteredStock.length}</span> entries</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >Previous</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 border rounded font-medium ${currentPage === page
                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >{page}</button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Link Modal */}
            {sendModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">Send Video Link</h3>
                            <button onClick={() => handleCloseSendModal()} className="text-gray-400 hover:text-gray-600 transition">
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <select
                                        value={customerTitle}
                                        onChange={(e) => setCustomerTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Mr">Mr</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Ms">Ms</option>
                                        <option value="Dr">Dr</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="John Smith"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={sendEmail}
                                    onChange={(e) => setSendEmail(e.target.value)}
                                    placeholder="customer@example.com"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                <UKPhoneInput
                                    value={sendMobile}
                                    onChange={setSendMobile}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleCloseSendModal()}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!customerName || (!sendEmail && !sendMobile)) return;
                                        setSending(true);
                                        try {
                                            // If Admin, use 'Eesa Nasim', otherwise Sender Name, fallback to uploader
                                            const refName = user.role === 'admin' ? 'Eesa Nasim' : (user.name || user.username || selectedVideo?.uploadedBy?.name || selectedVideo?.uploadedBy?.username);
                                            const videoLink = `${window.location.origin}/view/${selectedVideo._id}?ref=${encodeURIComponent(refName)}`;
                                            const config = { headers: { Authorization: `Bearer ${user.token}` } };
                                            await axios.post(`${API_URL}/api/send-link`, {
                                                email: sendEmail,
                                                mobile: sendMobile,
                                                videoLink,
                                                vehicleDetails: selectedVideo.vehicleDetails,
                                                customerName,
                                                customerTitle
                                            }, config);
                                            alert('Video link sent successfully!');
                                            handleCloseSendModal();
                                        } catch (error) {
                                            alert('Failed to send link.');
                                        } finally {
                                            setSending(false);
                                        }
                                    }}
                                    disabled={sending || (!sendEmail && !sendMobile)}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition shadow-lg shadow-purple-200 disabled:opacity-50"
                                >
                                    {sending ? 'Sending...' : 'Send Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reserve Link Modal */}
            {reserveLinkModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                🔒 {selectedVideo?.reserveCarLink ? 'Edit' : 'Add'} Reserve Car Link
                            </h3>
                            <button onClick={() => setReserveLinkModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                    {selectedVideo?.vehicle?.make} {selectedVideo?.vehicle?.model} - {selectedVideo?.registration}
                                </p>
                            </div>

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

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setReserveLinkModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveReserveLink}
                                    disabled={savingReserveLink}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-50"
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

export default AdminStock;
