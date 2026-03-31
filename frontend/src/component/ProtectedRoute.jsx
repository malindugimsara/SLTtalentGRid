import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Local storage eke 'token' eka thiyenawada kiyala check karanawa
  const token = localStorage.getItem('token');

  // Token eka nattam (login wela nattam), kelinma Login page ekata yawanawa
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token eka thiyenawanam, yanna hadapu page eka (children) pennanawa
  return children;
};

export default ProtectedRoute;