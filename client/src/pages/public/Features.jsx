import React from 'react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { BookOpen, Award, Video, ShieldCheck } from 'lucide-react';
import './Pages.css';

const Features = () => {
  return (
    <div className="page-container">
      <Navbar />

      {/* Core Platform Features Section */}
      <section className="core-features-section">
        <h2 className="core-features-title">Core Platform Features</h2>
        
        <div className="core-features-grid">
          {/* Card 1 */}
          <div className="core-feature-card">
            <div className="core-feature-icon blue">
              <BookOpen size={48} strokeWidth={1.5} />
            </div>
            <h3>Virtual Classroom</h3>
            <p>Organized post streams, note sharing (PDF/PPT), and dynamic comments.</p>
          </div>

          {/* Card 2 */}
          <div className="core-feature-card">
            <div className="core-feature-icon green">
              <Award size={48} strokeWidth={1.5} />
            </div>
            <h3>MCQ Evaluation</h3>
            <p>Timed online MCQ exams with instant automatic grading and answer verification.</p>
          </div>

          {/* Card 3 */}
          <div className="core-feature-card">
            <div className="core-feature-icon blue">
              <Video size={48} strokeWidth={1.5} />
            </div>
            <h3>WebRTC Live Class</h3>
            <p>Interactive video communication with low latency screen sharing.</p>
          </div>

          {/* Card 4 */}
          <div className="core-feature-card">
            <div className="core-feature-icon green">
              <ShieldCheck size={48} strokeWidth={1.5} />
            </div>
            <h3>AI Monitoring</h3>
            <p>Privacy-preserving computer vision tracking face presence and mobile phone distraction.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;