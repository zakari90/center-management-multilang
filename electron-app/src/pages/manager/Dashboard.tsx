import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

export default function ManagerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<div>Manager Dashboard - Coming Soon</div>} />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Routes>
    </div>
  );
}

