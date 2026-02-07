import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManageStaff from './pages/ManageStaff';
import AdminStock from './pages/AdminStock';
import AdminSettings from './pages/AdminSettings';
import StaffDashboard from './pages/StaffDashboard';
import Stock from './pages/Stock';
import UploadVideo from './pages/UploadVideo';
import MyVideos from './pages/MyVideos';
import VideoView from './pages/VideoView';
import StaffSettings from './pages/StaffSettings';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-100">
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/staff"
                        element={
                            <ProtectedRoute role="admin">
                                <ManageStaff />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/stock"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminStock />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/settings"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminSettings />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff"
                        element={
                            <ProtectedRoute role="staff">
                                <StaffDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/upload"
                        element={
                            <ProtectedRoute role="staff">
                                <UploadVideo />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/videos"
                        element={
                            <ProtectedRoute role="staff">
                                <MyVideos />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/stock"
                        element={
                            <ProtectedRoute role="staff">
                                <Stock />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/settings"
                        element={
                            <ProtectedRoute role="staff">
                                <StaffSettings />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/view/:id" element={<VideoView />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </AuthProvider>
    );
}

export default App;
