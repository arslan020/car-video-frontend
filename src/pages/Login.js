import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Logo from '../assets/business-logo.png';
import './Login.css';

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
        <div className="loginPage">
            <div className="loginWrap">
                {/* Logo */}
                <div className="loginLogo">
                    <img src={Logo} alt="Heston Automotive" />
                </div>

                {/* Heading */}
                <h2 className="loginHeading">
                    {step === 1 ? 'Sign In To Your' : 'Verify Your'}<br />
                    {step === 1 ? 'Account' : 'Identity'}
                </h2>

                {/* Form */}
                <form onSubmit={handleSubmit} className="loginForm">
                    {error && (
                        <div className="loginError">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <>
                            <div className="inputGroup">
                                <input
                                    type="text"
                                    placeholder="Username or Email"
                                    className="inputMinimal"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="inputGroup">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="inputMinimal"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div className="inputGroup">
                            <p className="otpInfoText">
                                Please enter the verification code sent to your email.
                            </p>
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                className="inputMinimal otpInput"
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
                        className="btnMinimal"
                    >
                        {loading ? 'Processing...' : (step === 1 ? 'Login' : 'Verify Code')}
                    </button>

                    {step === 2 && (
                        <button
                            type="button"
                            onClick={() => { setStep(1); setError(''); }}
                            className="backBtn"
                        >
                            Back to Login
                        </button>
                    )}
                </form>

                {/* Footer Links */}
                {step === 1 && (
                    <div className="loginLinks">
                        <Link to="/forgot-password">
                            Forgotten password?
                        </Link>
                    </div>
                )}

                {/* Watermark */}
                <div className="loginWatermark">
                    <div className="markDot"></div>
                    <p className="markName">Heston Automotive</p>
                    <p className="markCopy">© 2025</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
