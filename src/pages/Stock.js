import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaCar, FaVideo, FaCopy, FaCheck, FaCheckCircle, FaPlus, FaCloudUploadAlt, FaTimes, FaFile, FaSearch, FaGasPump, FaCog, FaCalendar, FaPalette, FaBolt, FaLeaf, FaTachometerAlt, FaUsers, FaEllipsisV, FaExternalLinkAlt, FaPaperPlane, FaTrash } from 'react-icons/fa';
import API_URL from '../config';

const Stock = () => {
    const [stock, setStock] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loadingStock, setLoadingStock] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [showLinksFor, setShowLinksFor] = useState(null);
    const { user } = useContext(AuthContext);

    // Smart Upload Modal States
    const [smartUploadOpen, setSmartUploadOpen] = useState(false);
    const [lookupRegistration, setLookupRegistration] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [fetchedVehicle, setFetchedVehicle] = useState(null);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Upload States (File upload)
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Direct Upload Modal (for stock items)
    const [directUploadOpen, setDirectUploadOpen] = useState(false);
    const [selectedStockItem, setSelectedStockItem] = useState(null);

    // Filter & Menu States
    const [filterStatus, setFilterStatus] = useState('All');
    const [activeMenu, setActiveMenu] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    // Send Modal States
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [customerTitle, setCustomerTitle] = useState('Mr');
    const [customerName, setCustomerName] = useState('');
    const [sendEmail, setSendEmail] = useState('');
    const [sendMobile, setSendMobile] = useState('');
    const [sending, setSending] = useState(false);

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


    const fetchStock = useCallback(async () => {
        setLoadingStock(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/autotrader/stock`, config);
            setStock(data.results || []);
            setLastSyncTime(data.lastSyncTime);
        } catch (error) {
            console.error('Failed to fetch stock', error);
            setStock([]);
        } finally {
            setLoadingStock(false);
        }
    }, [user.token]);

    const fetchVideos = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/videos`, config);
            console.log('Fetched videos:', data.length, data);
            setVideos(data);
        } catch (error) {
            console.error('Failed to fetch videos', error);
        }
    }, [user.token]);

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${API_URL}/api/videos/${videoId}`, config);
            // Refresh videos list
            fetchVideos();
            setActiveMenu(null);
            alert('Video deleted successfully');
        } catch (error) {
            console.error('Failed to delete video', error);
            alert(error.response?.data?.message || 'Failed to delete video');
        }
    };

    useEffect(() => {
        fetchStock();
        fetchVideos();
    }, [fetchStock, fetchVideos]);

    const getMatchingVideos = (stockItem) => {
        if (!stockItem.vehicle.registration) return [];
        const cleanReg = stockItem.vehicle.registration.replace(/\s+/g, '').toUpperCase();

        return videos.filter(video => {
            const title = (video.title || '').replace(/\s+/g, '').toUpperCase();
            return title.includes(cleanReg);
        });
    };

    const copyToClipboard = (videoId) => {
        const video = videos.find(v => v._id === videoId);
        // Prioritize current user (Sender), fallback to uploader
        const refName = user.name || user.username || video?.uploadedBy?.name || video?.uploadedBy?.username;
        const link = `${window.location.origin}/view/${videoId}?ref=${encodeURIComponent(refName)}`;
        navigator.clipboard.writeText(link);
        setCopiedId(videoId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // --- Smart Upload Handlers ---

    const openSmartUpload = () => {
        setSmartUploadOpen(true);
        setLookupRegistration('');
        setFetchedVehicle(null);
        setLookupError('');
        resetUploadState();
    };

    const closeSmartUpload = () => {
        setSmartUploadOpen(false);
        resetUploadState();
    };

    const resetUploadState = () => {
        setSelectedFile(null);
        setUploadSuccess(false);
        setUploadError('');
        setUploadProgress(0);
        setLookupLoading(false);
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!lookupRegistration.trim()) {
            setLookupError('Please enter a registration number');
            return;
        }

        setLookupLoading(true);
        setLookupError('');
        setFetchedVehicle(null);

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(
                `${API_URL}/api/autotrader/lookup/${lookupRegistration.replace(/\s/g, '')}`,
                config
            );

            if (data.vehicle) {
                // Normalize data to match the structure expected by VideoView/handleDirectUpload
                const v = data.vehicle;
                const normalizedVehicle = {
                    ...v, // Keep original fields
                    registration: v.registration,
                    make: v.make,
                    model: v.model,
                    derivative: v.derivative,
                    fuelType: v.fuelType,
                    transmissionType: v.transmissionType,
                    colour: v.colour,
                    bhp: v.enginePowerBHP, // Map for View Page
                    engineSize: v.engineCapacityCC, // Map for View Page
                    firstRegistrationDate: v.firstRegistrationDate,
                    odometerReadingMiles: v.odometerReadingMiles || v.mileage,

                    // Technical Specs (if available in top level from API or nested)
                    enginePowerBHP: v.enginePowerBHP,
                    accelerationSeconds: v.accelerationSeconds,
                    topSpeedMPH: v.topSpeedMPH,
                    fuelEconomyWLTPCombinedMPG: v.fuelEconomyWLTPCombinedMPG,
                    co2EmissionGPKM: v.co2EmissionGPKM,
                    doors: v.doors,
                    seats: v.seats,

                    // Add enriched data from API response
                    features: data.features || [],
                    techSpecs: data.techSpecs || {},
                    vehicleMetrics: data.vehicleMetrics || {},

                    // Metadata
                    provider: data.source === 'local' ? 'LocalCache' : 'AutoTrader',
                    rawData: data // Keep full raw data just in case
                };

                setFetchedVehicle(normalizedVehicle);
            } else {
                setLookupError('Vehicle not found');
            }
        } catch (err) {
            setLookupError(err.response?.data?.message || 'Failed to lookup vehicle');
        } finally {
            setLookupLoading(false);
        }
    };





    const handleUpload = async () => {
        if (!selectedFile || !fetchedVehicle) return;

        setUploading(true);
        setUploadError('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('video', selectedFile);
            formData.append('title', `${fetchedVehicle.make} ${fetchedVehicle.model} - ${fetchedVehicle.registration}`);
            formData.append('make', fetchedVehicle.make);
            formData.append('model', fetchedVehicle.model);
            formData.append('registration', fetchedVehicle.registration);
            formData.append('vehicleDetails', JSON.stringify(fetchedVehicle));

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            };

            await axios.post(`${API_URL}/api/videos`, formData, config);
            setUploadSuccess(true);
            fetchVideos();

            setTimeout(() => {
                closeSmartUpload();
            }, 2500);

        } catch (error) {
            setUploadError(error.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // File selection handlers
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('video/')) {
            setSelectedFile(file);
            setUploadError('');
        } else {
            setUploadError('Please select a valid video file');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            setSelectedFile(file);
            setUploadError('');
        } else {
            setUploadError('Please drop a valid video file');
        }
    };

    // Direct upload for stock items (File upload)
    const handleDirectUpload = async (stockItem) => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadError('');
        setUploadProgress(0);

        const vehicle = stockItem.vehicle;
        const vehicleDetails = {
            registration: vehicle.registration,
            make: vehicle.make,
            model: vehicle.model,
            derivative: vehicle.derivative,
            fuelType: vehicle.fuelType,
            transmissionType: vehicle.transmissionType,
            colour: vehicle.colour,
            bhp: vehicle.enginePowerBHP,
            engineSize: vehicle.engineCapacityCC,
            firstRegistrationDate: vehicle.firstRegistrationDate,
            odometerReadingMiles: vehicle.odometerReadingMiles,
            enginePowerBHP: vehicle.enginePowerBHP,
            accelerationSeconds: vehicle.accelerationSeconds,
            topSpeedMPH: vehicle.topSpeedMPH,
            fuelEconomyWLTPCombinedMPG: vehicle.fuelEconomyWLTPCombinedMPG,
            fuelEconomyNEDCCombinedMPG: vehicle.fuelEconomyNEDCCombinedMPG,
            co2EmissionGPKM: vehicle.co2EmissionGPKM,
            emissionClass: vehicle.emissionClass,
            doors: vehicle.doors,
            seats: vehicle.seats,
            bootSpaceSeatsUpLitres: vehicle.bootSpaceSeatsUpLitres,
            minimumKerbWeightKG: vehicle.minimumKerbWeightKG,
            insuranceGroup: vehicle.insuranceGroup,
            previousOwners: vehicle.previousOwners,
            motExpiryDate: vehicle.motExpiryDate,
            serviceHistory: vehicle.serviceHistory,
            highlights: stockItem.highlights || [],
            features: stockItem.features || [],
            provider: 'AutoTrader',
            rawData: stockItem
        };

        try {
            const formData = new FormData();
            formData.append('video', selectedFile);
            formData.append('title', `${vehicle.make} ${vehicle.model} - ${vehicle.registration}`);
            formData.append('make', vehicle.make);
            formData.append('model', vehicle.model);
            formData.append('registration', vehicle.registration);
            formData.append('vehicleDetails', JSON.stringify(vehicleDetails));

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            };

            await axios.post(`${API_URL}/api/videos`, formData, config);
            setUploadSuccess(true);
            fetchVideos();

            setTimeout(() => {
                setDirectUploadOpen(false);
                setSelectedStockItem(null);
                setSelectedFile(null);
                setUploadSuccess(false);
            }, 2500);

        } catch (err) {
            setUploadError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredStock = stock.filter(item => {
        const searchString = searchTerm.toLowerCase();
        const make = item.vehicle.make?.toLowerCase() || '';
        const model = item.vehicle.model?.toLowerCase() || '';
        const reg = item.vehicle.registration?.toLowerCase() || '';
        const matchesSearch = make.includes(searchString) || model.includes(searchString) || reg.includes(searchString);

        const matchingVideos = getMatchingVideos(item);
        const hasVideo = matchingVideos.length > 0;

        const matchesFilter =
            filterStatus === 'All' ||
            (filterStatus === 'With Video' && hasVideo) ||
            (filterStatus === 'No Video' && !hasVideo);

        return matchesSearch && matchesFilter;
    });

    return (
        <DashboardLayout>
            <div className="w-full px-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">All Vehicles</h1>
                        <p className="text-gray-500 mt-1">Manage inventory and upload videos.</p>
                        {lastSyncTime && (
                            <p className="text-xs text-gray-400 mt-1">
                                Last sync: {new Date(lastSyncTime).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={openSmartUpload}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition flex items-center gap-2"
                    >
                        <FaVideo />
                        Upload Video via Registration
                    </button>
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
                                    onClick={() => setFilterStatus(status)}
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
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    {loadingStock ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto lg:overflow-visible">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white text-gray-500 text-xs uppercase font-semibold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4">Vehicle</th>
                                        <th className="px-6 py-4">Details</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStock.length > 0 ? filteredStock.map((item) => {
                                        const matchingVideos = getMatchingVideos(item);
                                        const videoExists = matchingVideos.length > 0;
                                        const imageUrl = item.media?.images?.[0]?.href || item.media?.images?.[0]?.url;

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`hover:bg-gray-50 transition relative ${videoExists ? 'bg-green-50' : ''}`}
                                            >
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

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    {videoExists ? (
                                                        <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            {matchingVideos.length} Video{matchingVideos.length > 1 ? 's' : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                            No Video
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right">
                                                    {videoExists ? (
                                                        <div className="relative inline-block">
                                                            <button
                                                                onClick={(e) => handleActionClick(e, item.id)}
                                                                className={`p-2 rounded-full transition ${activeMenu === item.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                            >
                                                                <FaEllipsisV />
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            {activeMenu === item.id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                                                                    <div
                                                                        className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 p-1 animate-fade-in origin-top-right"
                                                                        style={{ top: `${menuPos.top}px`, right: `${menuPos.right}px` }}
                                                                    >
                                                                        {/* Removed Upload Another Option as requested by user */}

                                                                        {matchingVideos.map((vid, idx) => (
                                                                            <div key={vid._id} className="border-t border-gray-50 mt-1 pt-1">
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
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStockItem(item);
                                                                setDirectUploadOpen(true);
                                                                setSelectedFile(null);
                                                                setUploadError('');
                                                            }}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow hover:shadow-md"
                                                        >
                                                            <FaCloudUploadAlt />
                                                            Upload
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-12">
                                                <FaCar className="mx-auto text-gray-300 mb-4" size={48} />
                                                <p className="text-gray-500">No stock found matching your filters.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Placeholder */}
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <p>Showing <span className="font-medium text-gray-800">1-{filteredStock.length}</span> of <span className="font-medium text-gray-800">{filteredStock.length}</span> entries</p>
                        <div className="flex gap-2">
                            <span className="text-xs text-gray-400">All data loaded</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Upload Modal */}
            {smartUploadOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-gray-900 text-white p-5 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FaVideo className="text-blue-400" />
                                Find Vehicle & Upload
                            </h3>
                            <button onClick={closeSmartUpload} className="text-gray-400 hover:text-white transition">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="overflow-y-auto p-6 flex-1">
                            {!fetchedVehicle ? (
                                // Step 1: Lookup
                                <div className="max-w-md mx-auto py-8">
                                    <div className="text-center mb-6">
                                        <FaSearch className="mx-auto text-blue-600 mb-3" size={32} />
                                        <h4 className="text-xl font-bold text-gray-800">Enter Registration</h4>
                                        <p className="text-sm text-gray-500">We'll fetch the car details automatically.</p>
                                    </div>
                                    <form onSubmit={handleLookup}>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={lookupRegistration}
                                                onChange={(e) => setLookupRegistration(e.target.value.toUpperCase())}
                                                placeholder="AB12 CDE"
                                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-bold uppercase tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={lookupLoading}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {lookupLoading ? 'Please Wait...' : 'Lookup'}
                                            </button>
                                        </div>
                                    </form>
                                    {lookupError && (
                                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-center font-medium border border-red-200">
                                            {lookupError}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Step 2: Confirm & Upload
                                <div className="space-y-6">
                                    {/* Vehicle Details Card */}
                                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-800">{fetchedVehicle.make} {fetchedVehicle.model}</h2>
                                                <p className="text-gray-600">{fetchedVehicle.derivative}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-yellow-400 text-black px-3 py-1 rounded font-bold text-lg tracking-wider border-2 border-black">
                                                    {fetchedVehicle.registration}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2"><FaGasPump className="text-gray-400" /> {fetchedVehicle.fuelType || 'N/A'}</div>
                                            <div className="flex items-center gap-2"><FaCog className="text-gray-400" /> {fetchedVehicle.transmissionType || 'N/A'}</div>
                                            <div className="flex items-center gap-2"><FaPalette className="text-gray-400" /> {fetchedVehicle.colour || 'N/A'}</div>
                                            <div className="flex items-center gap-2"><FaCalendar className="text-gray-400" /> {formatDate(fetchedVehicle.firstRegistrationDate)}</div>
                                        </div>

                                        <button
                                            onClick={() => setFetchedVehicle(null)}
                                            className="text-xs text-blue-600 mt-4 font-medium hover:underline"
                                        >
                                            ← Not the right car? Search again
                                        </button>
                                    </div>

                                    {/* Upload Section */}
                                    {!uploadSuccess ? (
                                        <div className="border-t pt-2">
                                            <h4 className="font-bold text-gray-700 mb-3">Upload Video File</h4>

                                            {/* File Upload Drag and Drop */}
                                            <div
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all mb-4 ${isDragging
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />

                                                <FaCloudUploadAlt
                                                    className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                                                    size={40}
                                                />

                                                {selectedFile ? (
                                                    <div>
                                                        <p className="text-green-600 font-medium mb-1">
                                                            ✓ {selectedFile.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            Click to change file
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-gray-700 font-medium mb-1">
                                                            Drop video file here or click to browse
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Supports MP4, MOV, AVI and other video formats
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Upload Progress */}
                                            {uploading && (
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Uploading to Cloudflare Stream...</span>
                                                        <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {uploadError && (
                                                <div className="mt-3 text-red-600 text-sm font-medium text-center">{uploadError}</div>
                                            )}

                                            <div className="mt-6 flex justify-end gap-3">
                                                <button onClick={closeSmartUpload} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                                <button
                                                    onClick={handleUpload}
                                                    disabled={!selectedFile || uploading}
                                                    className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {uploading ? 'Uploading...' : <><FaCloudUploadAlt /> Start Upload</>}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 animate-fadeIn">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaCheck className="text-green-600" size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800">Success!</h3>
                                            <p className="text-gray-500 mb-6">Video uploaded and linked to {fetchedVehicle.registration}</p>
                                            <button onClick={closeSmartUpload} className="text-blue-600 font-bold hover:underline">Close</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Upload Modal (for Stock Items) */}
            {directUploadOpen && selectedStockItem && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FaVideo />
                                Upload Video
                            </h3>
                            <button
                                onClick={() => {
                                    setDirectUploadOpen(false);
                                    setSelectedStockItem(null);
                                    setSelectedFile(null);
                                    setUploadError('');
                                }}
                                className="text-white hover:text-gray-200 transition"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto p-6 flex-1">
                            {/* Vehicle Details Card */}
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {selectedStockItem.vehicle.make} {selectedStockItem.vehicle.model}
                                        </h2>
                                        <p className="text-gray-600">{selectedStockItem.vehicle.derivative}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-yellow-400 text-black px-3 py-1 rounded font-bold text-lg tracking-wider border-2 border-black">
                                            {selectedStockItem.vehicle.registration}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FaGasPump className="text-gray-400" />
                                        {selectedStockItem.vehicle.fuelType || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaCog className="text-gray-400" />
                                        {selectedStockItem.vehicle.transmissionType || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaPalette className="text-gray-400" />
                                        {selectedStockItem.vehicle.colour || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaCalendar className="text-gray-400" />
                                        {formatDate(selectedStockItem.vehicle.firstRegistrationDate)}
                                    </div>
                                </div>
                            </div>

                            {/* Upload Section */}
                            {!uploadSuccess ? (
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-3">Upload Video File</h4>

                                    {/* File Upload Drag and Drop */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all mb-4 ${isDragging
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="video/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />

                                        <FaCloudUploadAlt
                                            className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                                            size={40}
                                        />

                                        {selectedFile ? (
                                            <div>
                                                <p className="text-green-600 font-medium mb-1">
                                                    ✓ {selectedFile.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Click to change file
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-gray-700 font-medium mb-1">
                                                    Drop video file here or click to browse
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Supports MP4, MOV, AVI and other video formats
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Progress */}
                                    {uploading && (
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Uploading to Cloudflare Stream...</span>
                                                <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {uploadError && (
                                        <div className="mt-3 text-red-600 text-sm font-medium text-center">
                                            {uploadError}
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            onClick={() => {
                                                setDirectUploadOpen(false);
                                                setSelectedStockItem(null);
                                                setSelectedFile(null);
                                                setUploadError('');
                                            }}
                                            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleDirectUpload(selectedStockItem)}
                                            disabled={!selectedFile || uploading}
                                            className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {uploading ? 'Uploading...' : <><FaCloudUploadAlt /> Start Upload</>}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 animate-fadeIn">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaCheck className="text-green-600" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Success!</h3>
                                    <p className="text-gray-500 mb-6">
                                        Video uploaded for {selectedStockItem.vehicle.registration}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setDirectUploadOpen(false);
                                            setSelectedStockItem(null);
                                            setSelectedFile(null);
                                            setUploadSuccess(false);
                                        }}
                                        className="text-blue-600 font-bold hover:underline"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Send Link Modal */}
            {sendModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">Send Video Link</h3>
                            <button onClick={() => setSendModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
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
                                <input
                                    type="tel"
                                    value={sendMobile}
                                    onChange={(e) => setSendMobile(e.target.value)}
                                    placeholder="+44 7700 900000"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setSendModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!customerName || !sendEmail) return;
                                        setSending(true);
                                        try {
                                            // Prioritize current user (Sender), fallback to uploader
                                            const refName = user.name || user.username || selectedVideo?.uploadedBy?.name || selectedVideo?.uploadedBy?.username;
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
                                            setSendModalOpen(false);
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
            {/* Debug Section - Temporary */}
            {/* Removed */}
        </DashboardLayout>
    );
};

export default Stock;
