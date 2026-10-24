import React, { useContext, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  CalendarCheck,
  Award,
  BarChart3,
  User,
  LogOut,
  X,
  GraduationCap
} from 'lucide-react';
import './Layouts.css';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const isTeacher = user?.role === 'TEACHER';

  const sidebarRef = useRef(null);
  const closeBtnRef = useRef(null);

  const navItems = isTeacher
    ? [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'My Classes', path: '/classes', icon: <BookOpen size={20} /> },
        { name: 'Assignments', path: '/assignments', icon: <FileCheck size={20} /> },
        { name: 'Attendance', path: '/attendance', icon: <CalendarCheck size={20} /> },
        { name: 'Academic Records', path: '/academic-records', icon: <Award size={20} /> },
        { name: 'Monitoring Reports', path: '/monitoring-reports', icon: <BarChart3 size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> }
      ]
    : [
        { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Joined Classes', path: '/classes', icon: <BookOpen size={20} /> },
        { name: 'Assignments', path: '/assignments', icon: <FileCheck size={20} /> },
        { name: 'My Attendance', path: '/attendance', icon: <CalendarCheck size={20} /> },
        { name: 'Academic Marks', path: '/academic-records', icon: <Award size={20} /> },
        { name: 'My Progress', path: '/progress', icon: <BarChart3 size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> }
      ];

  // Focus trap for mobile drawer when opened
  useEffect(() => {
    if (!isSidebarOpen) return;

    // Focus close button initially
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleFocusTrap = (e) => {
      if (e.key !== 'Tab' || !sidebarRef.current) return;

      const focusableElements = sidebarRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleFocusTrap);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isSidebarOpen]);

  const handleNavLinkClick = () => {
    closeSidebar();
  };

  const handleLogoutClick = () => {
    closeSidebar();
    logout();
  };

  return (
    <>
      {/* Dimmed backdrop for mobile drawer */}
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        id="sidebar-drawer"
        ref={sidebarRef}
        className={`sidebar ${isTeacher ? 'sidebar--teacher' : 'sidebar--student'} ${
          isSidebarOpen ? 'sidebar--open' : ''
        }`}
        aria-label="Navigation Menu"
        aria-modal={isSidebarOpen ? 'true' : undefined}
      >
        {/* Mobile-only Drawer Header */}
        <div className="sidebar-mobile-header">
          <div className="sidebar-mobile-brand">
            <GraduationCap size={24} color={isTeacher ? 'var(--academic-green)' : 'var(--primary-blue)'} />
            <span className="sidebar-mobile-title">EduMonitor</span>
            <span className={`sidebar-role-badge ${isTeacher ? 'sidebar-role-badge--teacher' : ''}`}>
              {user?.role?.toLowerCase()}
            </span>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeSidebar}
            className="sidebar-close-btn"
            aria-label="Close navigation sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" role="navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavLinkClick}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="sidebar-logout"
          aria-label="Logout of account"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
