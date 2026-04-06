import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import DashboardHome from '../components/admin/DashboardHome';
import Students from './Students';
import Rooms from './Rooms';
import Exams from './Exams';
import Faculty from './Faculty';
import SeatingPlans from './SeatingPlans';

const AdminDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout currentPage="dashboard"><DashboardHome /></Layout>} />
      <Route path="students" element={<Layout currentPage="students"><Students /></Layout>} />
      <Route path="rooms" element={<Layout currentPage="rooms"><Rooms /></Layout>} />
      <Route path="exams" element={<Layout currentPage="exams"><Exams /></Layout>} />
      <Route path="faculty" element={<Layout currentPage="faculty"><Faculty /></Layout>} />
      <Route path="seating-plans" element={<Layout currentPage="seating-plans"><SeatingPlans /></Layout>} />
    </Routes>
  );
};

export default AdminDashboard;

