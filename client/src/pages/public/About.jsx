import React from 'react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { 
  ShieldCheck, Settings, BarChart2, 
  Eye, Lightbulb, Star, Users
} from 'lucide-react';
import './Pages.css';

import missionImage from '../../assets/img1.png';
import studentsImage from '../../assets/img2.png';

const About = () => {
  return (
    <div className="page-container">
      <Navbar />

      {/* About Hero Section */}
      <header className="about-hero">
        <div className="about-hero-content">
          <h1 className="hero-title">About EduMonitor</h1>
          <p className="hero-desc">Empowering Education Through Technology</p>
        </div>
      </header>

      {/* Our Mission Section */}
      <section className="about-section split-layout">
        <div className="split-image">
          {/* Using a placeholder campus image, replace with your local asset if needed */}
          <img src={missionImage} alt="Campus Building" />
        </div>
        <div className="split-content">
          <h2>Our Mission</h2>
          <p>
            EduMonitor is built with a simple mission — to create a smarter, safer and more engaging 
            virtual learning environment for students, teachers and educational institutions.
          </p>
          <ul className="mission-list">
            <li>
              <ShieldCheck size={20} className="list-icon" />
              <span>Ensure academic integrity</span>
            </li>
            <li>
              <Settings size={20} className="list-icon" />
              <span>Simplify class management</span>
            </li>
            <li>
              <BarChart2 size={20} className="list-icon" />
              <span>Enable data-driven decisions</span>
            </li>
          </ul>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="about-section split-layout reverse">
        <div className="split-image">
          {/* Using a placeholder students image, replace with your local asset if needed */}
          <img src={studentsImage} alt="Students studying together" />
        </div>
        <div className="split-content">
          <h2>What We Do</h2>
          <p>
            We provide an intelligent virtual classroom platform that combines live class monitoring, 
            AI-assisted analytics and easy-to-use tools for academic management.
          </p>
        </div>
      </section>

      {/* Our Vision Banner */}
      <section className="vision-section">
        <div className="vision-banner">
          <div className="vision-icon-wrapper">
            <Eye size={40} />
          </div>
          <div className="vision-text">
            <h2>Our Vision</h2>
            <p>
              To become a leading EdTech platform that transforms traditional learning into an 
              interactive, safe and technology-driven experience for every learner.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="values-section">
        <h2 className="section-title">Our Values</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon blue"><ShieldCheck size={32} /></div>
            <h3>Integrity</h3>
            <p>We believe in honesty and fairness.</p>
          </div>
          <div className="value-card">
            <div className="value-icon green"><Lightbulb size={32} /></div>
            <h3>Innovation</h3>
            <p>We embrace new ideas and technology.</p>
          </div>
          <div className="value-card">
            <div className="value-icon purple"><Users size={32} /></div>
            <h3>Collaboration</h3>
            <p>We grow stronger together.</p>
          </div>
          <div className="value-card">
            <div className="value-icon blue-light"><Star size={32} /></div>
            <h3>Excellence</h3>
            <p>We strive for the best in everything we do.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;