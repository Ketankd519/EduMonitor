import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useLiveTicker } from '../../context/LiveTickerContext';
import { GraduationCap, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import NavbarTicker from './NavbarTicker';
import NotificationBell from './NotificationBell';
import './Layouts.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isSidebarOpen, toggleSidebar, hamburgerRef } = useSidebar();
  const { liveItems } = useLiveTicker();

  const isStudent = user?.role === 'STUDENT';
  const hasLiveItems = isStudent && liveItems && liveItems.length > 0;

  return (
    <header className="navbar-header">
      <nav className="navbar" role="navigation" aria-label="Main Navigation">
        {/* Left Section: Mobile Hamburger Button & Brand Logo */}
        <div className="navbar-left">
          <button
            ref={hamburgerRef}
            type="button"
            onClick={toggleSidebar}
            className="navbar-hamburger"
            aria-label={isSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar-drawer"
          >
            <Menu size={22} aria-hidden="true" />
          </button>

          <Link to={user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'} className="navbar-brand">
            <GraduationCap size={32} color="var(--primary-blue)" />
            <span className="navbar-title">EduMonitor</span>
          </Link>
        </div>

        {/* Center Section: Desktop Live Notification Ticker (Student only) */}
        {isStudent && (
          <div className="navbar-center-ticker">
            <NavbarTicker mode="desktop" />
          </div>
        )}

        {/* Right Section: Notification Bell, User Avatar, Name/Role, and Logout */}
        <div className="navbar-actions">
          <NotificationBell />

          <div className="navbar-user-section">
            <Link to="/profile" className="navbar-avatar-link" title="My Profile">
              <div className="navbar-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
              </div>
            </Link>

            <div className="navbar-user-info">
              <span className="navbar-user-name">{user?.name}</span>
              <span className="navbar-user-role">{user?.role?.toLowerCase()}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="navbar-logout"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slim Ticker Row: Rendered underneath navbar only when live items exist on student view */}
      {hasLiveItems && (
        <div className="navbar-mobile-ticker-row">
          <NavbarTicker mode="mobile" />
        </div>
      )}
    </header>
  );
};

export default Navbar;
