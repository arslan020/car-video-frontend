import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaCloudUploadAlt, FaCar, FaVideo, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const UploadVideo = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [stockInfo, setStockInfo] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Get stock info from navigation state
        if (location.state?.stockInfo) {
            setStockInfo(location.state.stockInfo);
        }
    }, [location]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith('video/')) {
                setFile(droppedFile);
                setUploadError('');
            } else {
                setUploadError('Please select a valid video file');
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type.startsWith('video/')) {
                setFile(selectedFile);
                setUploadError('');
            } else {
                setUploadError('Please select a valid video file');
            }
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);

        // Add stock info to video title if available
        if (stockInfo) {
            const title = `${stockInfo.make} ${stockInfo.model} - ${stockInfo.registration}`;
            formData.append('title', title);
            formData.append('stockId', stockInfo.stockId);
            formData.append('make', stockInfo.make);
            formData.append('model', stockInfo.model);
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadSuccess(false);
        setUploadError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            };
            await axios.post('http://localhost:5000/api/videos', formData, config);
            setUploadSuccess(true);
            setTimeout(() => {
                navigate('/staff/videos');
            }, 2000);
        } catch (error) {
            console.error(error);
            setUploadError('Video upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <DashboardLayout>
            <div className="w-full max-w-4xl mx-auto">
                <header className="mb-6 md:mb-8 border-b pb-4 border-gray-200">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Upload Video</h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1">Upload a new car video.</p>
                </header>

                {/* Stock Info Display */}
                {stockInfo && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-5 mb-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <FaCar className="text-white" size={20} />
                            </div>
                            <h3 className="font-semibold text-blue-900 text-lg">Selected Vehicle</h3>
                        </div>
                        <div className="ml-13">
                            <p className="text-xl font-bold text-gray-800">{stockInfo.make} {stockInfo.model}</p>
                            <p className="text-sm text-gray-600 mt-1">Registration: <span className="font-semibold">{stockInfo.registration}</span></p>
                        </div>
                    </div>
                )}

                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <FaCloudUploadAlt size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {stockInfo ? `Upload Video for ${stockInfo.make} ${stockInfo.model}` : 'Upload Car Video'}
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">Drag and drop or click to select</p>
                            </div>
                        </div>
                    </div>

                    {/* Upload Form */}
                    <div className="p-8">
                        <form onSubmit={handleUpload} className="space-y-6">
                            {/* Drag and Drop Area */}
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${dragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : file
                                        ? 'border-green-400 bg-green-50'
                                        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    id="file-upload"
                                />

                                {!file ? (
                                    <div className="space-y-4">
                                        <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                                            <FaCloudUploadAlt className="text-blue-600" size={40} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-gray-700 mb-2">
                                                Drop your video here, or <span className="text-blue-600">browse</span>
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Supports: MP4, MOV, AVI, WebM
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                            <FaVideo className="text-green-600" size={36} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-gray-800 mb-1">{file.name}</p>
                                            <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                                            <button
                                                type="button"
                                                onClick={() => setFile(null)}
                                                className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Remove file
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {uploadError && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
                                    <FaTimesCircle className="text-red-500" size={20} />
                                    <p className="text-red-700 font-medium">{uploadError}</p>
                                </div>
                            )}

                            {/* Success Message */}
                            {uploadSuccess && (
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center gap-3">
                                    <FaCheckCircle className="text-green-500" size={20} />
                                    <p className="text-green-700 font-medium">Video uploaded successfully! Redirecting...</p>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {uploading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Uploading...</span>
                                        <span className="font-semibold">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Upload Button */}
                            <button
                                type="submit"
                                disabled={!file || uploading || uploadSuccess}
                                className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all duration-300 ${!file || uploading || uploadSuccess
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105'
                                    }`}
                            >
                                {uploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner-sm border-t-white"></div>
                                        Uploading... {uploadProgress}%
                                    </span>
                                ) : uploadSuccess ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaCheckCircle />
                                        Upload Complete!
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaCloudUploadAlt />
                                        Upload Video
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UploadVideo;
