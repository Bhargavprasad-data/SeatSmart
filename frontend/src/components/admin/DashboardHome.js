import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiBox, FiCalendar, FiUserCheck, FiFileText, FiTrendingUp } from 'react-icons/fi';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const statCards = [
    { icon: FiUsers, label: 'Total Students', value: stats?.totalStudents || 0, color: 'bg-blue-500' },
    { icon: FiBox, label: 'Active Rooms', value: stats?.activeRooms || 0, color: 'bg-green-500' },
    { icon: FiCalendar, label: 'Upcoming Exams', value: stats?.upcomingExams || 0, color: 'bg-yellow-500' },
    { icon: FiUserCheck, label: 'Faculty Members', value: stats?.totalFaculty || 0, color: 'bg-purple-500' },
    { icon: FiFileText, label: 'Generated Plans', value: stats?.generatedPlans || 0, color: 'bg-red-500' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-full text-white`}>
                  <Icon size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <h4 className="font-medium text-gray-800">Add New Student</h4>
            <p className="text-sm text-gray-600 mt-1">Manually add a student</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <h4 className="font-medium text-gray-800">Upload CSV/Excel</h4>
            <p className="text-sm text-gray-600 mt-1">Bulk import students</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <h4 className="font-medium text-gray-800">Generate Seating Plan</h4>
            <p className="text-sm text-gray-600 mt-1">Create new seating arrangement</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

