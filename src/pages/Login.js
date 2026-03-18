import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Logo from '../assets/business-logo.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
    const [userId, setUserId] = useState(null);
    const { login, verify2FA } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (step === 1) {
                const data = await login(username, password);

                if (data.requireTwoFactor) {
                    setUserId(data.userId);
                    setStep(2);
                    setLoading(false);
                    return;
                }

                if (data.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/staff');
                }
            } else {
                // Verify OTP
                const data = await verify2FA(userId, otp);
                if (data.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/staff');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
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
                {step === 1 ? 'Sign In To Your' : 'Verify Your'}<br />
                {step === 1 ? 'Account' : 'Identity'}
            </h2>

            {/* Form */}
            <div className="w-full max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <>
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
                        </>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-500 mb-4 text-center">
                                Please enter the verification code sent to your email.
                            </p>
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-gray-700 bg-white placeholder-gray-400 transition shadow-sm text-center tracking-widest text-xl"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (step === 1 ? (!username || !password) : otp.length !== 6)}
                        className={`w-full font-semibold py-3 rounded-lg transition duration-200 shadow-sm mt-6 ${loading || (step === 1 ? (!username || !password) : otp.length !== 6)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#9da4c4] hover:bg-[#8b91b0] text-white'
                            }`}
                    >
                        {loading ? 'Processing...' : (step === 1 ? 'Login' : 'Verify Code')}
                    </button>

                    {step === 2 && (
                        <button
                            type="button"
                            onClick={() => { setStep(1); setError(''); }}
                            className="w-full text-center text-sm text-gray-500 hover:text-blue-600 mt-4"
                        >
                            Back to Login
                        </button>
                    )}
                </form>

                {/* Footer Links */}
                {step === 1 && (
                    <div className="mt-6 text-center">
                        <Link to="/forgot-password" className="text-[#8b91b0] hover:text-blue-600 text-sm font-medium transition">
                            Forgotten password?
                        </Link>
                    </div>
                )}

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
