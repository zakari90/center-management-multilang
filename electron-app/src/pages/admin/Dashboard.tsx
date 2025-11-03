import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<div>Admin Dashboard - Coming Soon</div>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
}

