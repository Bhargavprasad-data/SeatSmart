import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiBox, 
  FiCalendar, 
  FiUserCheck, 
  FiFileText,
  FiLogOut,
  FiSettings
} from 'react-icons/fi';

const Layout = ({ children, currentPage = 'dashboard' }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/admin' },
    { icon: FiUsers, label: 'Students', path: '/admin/students' },
    { icon: FiBox, label: 'Rooms', path: '/admin/rooms' },
    { icon: FiCalendar, label: 'Exams', path: '/admin/exams' },
    { icon: FiUserCheck, label: 'Faculty', path: '/admin/faculty' },
    { icon: FiFileText, label: 'Seating Plans', path: '/admin/seating-plans' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">SeatSmart</h1>
          <p className="text-sm text-blue-200">Exam Seating Planner</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.label.toLowerCase().replace(' ', '-');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-blue-800 border-r-4 border-white'
                    : 'hover:bg-blue-800'
                }`}
              >
                <Icon className="mr-3" size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-blue-200">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <FiLogOut className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 className="text-2xl font-semibold text-gray-800 capitalize">
              {currentPage.replace('-', ' ')}
            </h2>
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

