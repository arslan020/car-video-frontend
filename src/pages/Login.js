import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Logo from '../assets/business-logo.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(username, password);
            if (data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/staff');
            }
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] px-4 font-sans text-gray-700">
            {/* Logo */}
            <div className="mb-6">
                <img src={Logo} alt="Heston Automotive" className="h-16 object-contain" />
            </div>

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-semibold mb-8 text-center text-gray-800">
                Sign In To Your<br />Account
            </h2>

            {/* Form */}
            <div className="w-full max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-gray-700 bg-white placeholder-gray-400 transition shadow-sm"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-gray-700 bg-white placeholder-gray-400 transition shadow-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        className={`w-full font-semibold py-3 rounded-lg transition duration-200 shadow-sm mt-6 ${loading || !username || !password
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#9da4c4] hover:bg-[#8b91b0] text-white'
                            }`}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-6 text-center">
                    <button className="text-[#8b91b0] hover:text-blue-600 text-sm font-medium transition">
                        Forgotten password?
                    </button>
                </div>

                {/* Copyright / Bottom Logo Placeholder */}
                <div className="mt-12 text-center flex flex-col items-center opacity-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mb-2"></div>
                    <p className="text-xs text-gray-500 font-medium">Heston Automotive</p>
                    <p className="text-[10px] text-gray-400 mt-1">© 2025</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
