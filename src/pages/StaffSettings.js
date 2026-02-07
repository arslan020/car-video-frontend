import { useState, useContext } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import {
    FaUser, FaEnvelope, FaPhone, FaShieldAlt, FaEdit, FaLock,
    FaTimes, FaVideo, FaCar, FaCloudUploadAlt, FaSignOutAlt,
    FaCheckCircle, FaChevronRight
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import InstallApp from '../components/InstallApp';

const StaffSettings = () => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!formData.currentPassword) {
            setMessage({ type: 'error', text: 'Current password is required' });
            return;
        }
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const updateData = {
                currentPassword: formData.currentPassword,
                ...(formData.username && { username: formData.username }),
                ...(formData.newPassword && { password: formData.newPassword })
            };

            const { data } = await axios.put('http://localhost:5000/api/auth/profile', updateData, config);
            updateUser({ ...user, username: data.username });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setShowProfileForm(false);
            setFormData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const quickLinks = [
        { icon: FaCloudUploadAlt, label: 'Upload Videos', path: '/staff/stock' },
        { icon: FaVideo, label: 'My Videos', path: '/staff/videos' },
        { icon: FaCar, label: 'Stock', path: '/staff/stock' }
    ];

    return (
        <DashboardLayout>
            <div className="w-full px-6">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Good Afternoon, {user?.username || 'User'}!</h1>
                    <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
                </header>

                {/* Message Toast */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                        <FaCheckCircle />
                        <span>{message.text}</span>
                        <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto">
                            <FaTimes />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-5 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800">Profile Information</h2>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                    {/* Email */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                                            <FaEnvelope className="text-blue-500" size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Email</p>
                                            <p className="text-gray-800 font-medium">{user?.email || 'Not set'}</p>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
                                            <FaPhone className="text-green-500" size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Phone</p>
                                            <p className="text-gray-800 font-medium">{user?.phoneNumber || 'Not set'}</p>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 md:col-span-2">
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                                            <FaShieldAlt className="text-purple-500" size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-400 font-medium">Role</p>
                                            <p className="text-gray-800 font-medium capitalize">{user?.role || 'Staff'}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded-full">
                                            Verified
                                        </span>
                                    </div>
                                </div>

                                {/* Edit Profile Button or Form */}
                                {!showProfileForm ? (
                                    <button
                                        onClick={() => setShowProfileForm(true)}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-600 transition"
                                    >
                                        <FaEdit size={14} />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <form onSubmit={handleProfileUpdate} className="space-y-4 bg-gray-50 p-5 rounded-lg border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                                <FaLock className="text-blue-500" size={14} />
                                                Update Profile
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowProfileForm(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <FaTimes size={16} />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1.5">New Username</label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                placeholder={user?.username}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Current Password *</label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1.5">New Password</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                placeholder="Leave blank to keep current"
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {formData.newPassword && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
                                        >
                                            {loading ? 'Updating...' : 'Save Changes'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <InstallApp />
                        {/* Session */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800">Session</h3>
                            </div>
                            <div className="p-4">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-red-600 transition"
                                >
                                    <FaSignOutAlt size={14} />
                                    Sign Out
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-2">
                                    Securely logout from your session
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StaffSettings;
