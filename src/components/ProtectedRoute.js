import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/" />;
    }

    if (role && user.role !== role) {
        // Allow admin to access staff routes, but don't allow staff to access admin routes
        if (user.role === 'admin' && role === 'staff') {
            return children;
        }
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;
