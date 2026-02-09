import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/business-logo.png';
import API_URL from '../config';

const VideoView = () => {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Helper to format registration (simple spacing)
    const formattedReg = (reg) => {
        if (!reg) return '';
        return reg.toUpperCase(); // You can add logic to insert space if needed, e.g., 'AB12 CDE'
    };

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/videos/${id}`);
                setVideo(data);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-blue-800 font-semibold">Loading car video...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="text-red-600 text-lg font-semibold mb-2">Video Unavailable</div>
                <p className="text-gray-500">The link may have expired or is invalid.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
            {/* Branded Header */}
            <header className="bg-white shadow-sm py-4 px-6 flex justify-center sticky top-0 z-30">
                <img src={Logo} alt="Heston Automotive" className="h-10 md:h-12 object-contain" />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center p-4 md:p-8">
                <div className="w-full max-w-7xl">

                    {/* Header Text */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Vehicle Presentation</h1>
                        <p className="text-gray-500">Watch the detailed video walkthrough of your vehicle below.</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* LEFT COLUMN: Video Player & Title */}
                        {/* If details exist, use 65% width, otherwise full width (centered) */}
                        <div className={`w-full ${video.vehicleDetails ? 'lg:w-[65%]' : 'lg:w-full'} space-y-6`}>
                            <div className="bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-200">
                                <div className="relative pt-[56.25%]">
                                    <video
                                        className="absolute top-0 left-0 w-full h-full"
                                        controls
                                        autoPlay
                                        playsInline
                                        src={video.videoUrl}
                                        poster={video.thumbnailUrl}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>

                            {/* Title & Meta Card - Moved Below Video */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                        {video.title || video.originalName || 'Car Video'}
                                    </h2>
                                </div>

                                <div className="flex items-center flex-wrap gap-2 mb-4">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                                        Official Video
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        • {new Date(video.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden p-2">
                                        <img src={Logo} alt="Heston Automotive" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Provided By</p>
                                        <p className="text-sm font-bold text-gray-800">Heston Automotive</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Info & Specs */}
                        <div className="w-full lg:w-[35%] space-y-6">

                            {/* Technical Specs Section */}
                            {video.vehicleDetails && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeIn">
                                    <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center justify-between">
                                        Vehicle Specs
                                        <span className="text-[10px] font-normal text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">Verified by AutoTrader</span>
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex flex-col items-start gap-1 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Registration</p>

                                            {/* UK Number Plate Style */}
                                            <div className="flex bg-[#FFD100] rounded-md overflow-hidden border border-yellow-500 shadow-sm h-10 select-none">
                                                {/* Blue Strip */}
                                                <div className="bg-[#003399] w-7 flex flex-col justify-center items-center pb-0.5 gap-0.5">
                                                    {/* Union Jack SVG */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-4 h-3 overflow-visible">
                                                        <clipPath id="t">
                                                            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                                                        </clipPath>
                                                        <path d="M0,0 v30 h60 v-30 z" fill="#00247d" />
                                                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                                                        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#cf142b" strokeWidth="4" />
                                                        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                                                        <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6" />
                                                    </svg>
                                                    <span className="text-[8px] font-bold text-white leading-none mt-[1px]">UK</span>
                                                </div>
                                                {/* Registration Text */}
                                                <div className="px-3 flex items-center justify-center bg-[#FFD100]">
                                                    <p className="font-mono font-bold text-gray-900 text-lg tracking-wider uppercase">
                                                        {formattedReg(video.vehicleDetails.registration)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Make</p>
                                                <p className="font-medium text-gray-900 text-sm">{video.vehicleDetails.make}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Model</p>
                                                <p className="font-medium text-gray-900 text-sm truncate" title={video.vehicleDetails.model}>{video.vehicleDetails.model}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Fuel</p>
                                                <p className="font-medium text-gray-900 text-sm">{video.vehicleDetails.fuelType || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Trans</p>
                                                <p className="font-medium text-gray-900 text-sm">{video.vehicleDetails.transmissionType || '-'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Engine</p>
                                                <p className="font-medium text-gray-900 text-sm">{video.vehicleDetails.engineSize ? `${video.vehicleDetails.engineSize} cc` : '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">BHP</p>
                                                <p className="font-medium text-gray-900 text-sm">{video.vehicleDetails.bhp ? `${video.vehicleDetails.bhp}` : '-'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Variant</p>
                                            <p className="font-medium text-gray-900 text-sm">{video.vehicleDetails.derivative || '-'}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Colour</p>
                                            <p className="font-medium text-gray-900 text-sm">{video.vehicleDetails.colour || '-'}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Date First Reg</p>
                                            <p className="font-medium text-gray-900 text-sm">
                                                {video.vehicleDetails.firstRegistrationDate
                                                    ? new Date(video.vehicleDetails.firstRegistrationDate).toLocaleDateString()
                                                    : '-'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Mileage</p>
                                            <p className="font-medium text-gray-900 text-sm">
                                                {(video.vehicleDetails.mileage || video.vehicleDetails.odometerReadingMiles)
                                                    ? `${(video.vehicleDetails.mileage || video.vehicleDetails.odometerReadingMiles).toLocaleString()} miles`
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="py-6 text-center text-gray-400 text-sm border-t border-gray-200 mt-auto">
                <p>© {new Date().getFullYear()} Heston Automotive. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default VideoView;
