import { FaHome, FaVideo, FaCar, FaCog, FaUser, FaUsersCog, FaUserShield, FaSearch } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = user?.role === 'admin';

    const adminMenuItems = [
        { icon: FaHome, label: 'Dashboard', path: '/admin' },
        { icon: FaCar, label: 'Browse Vehicles', path: '/admin/stock' },
        { icon: FaVideo, label: 'Uploaded Videos', path: '/staff/videos' },
        { icon: FaUsersCog, label: 'Manage Staff', path: '/admin/staff' },
        { icon: FaCog, label: 'Settings', path: '/admin/settings' },
    ];

    const staffMenuItems = [
        { icon: FaHome, label: 'Dashboard', path: '/staff' },
        { icon: FaCar, label: 'Browse Vehicles', path: '/staff/stock' },
        { icon: FaVideo, label: 'My Videos', path: '/staff/videos' },
        { icon: FaCog, label: 'Settings', path: '/staff/settings' },
    ];

    const menuItems = isAdmin ? adminMenuItems : staffMenuItems;

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 text-gray-600 flex flex-col min-h-screen transition-all duration-300">
            {/* Sidebar Header */}
            <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-100">
                <div className="bg-blue-600 rounded p-1">
                    <FaHome className="text-white" size={14} />
                </div>
                <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                    {isAdmin ? 'Admin Panel' : 'Staff Panel'}
                </h1>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-1 mt-2">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={index}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={18} className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
