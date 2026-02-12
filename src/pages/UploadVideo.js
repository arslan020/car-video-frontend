import { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaVideo, FaCheckCircle, FaTimesCircle, FaCloudUploadAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import API_URL from '../config';

const UploadVideo = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [stockInfo, setStockInfo] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.stockInfo) {
            setStockInfo(location.state.stockInfo);
        }
    }, [location]);

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

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            setUploadError('Please select a video file');
            return;
        }

        setUploading(true);
        setUploadSuccess(false);
        setUploadError('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('video', selectedFile);

            if (stockInfo) {
                formData.append('title', `${stockInfo.make} ${stockInfo.model} - ${stockInfo.registration}`);
                formData.append('registration', stockInfo.registration);
                formData.append('make', stockInfo.make);
                formData.append('model', stockInfo.model);
            }

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

            await axios.post(`${API_URL}/api/videos`, formData, config);
            setUploadSuccess(true);
            setTimeout(() => {
                navigate('/staff/videos');
            }, 2000);
        } catch (error) {
            console.error(error);
            setUploadError(error.response?.data?.message || 'Video upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl shadow-lg p-8 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <FaVideo size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {stockInfo ? `Upload Video for ${stockInfo.make} ${stockInfo.model}` : 'Upload Car Video'}
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">Upload video file directly to Cloudflare Stream</p>
                            </div>
                        </div>
                    </div>

                    {/* Upload Form */}
                    <div className="bg-white rounded-b-2xl shadow-lg p-8">
                        {!uploadSuccess ? (
                            <form onSubmit={handleUpload} className="space-y-6">
                                {/* Stock Info Display */}
                                {stockInfo && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <FaVideo className="text-blue-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {stockInfo.make} {stockInfo.model}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Registration: {stockInfo.registration}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* File Upload Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Video File
                                    </label>

                                    {/* Drag and Drop Area */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragging
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
                                            className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                                            size={48}
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
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Maximum file size: 3GB
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Progress */}
                                {uploading && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Uploading to Cloudflare Stream...</span>
                                            <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {uploadError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                        <FaTimesCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                        <p className="text-red-700 text-sm">{uploadError}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={uploading || !selectedFile}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all transform ${uploading || !selectedFile
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                                        }`}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Video'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaCheckCircle className="text-green-600" size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Successful!</h3>
                                <p className="text-gray-600">Redirecting to your videos...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UploadVideo;
