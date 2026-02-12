import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaCar, FaVideo, FaCopy, FaCheck, FaCheckCircle, FaPlus, FaCloudUploadAlt, FaTimes, FaFile, FaSearch, FaGasPump, FaCog, FaCalendar, FaPalette, FaBolt, FaLeaf, FaTachometerAlt, FaUsers } from 'react-icons/fa';
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
            return title.includes(stockItem.vehicle.registration);
        });
    };

    const copyToClipboard = (videoId) => {
        const link = `${window.location.origin}/view/${videoId}`;
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
        return make.includes(searchString) || model.includes(searchString) || reg.includes(searchString);
    });

    return (
        <DashboardLayout>
            <div className="w-full px-6">
                <header className="mb-6 md:mb-8 border-b pb-4 border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">All Vehicles</h1>
                            <p className="text-sm md:text-base text-gray-500 mt-1">Manage inventory and upload videos.</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search vehicles..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                                />
                                <FaSearch className="absolute left-3 top-4 text-gray-400" />
                            </div>
                            <button
                                onClick={openSmartUpload}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition flex items-center gap-2 justify-center"
                            >
                                <FaVideo />
                                Upload Video via Registration
                            </button>
                        </div>
                    </div>
                </header>

                {loadingStock ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 bg-gray-50">
                                    <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600 uppercase tracking-wider">Image</th>
                                    <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600 uppercase tracking-wider">Vehicle Details</th>
                                    <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-4 px-6 font-semibold text-sm text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
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
                                                        <span className="font-mono font-bold bg-yellow-100 px-2 py-0.5 rounded text-gray-800 border border-yellow-200">
                                                            {item.vehicle.registration}
                                                        </span>
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
                                                <div className="flex flex-col items-end gap-2">
                                                    {/* Upload Button */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStockItem(item);
                                                            setDirectUploadOpen(true);
                                                            setSelectedFile(null);
                                                            setUploadError('');
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                                                    >
                                                        <FaCloudUploadAlt />
                                                        Upload
                                                    </button>

                                                    {/* Video Links */}
                                                    {videoExists && (
                                                        <div className="flex gap-1 mt-1">
                                                            {matchingVideos.map((vid) => (
                                                                <button
                                                                    key={vid._id}
                                                                    onClick={() => copyToClipboard(vid._id)}
                                                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition"
                                                                    title="Copy Video Link"
                                                                >
                                                                    {copiedId === vid._id ? <FaCheck size={10} /> : <FaCopy size={10} />}
                                                                    Link
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12">
                                            <FaCar className="mx-auto text-gray-300 mb-4" size={48} />
                                            <p className="text-gray-500">No stock found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
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
        </DashboardLayout>
    );
};

export default Stock;
