import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Layout from './Layout';

const PrivateRoute = () => {
  const { token } = useContext(AuthContext);
  if (!token) {
    return <Navigate to="/login" />;
  }

  // This is the key: wrap the page content (Outlet) with the Layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default PrivateRoute;