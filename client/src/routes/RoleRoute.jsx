import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Verifying Permissions...</div>;
  }

  const userRole = user?.role ? user.role.toUpperCase() : '';
  const normalizedAllowedRoles = (allowedRoles || []).map((r) => r.toUpperCase());

  return user && normalizedAllowedRoles.includes(userRole) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
};

export default RoleRoute;