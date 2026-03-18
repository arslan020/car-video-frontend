import { useState } from 'react';
import { FaUserCircle, FaSignOutAlt, FaChevronDown, FaBars } from 'react-icons/fa';
import Logo from '../assets/business-logo.png';

const Header = ({ user, onLogout, onToggleSidebar }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
            {/* Left side (Hamburger + Logo) */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="md:hidden text-gray-500 hover:text-primary focus:outline-none"
                >
                    <FaBars size={24} />
                </button>
                <img src={Logo} alt="Heston Automotive" className="h-8 md:h-10 object-contain" />
            </div>

            {/* Right side (User Profile) */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-lg transition focus:outline-none"
                >
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-gray-700">{user?.username}</div>
                        <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                    </div>
                    <FaUserCircle size={32} className="text-gray-400" />
                    <FaChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100 animate-fadeIn">
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <FaSignOutAlt />
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Click outside to close (simple overlay for now) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </header>
    );
};

export default Header;
