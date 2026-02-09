import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaCar, FaCopy, FaCheck, FaExternalLinkAlt, FaPaperPlane, FaSearch } from 'react-icons/fa';
import API_URL from '../config';

const AdminStock = () => {
    const [stock, setStock] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [showLinksFor, setShowLinksFor] = useState(null);
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [customerTitle, setCustomerTitle] = useState('Mr');
    const [customerName, setCustomerName] = useState('');
    const [sendEmail, setSendEmail] = useState('');
    const [sendMobile, setSendMobile] = useState('');
    const [sending, setSending] = useState(false);
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

    useEffect(() => {
        fetchStock();
        fetchVideos();
    }, [fetchStock, fetchVideos]);

    const getMatchingVideos = (stockItem) => {
        return videos.filter(video => {
            const title = video.title || '';
            const reg = stockItem.vehicle.registration || '';
            return title.toUpperCase().includes(reg.toUpperCase());
        });
    };

    const copyToClipboard = (videoId) => {
        const link = `${window.location.origin}/view/${videoId}`;
        navigator.clipboard.writeText(link);
        setCopiedId(videoId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredStock = stock.filter(item => {
        const searchString = searchTerm.toLowerCase();
        const make = item.vehicle.make?.toLowerCase() || '';
        const model = item.vehicle.model?.toLowerCase() || '';
        const reg = item.vehicle.registration?.toLowerCase() || '';
        return make.includes(searchString) || model.includes(searchString) || reg.includes(searchString);
    });

    return (
        <DashboardLayout>
            <div className="w-full px-6 space-y-8">
                <header className="border-b pb-4 border-gray-200">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Car Inventory & Videos</h1>
                        <p className="text-sm md:text-base text-gray-500 mt-1">AutoTrader stock syncs automatically at 6am, 12pm, and 6pm daily.</p>
                        {lastSyncTime && (
                            <p className="text-xs text-gray-400 mt-1">
                                Last sync: {new Date(lastSyncTime).toLocaleString()}
                            </p>
                        )}
                    </div>
                </header>

                {/* Sync Status */}
                {syncStatus.message && (
                    <div className={`p-4 rounded-lg ${syncStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                        syncStatus.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        {syncStatus.message}
                    </div>
                )}

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2 text-primary">
                            <FaCar size={24} />
                            <h2 className="text-xl font-semibold">Stock Status</h2>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search vehicles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                            />
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Image</th>
                                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Vehicle Details</th>
                                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Status</th>
                                        <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStock.length > 0 ? filteredStock.map((item) => {
                                        const matchingVideos = getMatchingVideos(item);
                                        const videoExists = matchingVideos.length > 0;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-b border-gray-100 hover:bg-gray-50 transition"
                                            >
                                                {/* Thumbnail */}
                                                <td className="py-3 px-4">
                                                    <a
                                                        href={`https://www.autotrader.co.uk/car-search?advertising-location=at_cars&make=${encodeURIComponent(item.vehicle.make)}&model=${encodeURIComponent(item.vehicle.model)}&postcode=ub31da&radius=1500&seller-id=10010747&registration=${encodeURIComponent(item.vehicle.registration)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="cursor-pointer block"
                                                    >
                                                        {item.media && item.media.images && item.media.images.length > 0 ? (
                                                            <img
                                                                src={item.media.images[0].href || item.media.images[0].url}
                                                                alt={`${item.vehicle.make} ${item.vehicle.model}`}
                                                                className="w-20 h-20 object-cover rounded hover:opacity-90 transition"
                                                                onError={(e) => {
                                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="30"%3E🚗%3C/text%3E%3C/svg%3E';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 transition">
                                                                <FaCar className="text-gray-400 text-2xl" />
                                                            </div>
                                                        )}
                                                    </a>
                                                </td>

                                                {/* Vehicle Details */}
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <a
                                                            href={`https://www.autotrader.co.uk/car-search?advertising-location=at_cars&make=${encodeURIComponent(item.vehicle.make)}&model=${encodeURIComponent(item.vehicle.model)}&postcode=ub31da&radius=1500&seller-id=10010747&registration=${encodeURIComponent(item.vehicle.registration)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="hover:text-blue-600 transition cursor-pointer"
                                                        >
                                                            <h3 className="font-bold text-gray-800 text-base">
                                                                {item.vehicle.make} {item.vehicle.model}
                                                            </h3>
                                                        </a>
                                                        <p className="text-sm text-gray-600">{item.vehicle.derivative}</p>
                                                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                                            <span className="font-mono font-bold">{item.vehicle.registration}</span>
                                                            {(item.vehicle.mileage || item.vehicle.odometerReadingMiles) && (
                                                                <span>• {(item.vehicle.mileage || item.vehicle.odometerReadingMiles).toLocaleString()} miles</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3 px-4">
                                                    {videoExists ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                                            <FaCheck size={10} />
                                                            {matchingVideos.length} Video{matchingVideos.length > 1 ? 's' : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                                            No Videos
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-end gap-2">
                                                        {videoExists ? (
                                                            matchingVideos.length === 1 ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => copyToClipboard(matchingVideos[0]._id)}
                                                                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition"
                                                                        title="Copy Video Link"
                                                                    >
                                                                        {copiedId === matchingVideos[0]._id ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                                                        {copiedId === matchingVideos[0]._id ? 'Copied' : 'Copy'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => window.open(`/view/${matchingVideos[0]._id}`, '_blank')}
                                                                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                                                                        title="Open Video"
                                                                    >
                                                                        <FaExternalLinkAlt size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedVideo(matchingVideos[0]);
                                                                            setSendModalOpen(true);
                                                                        }}
                                                                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition"
                                                                        title="Send Video Link"
                                                                    >
                                                                        <FaPaperPlane size={12} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={() => setShowLinksFor(showLinksFor === item.id ? null : item.id)}
                                                                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border-2 border-green-600 text-green-700 hover:bg-green-50 transition"
                                                                    >
                                                                        {showLinksFor === item.id ? 'Hide' : 'View All'}
                                                                    </button>
                                                                    {showLinksFor === item.id && (
                                                                        <div className="absolute right-0 mt-1 p-2 bg-white rounded border border-gray-200 shadow-lg space-y-1 z-10 min-w-[200px]">
                                                                            {matchingVideos.map((vid, idx) => (
                                                                                <div key={vid._id} className="flex items-center justify-between gap-2 p-2 border-b last:border-0 border-gray-100">
                                                                                    <div className="text-xs text-gray-600">
                                                                                        <span className="font-bold">V-{idx + 1}</span>
                                                                                    </div>
                                                                                    <div className="flex gap-1">
                                                                                        <button
                                                                                            onClick={() => copyToClipboard(vid._id)}
                                                                                            className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 text-green-600 transition"
                                                                                            title="Copy Link"
                                                                                        >
                                                                                            {copiedId === vid._id ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => window.open(`/view/${vid._id}`, '_blank')}
                                                                                            className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 text-blue-600 transition"
                                                                                            title="Open Video"
                                                                                        >
                                                                                            <FaExternalLinkAlt size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">No actions</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-12 text-gray-500">
                                                No stock found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Send Modal */}
            {sendModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Send Video Link</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter an email address or mobile number to send the video link.
                        </p>

                        <div className="space-y-4">
                            {/* Customer Title and Name */}
                            <div className="grid grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title
                                    </label>
                                    <select
                                        value={customerTitle}
                                        onChange={(e) => setCustomerTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Mr">Mr</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Ms">Ms</option>
                                        <option value="Dr">Dr</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="John Smith"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={sendEmail}
                                    onChange={(e) => setSendEmail(e.target.value)}
                                    placeholder="customer@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    value={sendMobile}
                                    onChange={(e) => setSendMobile(e.target.value)}
                                    placeholder="+44 7700 900000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {!customerName && (
                                <p className="text-xs text-red-600">Please enter customer name</p>
                            )}
                            {!sendEmail && (
                                <p className="text-xs text-red-600">Please enter email address</p>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setSendModalOpen(false);
                                    setCustomerTitle('Mr');
                                    setCustomerName('');
                                    setSendEmail('');
                                    setSendMobile('');
                                    setSelectedVideo(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                                disabled={sending}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if ((!customerName) || (!sendEmail)) return;

                                    setSending(true);
                                    try {
                                        const videoLink = `${window.location.origin}/view/${selectedVideo._id}`;
                                        const config = { headers: { Authorization: `Bearer ${user.token}` } };

                                        await axios.post(`${API_URL}/api/send-link`, {
                                            email: sendEmail || null,
                                            mobile: sendMobile || null,
                                            videoLink,
                                            vehicleDetails: selectedVideo.vehicleDetails,
                                            customerName,
                                            customerTitle
                                        }, config);

                                        alert('Video link sent successfully!');
                                        setSendModalOpen(false);
                                        setCustomerTitle('Mr');
                                        setCustomerName('');
                                        setSendEmail('');
                                        setSendMobile('');
                                        setSelectedVideo(null);
                                    } catch (error) {
                                        console.error('Failed to send link:', error);
                                        alert('Failed to send link. Please try again.');
                                    } finally {
                                        setSending(false);
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                                disabled={sending || (!sendEmail && !sendMobile)}
                            >
                                {sending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AdminStock;
