import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">
            <GraduationCap size={24} />
            <span>EduMonitor</span>
          </div>
          <p>Virtual classroom platform for smarter learning and academic management.</p>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
          </div>
        </div>
        
        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <a href="#contact">Contact</a>
        </div>

        <div className="footer-links">
          <h4>Our Services</h4>
          <a href="#">Student Monitoring</a>
          <a href="#">Class Management</a>
          <a href="#">AI Analytics</a>
        </div>

        <div className="footer-contact">
          <h4>Contact Us</h4>
          <p><Mail size={16} /> support@edumonitor.com</p>
          <p><Phone size={16} /> +91 98765 43210</p>
          <p><MapPin size={16} /> Nagpur, Maharashtra</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2026 EduMonitor. All rights reserved.</p>
        <div className="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
