import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/business-logo.png';
import API_URL from '../config';

const VideoView = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const refName = searchParams.get('ref');
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        visitDate: '',
        visitTime: '',
        notes: ''
    });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // Call Request State
    const [showCallModal, setShowCallModal] = useState(false);
    const [callRequestData, setCallRequestData] = useState({ name: '', phone: '' });
    const [callLoading, setCallLoading] = useState(false);

    // Reserve Link State
    const [reserveLink, setReserveLink] = useState('');

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

                // Fetch reserve link from vehicle metadata
                if (data.reserveCarLink) {
                    setReserveLink(data.reserveCarLink);
                } else if (data.registration) {
                    try {
                        const metadataResponse = await axios.get(`${API_URL}/api/vehicle-metadata/${data.registration}`);
                        setReserveLink(metadataResponse.data.reserveLink || '');
                    } catch (err) {
                        console.log('No metadata found for vehicle');
                    }
                }
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [id]);

    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

    // Update time slots when date changes
    useEffect(() => {
        if (bookingData.visitDate) {
            const date = new Date(bookingData.visitDate);
            const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

            let startHour = 10;
            let endHour = 20; // 8 PM (24-hour format)

            // Saturday: 9 AM - 8 PM
            if (day === 6) {
                startHour = 9;
                endHour = 20;
            }
            // Sunday: 10 AM - 6 PM
            else if (day === 0) {
                startHour = 10;
                endHour = 18;
            }
            // Monday - Friday: 10 AM - 8 PM (Already set as default)

            const slots = [];
            for (let hour = startHour; hour < endHour; hour++) {
                // Determine AM/PM
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour > 12 ? hour - 12 : hour;
                const timeString = `${displayHour === 0 ? 12 : displayHour}:00 ${ampm}`;
                slots.push(timeString);
            }
            setAvailableTimeSlots(slots);

            // Clear selected time if it's no longer valid
            if (bookingData.visitTime && !slots.includes(bookingData.visitTime)) {
                setBookingData(prev => ({ ...prev, visitTime: '' }));
            }
        }
    }, [bookingData.visitDate]);

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setBookingLoading(true);
        setBookingError('');

        try {
            await axios.post(`${API_URL}/api/bookings`, {
                videoId: id,
                ...bookingData
            });
            setBookingSuccess(true);
            setTimeout(() => {
                setShowBookingModal(false);
                setBookingSuccess(false);
                setBookingData({
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    visitDate: '',
                    visitTime: '',
                    notes: ''
                });
            }, 3000);
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Failed to book visit. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setBookingData({
            ...bookingData,
            [e.target.name]: e.target.value
        });
    };

    const handleCallRequest = async (e) => {
        e.preventDefault();
        setCallLoading(true);
        try {
            await axios.post(`${API_URL}/api/contact/request-call`, {
                name: callRequestData.name,
                phone: callRequestData.phone,
                vehicleDetails: video.vehicleDetails,
                videoLink: window.location.href
            });
            alert('Callback request sent successfully! We will contact you shortly.');
            setShowCallModal(false);
            setCallRequestData({ name: '', phone: '' });
        } catch (err) {
            alert('Failed to send request. Please try again.');
        } finally {
            setCallLoading(false);
        }
    };

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
                                    {video.videoSource === 'youtube' ? (
                                        /* YouTube Embedded Player */
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={video.videoUrl}
                                            title={video.title || 'Car Video'}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : video.videoSource === 'cloudflare' ? (
                                        /* Cloudflare Stream Player */
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={video.videoUrl}
                                            title={video.title || 'Car Video'}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        /* Cloudinary Video Player */
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
                                    )}
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
                                        <p className="text-sm font-bold text-gray-800">
                                            {refName ? `${decodeURIComponent(refName)} - Sales Executive` : 'Heston Automotive'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons Section */}
                            <div className="bg-white border border-blue-100 p-6 rounded-xl shadow-sm">
                                <div className="mb-6 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Interested in this vehicle?</h3>
                                    <p className="text-gray-500 text-sm">Choose an option below to proceed with your enquiry</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setShowBookingModal(true)}
                                        className="flex flex-col items-center justify-center gap-2 bg-blue-600 text-white px-4 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        <span className="text-xl">📅</span>
                                        <span>Book Visit</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (reserveLink) {
                                                window.open(reserveLink, '_blank');
                                            } else {
                                                alert('Reserve link not available for this vehicle. Please contact us directly.');
                                            }
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                                    >
                                        <span className="text-xl">🔒</span>
                                        <span>Reserve Car</span>
                                    </button>

                                    <button
                                        onClick={() => setShowCallModal(true)}
                                        className="flex flex-col items-center justify-center gap-2 bg-gray-900 text-white px-4 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                                    >
                                        <span className="text-xl">📞</span>
                                        <span>Request Call</span>
                                    </button>
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
                                                {(video.mileage || video.vehicleDetails?.mileage || video.vehicleDetails?.odometerReadingMiles)
                                                    ? `${(video.mileage || video.vehicleDetails?.mileage || video.vehicleDetails?.odometerReadingMiles).toLocaleString()} miles`
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

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Book Showroom Visit</h2>
                                <button
                                    onClick={() => setShowBookingModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {bookingSuccess ? (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4">✅</div>
                                    <h3 className="text-xl font-bold text-green-600 mb-2">Booking Confirmed!</h3>
                                    <p className="text-gray-600">We've sent you a confirmation email with all the details.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleBookingSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            name="customerName"
                                            value={bookingData.customerName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            name="customerEmail"
                                            value={bookingData.customerEmail}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="customerPhone"
                                            value={bookingData.customerPhone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="+44 7700 900000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Date *</label>
                                        <input
                                            type="date"
                                            name="visitDate"
                                            value={bookingData.visitDate}
                                            onChange={handleInputChange}
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Opening Hours: Mon-Fri 10am-8pm, Sat 9am-8pm, Sun 10am-6pm
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Time *</label>
                                        <select
                                            name="visitTime"
                                            value={bookingData.visitTime}
                                            onChange={handleInputChange}
                                            required
                                            disabled={!bookingData.visitDate}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">{bookingData.visitDate ? 'Select a time' : 'Select a date first'}</option>
                                            {availableTimeSlots.map((time) => (
                                                <option key={time} value={time}>
                                                    {time}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes (Optional)</label>
                                        <textarea
                                            name="notes"
                                            value={bookingData.notes}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Any specific questions or requirements?"
                                        ></textarea>
                                    </div>

                                    {bookingError && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                            {bookingError}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowBookingModal(false)}
                                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={bookingLoading}
                                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Request Call Back Modal */}
            {showCallModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full animate-fade-in">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Request a Call Back</h2>
                                <button
                                    onClick={() => setShowCallModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleCallRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name *</label>
                                    <input
                                        type="text"
                                        value={callRequestData.name}
                                        onChange={(e) => setCallRequestData({ ...callRequestData, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={callRequestData.phone}
                                        onChange={(e) => setCallRequestData({ ...callRequestData, phone: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your number"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={callLoading}
                                        className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        {callLoading ? 'Sending Request...' : 'Request Call Back'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoView;
