import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaVideo, FaCopy, FaTrash, FaEye, FaCalendar, FaUser, FaPlay, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';

const MyVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const { user } = useContext(AuthContext);

    const fetchVideos = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/videos', config);
            setVideos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    const copyLink = (id) => {
        const link = `${window.location.origin}/view/${id}`;
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`http://localhost:5000/api/videos/${id}`, config);
            setVideos(videos.filter(v => v._id !== id));
            alert('Video deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            alert(error.response?.data?.message || 'Failed to delete video');
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full px-6">
                <header className="mb-6 md:mb-8 border-b pb-4 border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Uploaded Videos</h1>
                            <p className="text-sm md:text-base text-gray-500 mt-1">Manage and share your car videos.</p>
                        </div>
                        <div className="bg-blue-100 px-4 py-2 rounded-lg">
                            <p className="text-sm text-gray-600">Total Videos</p>
                            <p className="text-2xl font-bold text-blue-600">{videos.length}</p>
                        </div>
                    </div>
                </header>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video) => (
                            <div key={video._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                {/* Video Thumbnail */}
                                <div
                                    className="relative h-48 bg-gray-900 cursor-pointer group"
                                    onClick={() => setSelectedVideo(video)}
                                >
                                    <video
                                        src={video.videoUrl}
                                        className="w-full h-full object-cover"
                                        preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white bg-opacity-0 group-hover:bg-opacity-90 rounded-full flex items-center justify-center transition-all duration-300 transform scale-0 group-hover:scale-100">
                                            <FaPlay className="text-blue-600 ml-1" size={24} />
                                        </div>
                                    </div>
                                    {/* View Count Badge */}
                                    <div className="absolute top-3 right-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                                        <FaEye size={12} />
                                        {video.viewCount || 0}
                                    </div>
                                </div>

                                {/* Video Info */}
                                <div className="p-5">
                                    <h3 className="font-bold text-gray-800 text-base mb-2 line-clamp-2 leading-tight">
                                        {video.title || video.originalName || 'Untitled Video'}
                                    </h3>

                                    {/* Meta Info */}
                                    <div className="space-y-2 mb-4">
                                        {user?.role === 'admin' && video.uploadedBy && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FaUser size={12} className="text-gray-400" />
                                                <span>{video.uploadedBy.username}</span>
                                            </div>
                                        )}
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
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyLink(video._id)}
                                            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center justify-center gap-1.5"
                                        >
                                            <FaCopy size={12} />
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => window.open(`${window.location.origin}/view/${video._id}`, '_blank')}
                                            className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center justify-center gap-1.5"
                                        >
                                            <FaExternalLinkAlt size={12} />
                                            Open
                                        </button>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => handleDelete(video._id)}
                                                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                                                title="Delete Video"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Video Modal */}
                {selectedVideo && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
                        <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg line-clamp-1">
                                    {selectedVideo.title || selectedVideo.originalName || 'Video Preview'}
                                </h3>
                                <button
                                    onClick={() => setSelectedVideo(null)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            {/* Video Player */}
                            <div className="bg-black">
                                <video
                                    src={selectedVideo.videoUrl}
                                    controls
                                    autoPlay
                                    controlsList="nodownload"
                                    className="w-full max-h-[70vh]"
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <FaEye className="text-gray-400" />
                                            <span>{selectedVideo.viewCount || 0} views</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FaCalendar className="text-gray-400" />
                                            <span>
                                                {new Date(selectedVideo.createdAt).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyLink(selectedVideo._id)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                    >
                                        <FaCopy />
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyVideos;
