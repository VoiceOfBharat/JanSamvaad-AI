import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, User, Home, LayoutDashboard } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-government-orange via-government-white to-government-green rounded-lg flex items-center justify-center">
              <span className="text-government-blue font-bold text-xl">JS</span>
            </div>
            <span className="text-xl font-bold text-gray-800">
              {t('welcomeTitle')}
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                {/* Dashboard Link */}
                <Link
                  to={user?.role === 'authority' ? '/authority/dashboard' : '/dashboard'}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <LayoutDashboard size={20} />
                  <span className="hidden sm:inline">{t('dashboard')}</span>
                </Link>

                {/* User Info */}
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <User size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user?.name}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">{t('logout')}</span>
                </button>
              </>
            ) : (
              <>
                {/* Home Link */}
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <Home size={20} />
                  <span className="hidden sm:inline">{t('home')}</span>
                </Link>

                {/* Login Button */}
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold transition"
                >
                  {t('login')}
                </Link>

                {/* Signup Button */}
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;