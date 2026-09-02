import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  CalendarCheck,
  Award,
  Video,
  BarChart3,
  User,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

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

  return (
    <aside style={{
      width: '240px',
      background: '#ffffff',
      borderRight: '1px solid var(--border-color)',
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.5rem 0.75rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.95rem',
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-blue)' : 'transparent',
              transition: 'all 0.2s ease'
            })}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      <button
        onClick={logout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: 'none',
          background: '#fef2f2',
          color: 'var(--danger-red)',
          fontWeight: '600',
          fontSize: '0.95rem',
          cursor: 'pointer',
          marginTop: 'auto'
        }}
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;