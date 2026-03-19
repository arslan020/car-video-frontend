import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaVideo, FaCopy, FaTrash, FaEye, FaCalendar, FaUser, FaPlay, FaTimes, FaExternalLinkAlt, FaPaperPlane, FaLink, FaSearch } from 'react-icons/fa';
import UKPhoneInput from '../components/UKPhoneInput';
import API_URL from '../config';

const ITEMS_PER_PAGE = 10;

const MyVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useContext(AuthContext);

    // Send Modal States
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [videoForSend, setVideoForSend] = useState(null);
    const [customerTitle, setCustomerTitle] = useState('Mr');
    const [customerName, setCustomerName] = useState('');
    const [sendEmail, setSendEmail] = useState('');
    const [sendMobile, setSendMobile] = useState('');
    const [sending, setSending] = useState(false);

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
        } finally {
            setLoading(false);
        }
    }, [user]);

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
        fetchAllVehicleMetadata();
    }, [fetchVideos, fetchAllVehicleMetadata]);

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
        if (shareId) {
            link += `?s=${shareId}`;
        }

        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${API_URL}/api/videos/${id}`, config);
            setVideos(videos.filter(v => v._id !== id));
            alert('Video deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            alert(error.response?.data?.message || 'Failed to delete video');
        }
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
            alert('This video has no registration number.');
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
            alert('Reserve link saved!');
            setVehicleMetadata(prev => ({ ...prev, [normReg]: { ...prev[normReg], reserveLink } }));
            setReserveLinkModalOpen(false);
            setReserveLinkVideo(null);
            setReserveLink('');
        } catch {
            alert('Failed to save reserve link.');
        } finally {
            setSavingReserveLink(false);
        }
    };

    const handleCloseSendModal = () => {
        setSendModalOpen(false);
        setVideoForSend(null);
        setCustomerTitle('Mr');
        setCustomerName('');
        setSendEmail('');
        setSendMobile('');
    };

    const handleSendLink = async () => {
        if (!customerName || (!sendEmail && !sendMobile)) return;
        setSending(true);
        try {
            const refName = user.name || user.username || videoForSend?.uploadedBy?.name || videoForSend?.uploadedBy?.username;
            const videoLink = `${window.location.origin}/view/${videoForSend._id}?ref=${encodeURIComponent(refName)}`;
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`${API_URL}/api/send-link`, {
                email: sendEmail,
                mobile: sendMobile,
                videoLink,
                vehicleDetails: videoForSend.vehicleDetails,
                customerName,
                customerTitle
            }, config);
            alert('Video link sent successfully!');
            handleCloseSendModal();
        } catch (error) {
            console.error('Send error:', error);
            alert('Failed to send link.');
        } finally {
            setSending(false);
        }
    };

    // Search & Pagination helpers
    const filteredVideos = videos.filter(video => {
        const searchStr = searchTerm.toLowerCase();
        const title = (video.title || '').toLowerCase();
        const reg = (video.registration || '').toLowerCase();
        const make = (video.make || '').toLowerCase();
        const model = (video.model || '').toLowerCase();
        
        return title.includes(searchStr) || 
               reg.includes(searchStr) || 
               make.includes(searchStr) || 
               model.includes(searchStr);
    });

    // Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
    const paginatedVideos = filteredVideos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <DashboardLayout>
            <div className="w-full px-6">
                <header className="mb-6 md:mb-8 border-b pb-4 border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Uploaded Videos</h1>
                            <p className="text-sm md:text-base text-gray-500 mt-1">Manage and share your car videos.</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative hidden sm:block w-64">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search videos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="bg-blue-100 px-4 py-2 rounded-lg">
                                <p className="text-sm text-gray-600">Total Videos</p>
                                <p className="text-2xl font-bold text-blue-600">{videos.length}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="sm:hidden mb-6">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="spinner"></div>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-16 text-center">
                        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <FaVideo className="text-gray-400" size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No videos uploaded yet</h3>
                        <p className="text-gray-500 mb-6">Upload your first car video to get started!</p>
                        <a
                            href="/staff/upload"
                            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Upload Video
                        </a>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Video</th>
                                        <th className="px-6 py-4">Details</th>
                                        <th className="px-6 py-4">Views</th>
                                        <th className="px-6 py-4">Reserve Link</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedVideos.length > 0 ? (
                                        paginatedVideos.map((video) => (
                                            <tr key={video._id} className="hover:bg-gray-50 transition-colors">
                                                {/* Video Thumbnail & Title */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className="w-20 h-14 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 cursor-pointer group relative flex items-center justify-center"
                                                            onClick={() => setSelectedVideo(video)}
                                                        >
                                                            {video.thumbnailUrl || video.cloudflareVideoId || video.youtubeVideoId ? (
                                                                <img
                                                                    src={video.thumbnailUrl ||
                                                                        (video.videoSource === 'cloudflare'
                                                                            ? `https://videodelivery.net/${video.cloudflareVideoId}/thumbnails/thumbnail.jpg?time=1s&height=120`
                                                                            : `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`)}
                                                                    alt={video.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = 'https://via.placeholder.com/160x90?text=Video';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <FaVideo className="text-gray-600" size={20} />
                                                            )}
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                                                <FaPlay className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={12} />
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-gray-800 text-sm truncate max-w-[200px]">
                                                                {video.title || video.originalName || 'Untitled Video'}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {video.registration || 'No Registration'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Details (Date & User) */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <FaCalendar size={12} className="text-gray-400" />
                                                            <span>
                                                                {new Date(video.createdAt).toLocaleDateString('en-GB', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                        {user?.role === 'admin' && video.uploadedBy && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <FaUser size={10} className="text-gray-400" />
                                                                <span>{video.uploadedBy.name || video.uploadedBy.username}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Views */}
                                                <td className="px-6 py-4">
                                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                                        <FaEye size={12} />
                                                        {video.viewCount || 0}
                                                    </div>
                                                </td>

                                                {/* Reserve Link */}
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => openReserveLinkModal(video)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${vehicleMetadata[(video.registration || '').replace(/\s/g, '').toUpperCase()]?.reserveLink
                                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <FaLink size={12} /> {vehicleMetadata[(video.registration || '').replace(/\s/g, '').toUpperCase()]?.reserveLink ? 'Edit Link' : 'Add Link'}
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setVideoForSend(video);
                                                                setSendModalOpen(true);
                                                            }}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="Send to Customer"
                                                        >
                                                            <FaPaperPlane size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => copyLink(video._id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Copy Link"
                                                        >
                                                            <FaCopy size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => window.open(`${window.location.origin}/view/${video._id}`, '_blank')}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Open Video"
                                                        >
                                                            <FaExternalLinkAlt size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(video._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Video"
                                                        >
                                                            <FaTrash size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium">
                                                No videos found matching "{searchTerm}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Showing{' '}
                                    <span className="font-semibold text-gray-700">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredVideos.length)}
                                    </span>{' '}
                                    of <span className="font-semibold text-gray-700">{filteredVideos.length}</span> videos
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="text-sm text-gray-500 font-medium px-2">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                                            <option value="Miss">Miss</option>
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
                                        onClick={handleSendLink}
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

                {/* Video Preview Modal */}
                {selectedVideo && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
                        <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex items-center justify-between text-white">
                                <div>
                                    <h3 className="font-bold text-lg line-clamp-1">
                                        {selectedVideo.title || selectedVideo.originalName || 'Video Preview'}
                                    </h3>
                                    <p className="text-xs text-gray-400">{selectedVideo.registration || 'No Registration'}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedVideo(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            {/* Video Player */}
                            <div className="bg-black aspect-video flex items-center justify-center">
                                {selectedVideo.videoSource === 'cloudflare' || selectedVideo.videoSource === 'youtube' ? (
                                    <iframe
                                        src={selectedVideo.videoUrl}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={selectedVideo.title}
                                    ></iframe>
                                ) : (
                                    <video
                                        src={selectedVideo.videoUrl}
                                        controls
                                        autoPlay
                                        className="w-full max-h-[70vh]"
                                    />
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 bg-white border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <FaEye className="text-blue-500" />
                                            <span className="font-semibold text-gray-700">{selectedVideo.viewCount || 0}</span> views
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FaCalendar className="text-purple-500" />
                                            <span>
                                                {new Date(selectedVideo.createdAt).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setVideoForSend(selectedVideo);
                                                setSendModalOpen(true);
                                                setSelectedVideo(null);
                                            }}
                                            className="flex-1 sm:flex-initial bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                            <FaPaperPlane size={14} /> Send Link
                                        </button>
                                        <button
                                            onClick={() => { copyLink(selectedVideo._id); setSelectedVideo(null); }}
                                            className="flex-1 sm:flex-initial bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                            <FaCopy size={14} /> Copy Link
                                        </button>
                                    </div>
                                </div>

                                {/* Customer View History */}
                                {selectedVideo.views && selectedVideo.views.length > 0 && (
                                    <div className="mt-5 border-t border-gray-100 pt-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <FaEye className="text-blue-500" size={13} />
                                            Who Viewed This Link
                                        </h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {[...selectedVideo.views].reverse().map((view, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 text-sm border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <FaUser size={12} className="text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">
                                                                {view.viewerName || 'Unknown Customer'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {view.viewerEmail || view.viewerMobile || 'No contact info'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-400 flex-shrink-0 ml-4">
                                                        <p>{new Date(view.viewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        <p>{new Date(view.viewedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reserve Link Modal */}
            {reserveLinkModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
                            <h3 className="text-xl font-bold text-gray-800">
                                🔒 {vehicleMetadata[(reserveLinkVideo?.registration || '').replace(/\s/g, '').toUpperCase()]?.reserveLink ? 'Edit' : 'Add'} Reserve Car Link
                            </h3>
                            <button onClick={() => { setReserveLinkModalOpen(false); setReserveLinkVideo(null); setReserveLink(''); }} className="text-gray-400 hover:text-gray-600 transition">
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video</label>
                                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                    {reserveLinkVideo?.title || 'Untitled'}
                                    {reserveLinkVideo?.registration && <span className="ml-2 text-xs font-mono text-blue-600">({reserveLinkVideo.registration})</span>}
                                </p>
                            </div>
                            {!reserveLinkVideo?.registration && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs text-amber-700">⚠️ This video has no registration number — reserve link requires one.</p>
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
                                <p className="text-xs text-gray-500 mt-1">Customers will be redirected here when they click "Reserve Car".</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setReserveLinkModalOpen(false); setReserveLinkVideo(null); setReserveLink(''); }} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">Cancel</button>
                                <button onClick={handleSaveReserveLink} disabled={savingReserveLink || !reserveLinkVideo?.registration} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed">
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

export default MyVideos;
