import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Video, Award, BookOpen, Users } from 'lucide-react';
import '../../styles/theme.css';

const HomePage = () => {
  return (
    <div style={{ background: 'var(--bg-light)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary-blue)' }}>
          <GraduationCap size={32} color="#1e3a8a" />
          <span>EduMonitor</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="#about" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>About</a>
          <a href="#features" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Features</a>
          <Link to="/login" style={{ textDecoration: 'none', color: 'var(--primary-blue)', fontWeight: '600' }}>Login</Link>
          <Link to="/register" style={{ textDecoration: 'none', background: 'var(--primary-blue)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px' }}>Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #1e3a8a 0%, #059669 100%)', color: '#fff' }}>
        <h1 style={{ fontSize: '2.75rem', marginBottom: '1rem', maxWidth: '800px', margin: '0 auto 1rem' }}>
          Monitoring Student Activity in a Virtual Classroom
        </h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 2rem', opacity: 0.9 }}>
          An intelligent virtual classroom platform combining online learning, academic management, live classes and AI-assisted student activity monitoring.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" style={{ background: '#ffffff', color: 'var(--primary-blue)', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            Get Started
          </Link>
          <Link to="/login" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #fff' }}>
            Student / Teacher Login
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', color: 'var(--primary-blue)' }}>Core Platform Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <FeatureCard icon={<BookOpen size={40} color="#1e3a8a" />} title="Virtual Classroom" desc="Organized post streams, note sharing (PDF/PPT), and dynamic comments." />
          <FeatureCard icon={<Award size={40} color="#059669" />} title="MCQ Evaluation" desc="Timed online MCQ exams with instant automatic grading and answer verification." />
          <FeatureCard icon={<Video size={40} color="#1e3a8a" />} title="WebRTC Live Class" desc="Interactive video communication with low latency screen sharing." />
          <FeatureCard icon={<ShieldCheck size={40} color="#059669" />} title="AI Monitoring" desc="Privacy-preserving computer vision tracking face presence and mobile phone distraction." />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
    <div style={{ marginBottom: '1rem' }}>{icon}</div>
    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-dark)' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{desc}</p>
  </div>
);

export default HomePage;