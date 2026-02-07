import { useContext, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaSignOutAlt, FaUserShield, FaEdit, FaLock, FaEnvelope, FaPhone, FaShieldAlt, FaTimes, FaUsers, FaCar, FaVideo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import InstallApp from '../components/InstallApp';

const AdminSettings = () => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        try {
            if (!formData.currentPassword) {
                setMessage({ type: 'error', text: 'Current password is required' });
                setLoading(false);
                return;
            }

            if (!formData.username && !formData.newPassword) {
                setMessage({ type: 'error', text: 'Please provide username or new password to update' });
                setLoading(false);
                return;
            }

            if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
                setMessage({ type: 'error', text: 'New passwords do not match' });
                setLoading(false);
                return;
            }

            if (formData.newPassword && formData.newPassword.length < 6) {
                setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
                setLoading(false);
                return;
            }

            const updateData = { currentPassword: formData.currentPassword };

            if (formData.username && formData.username !== user.username) {
                updateData.username = formData.username;
            }

            if (formData.newPassword) {
                updateData.newPassword = formData.newPassword;
            }

            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put('http://localhost:5000/api/auth/profile', updateData, config);

            updateUser(data);
            setMessage({ type: 'success', text: data.message || 'Profile updated successfully!' });

            setFormData({
                username: '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setTimeout(() => {
                setShowProfileForm(false);
                setMessage({ type: '', text: '' });
            }, 2000);

        } catch (error) {
            console.error('Profile update error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setShowProfileForm(false);
        setFormData({
            username: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setMessage({ type: '', text: '' });
    };

    return (
        <DashboardLayout>
            <div className="w-full px-6">
                <header className="mb-6 md:mb-8 border-b pb-4 border-gray-200">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Settings</h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1">Manage your admin account and system preferences.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            {/* Profile Header - Purple for Admin */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                        <FaUserShield className="text-white" size={28} />
                                    </div>
                                    <div className="text-white">
                                        <h2 className="text-xl font-bold capitalize">{user?.username}</h2>
                                        <p className="text-blue-100">Administrator Account</p>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {user?.email && (
                                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <FaEnvelope className="text-blue-500" size={18} />
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="text-sm font-medium text-gray-800">{user.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {user?.phoneNumber && (
                                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <FaPhone className="text-blue-500" size={18} />
                                            <div>
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="text-sm font-medium text-gray-800">{user.phoneNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <FaShieldAlt className="text-blue-500" size={18} />
                                        <div>
                                            <p className="text-xs text-gray-500">Role</p>
                                            <p className="text-sm font-medium text-gray-800 capitalize">{user?.role}</p>
                                        </div>
                                    </div>
                                </div>

                                {!showProfileForm ? (
                                    <button
                                        onClick={() => setShowProfileForm(true)}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-100 transition font-medium border border-blue-200"
                                    >
                                        <FaEdit />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                <FaLock className="text-blue-600" />
                                                Update Profile
                                            </h3>
                                            <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                                                <FaTimes size={20} />
                                            </button>
                                        </div>

                                        {message.text && (
                                            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success'
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                {message.text}
                                            </div>
                                        )}

                                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    New Username (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    placeholder={user?.username}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Current Password <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    name="currentPassword"
                                                    value={formData.currentPassword}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    New Password (optional)
                                                </label>
                                                <input
                                                    type="password"
                                                    name="newPassword"
                                                    value={formData.newPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Leave blank to keep current"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            {formData.newPassword && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Confirm New Password <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-medium disabled:opacity-50"
                                            >
                                                {loading ? 'Updating...' : 'Update Profile'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <FaUsers className="text-blue-500" size={20} />
                                    <span className="text-sm font-medium text-gray-700">Staff Management</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <FaCar className="text-blue-500" size={20} />
                                    <span className="text-sm font-medium text-gray-700">Vehicle Stock</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <FaVideo className="text-blue-500" size={20} />
                                    <span className="text-sm font-medium text-gray-700">All Videos</span>
                                </div>
                            </div>
                        </div>

                        {/* Install App Card */}
                        <InstallApp />

                        {/* Sign Out Card */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Session</h3>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition font-semibold"
                            >
                                <FaSignOutAlt />
                                Sign Out
                            </button>
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                Securely logout from your admin session.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminSettings;
