import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaPlay, FaCalendar, FaRoad, FaCar, FaExclamationTriangle } from 'react-icons/fa';
import API_URL from '../config';

const WatchVideo = () => {
    const { token } = useParams();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/magic-links/${token}`);
                setVideo(data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 410 || err.response?.status === 404) {
                    setError('This link has expired or is invalid.');
                } else {
                    setError('An error occurred while loading the video.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="spinner mb-4 border-4 border-blue-600 border-t-transparent w-12 h-12 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 font-medium">Loading video...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaExclamationTriangle className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Expired</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <p className="text-sm text-gray-400">Please contact the dealership for a new link.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-800 line-clamp-1">
                            {video.title || 'Vehicle Video'}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FaCalendar className="text-blue-500" />
                            <span>
                                {new Date(video.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Video Player */}
                    <div className="aspect-video bg-black">
                        {video.videoSource === 'youtube' ? (
                            <iframe
                                src={`${video.videoUrl}?autoplay=0&rel=0`}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={video.title}
                            ></iframe>
                        ) : (
                            <video
                                src={video.videoUrl}
                                controls
                                className="w-full h-full"
                                controlsList="nodownload"
                                preload="metadata"
                                poster={video.thumbnailUrl} // If you have thumbnails
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {video.title || video.originalName}
                                </h2>
                                {(video.make || video.model) && (
                                    <p className="text-lg text-gray-600 mb-4 flex items-center gap-2">
                                        <FaCar className="text-gray-400" />
                                        {video.make} {video.model} {video.registration ? `(${video.registration})` : ''}
                                    </p>
                                )}

                                {video.mileage && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700 mb-4">
                                        <FaRoad className="text-gray-500" />
                                        {video.mileage.toLocaleString()} miles
                                    </div>
                                )}

                                {/* Fallback details from metadata if available */}
                                {video.vehicleDetails && (
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                                        {Object.entries(video.vehicleDetails).map(([key, value]) => (
                                            value && typeof value !== 'object' && (
                                                <div key={key} className="flex flex-col">
                                                    <span className="text-xs uppercase text-gray-400 font-bold">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <span className="font-medium text-gray-800">{value}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Call to Action */}
                            <div className="w-full md:w-auto flex flex-col gap-3">
                                {video.reserveCarLink && (
                                    <a
                                        href={video.reserveCarLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-center"
                                    >
                                        Reserve This Car
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Heston Automotive. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default WatchVideo;
