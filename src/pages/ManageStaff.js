import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaUserPlus, FaUserTie, FaEnvelope, FaPhone, FaEdit, FaTimes, FaCheck, FaKey } from 'react-icons/fa';

const ManageStaff = () => {
    const [staff, setStaff] = useState([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resetPasswordModal, setResetPasswordModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const { user } = useContext(AuthContext);

    const fetchStaff = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/auth/staff', config);
            setStaff(data);
        } catch (error) {
            console.error(error);
        }
    }, [user]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const formattedPhone = phoneNumber.startsWith('+44') ? phoneNumber : `+44${phoneNumber.replace(/^0/, '')}`;

            if (editingStaffId) {
                await axios.post(`http://localhost:5000/api/auth/staff/${editingStaffId}`, {
                    username,
                    password: password || undefined,
                    email,
                    phoneNumber: formattedPhone
                }, config);
                alert('Staff updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/auth/staff', {
                    username,
                    password,
                    email,
                    phoneNumber: formattedPhone
                }, config);
                alert('Staff created successfully');
            }

            resetForm();
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.message || 'Error processing request');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (member) => {
        setEditingStaffId(member._id);
        setUsername(member.username || '');
        setEmail(member.email || '');
        setPhoneNumber(member.phoneNumber ? member.phoneNumber.replace('+44', '') : '');
        setPassword('');
    };

    const resetForm = () => {
        setEditingStaffId(null);
        setUsername('');
        setPassword('');
        setEmail('');
        setPhoneNumber('');
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`http://localhost:5000/api/auth/staff/${resetPasswordModal._id}`, {
                password: newPassword
            }, config);
            alert('Password reset successfully!');
            setResetPasswordModal(null);
            setNewPassword('');
        } catch (error) {
            alert(error.response?.data?.message || 'Error resetting password');
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full px-6">
                <header className="mb-6 md:mb-8 border-b pb-4 border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Staff</h1>
                            <p className="text-sm md:text-base text-gray-500 mt-1">Create, edit, and monitor staff accounts.</p>
                        </div>
                        <div className="bg-blue-100 px-4 py-2 rounded-lg">
                            <p className="text-sm text-gray-600">Total Staff</p>
                            <p className="text-2xl font-bold text-blue-600">{staff.length}</p>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Create/Edit Staff Form */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        {/* Form Header */}
                        <div className={`p-5 ${editingStaffId ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    {editingStaffId ? <FaEdit size={20} /> : <FaUserPlus size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">
                                        {editingStaffId ? 'Edit Staff Member' : 'Add New Staff'}
                                    </h2>
                                    <p className="text-sm text-white text-opacity-80">
                                        {editingStaffId ? 'Update staff details' : 'Create a new account'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleAddStaff} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. john_doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">UK Phone Number</label>
                                <div className="flex">
                                    <span className="flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 font-medium">
                                        +44
                                    </span>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        placeholder="7123456789"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password
                                    {editingStaffId && (
                                        <span className="text-xs text-blue-500 ml-2">(Leave blank to keep current)</span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required={!editingStaffId}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${editingStaffId
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                        } disabled:opacity-50`}
                                >
                                    {loading ? (
                                        <div className="spinner-sm border-t-white"></div>
                                    ) : editingStaffId ? (
                                        <>
                                            <FaCheck />
                                            Update Staff
                                        </>
                                    ) : (
                                        <>
                                            <FaUserPlus />
                                            Create Account
                                        </>
                                    )}
                                </button>
                                {editingStaffId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition flex items-center gap-2"
                                    >
                                        <FaTimes />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Staff List */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        {/* List Header */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5">
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <FaUserTie size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Active Staff</h2>
                                    <p className="text-sm text-white text-opacity-80">{staff.length} members</p>
                                </div>
                            </div>
                        </div>

                        {/* Staff List */}
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {staff.length === 0 ? (
                                <div className="text-center py-12">
                                    <FaUserTie className="mx-auto text-gray-300 mb-4" size={48} />
                                    <p className="text-gray-500">No staff members found.</p>
                                    <p className="text-sm text-gray-400 mt-1">Create your first staff account!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {staff.map((member) => (
                                        <div
                                            key={member._id}
                                            className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${editingStaffId === member._id
                                                ? 'border-amber-400 bg-amber-50'
                                                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {member.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800">{member.username}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                            <FaEnvelope size={12} />
                                                            <span className="truncate max-w-[150px]">{member.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <FaPhone size={12} />
                                                            <span>{member.phoneNumber}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                                        Active
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEditClick(member)}
                                                            className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                                                        >
                                                            <FaEdit size={10} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => setResetPasswordModal(member)}
                                                            className="flex items-center gap-1 text-xs bg-amber-500 text-white px-2 py-1.5 rounded-lg hover:bg-amber-600 transition font-medium"
                                                        >
                                                            <FaKey size={10} />
                                                            Reset
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reset Password Modal */}
                {resetPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5">
                                <div className="flex items-center gap-3 text-white">
                                    <FaKey size={24} />
                                    <div>
                                        <h3 className="text-lg font-bold">Reset Password</h3>
                                        <p className="text-sm text-white text-opacity-80">
                                            Set new password for {resetPasswordModal.username}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min 6 characters)"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleResetPassword}
                                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition"
                                    >
                                        Reset Password
                                    </button>
                                    <button
                                        onClick={() => {
                                            setResetPasswordModal(null);
                                            setNewPassword('');
                                        }}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                                    >
                                        Cancel
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

export default ManageStaff;

