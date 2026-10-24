import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Users } from 'lucide-react';

const Navbar = ({ active }) => {
  const location = useLocation();
  const currentPath = active || location.pathname;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <GraduationCap size={28} className="logo-icon" />
        <span>EduMonitor</span>
      </Link>
      <div className="nav-links">
        <Link to="/" className={currentPath === '/' || currentPath === 'home' ? 'active' : ''}>
          Home
        </Link>
        <Link to="/about" className={currentPath === '/about' || currentPath === 'about' ? 'active' : ''}>
          About
        </Link>
        <Link to="/features" className={currentPath === '/features' || currentPath === 'features' ? 'active' : ''}>
          Features
        </Link>
        <a href="#contact">Contact</a>
      </div>
      <div className="nav-actions">
        <Link to="/login" className="btn-login">
          <Users size={18} /> Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
