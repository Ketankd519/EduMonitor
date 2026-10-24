import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicStats } from '../../api/dashboardApi';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { 
  GraduationCap, Monitor, ClipboardCheck, Video, ShieldCheck, Users, 
  ChevronRight, ChevronLeft,
  Zap, Award, Cpu, Star
} from 'lucide-react';
import './Pages.css';

// Testimonials Data Array
const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "B.Tech Student, JD College",
    quote: "EduMonitor has made our online classes more interactive and secure. It really helps me stay focused and learn better!",
    image: "https://ui-avatars.com/api/?name=Priya+Sharma&background=E0F2FE&color=0284C7"
  },
  {
    id: 2,
    name: "Rahul Patil",
    role: "MCA Student, Nagpur",
    quote: "The virtual classroom and online assessments make learning easier. I can access study materials and track my progress in one place.",
    image: "https://ui-avatars.com/api/?name=Rahul+Patil&background=ECFDF5&color=10B981"
  },
  {
    id: 3,
    name: "Sneha Deshmukh",
    role: "Computer Science Student",
    quote: "EduMonitor provides a smooth online learning experience. Live classes and instant exam results make studying more convenient.",
    image: "https://ui-avatars.com/api/?name=Sneha+Deshmukh&background=F5F3FF&color=8B5CF6"
  },
  {
    id: 4,
    name: "Amit Verma",
    role: "BCA Student",
    quote: "I like how everything is organized in one platform. It saves time and helps me stay connected with my teachers and classmates.",
    image: "https://ui-avatars.com/api/?name=Amit+Verma&background=FFFBEB&color=F59E0B"
  },
  {
    id: 5,
    name: "Neha Kulkarni",
    role: "Assistant Professor",
    quote: "EduMonitor simplifies classroom management and student assessments. It helps us organize learning activities and monitor participation more efficiently.",
    image: "https://ui-avatars.com/api/?name=Neha+Kulkarni&background=FDF2F8&color=EC4899"
  },
  {
    id: 6,
    name: "Rohan Mehta",
    role: "Faculty Member",
    quote: "The online examination system makes assessments easier to conduct and evaluate. It gives teachers more time to focus on student development.",
    image: "https://ui-avatars.com/api/?name=Rohan+Mehta&background=EFF6FF&color=3B82F6"
  },
  {
    id: 7,
    name: "Anjali Rao",
    role: "Academic Coordinator",
    quote: "EduMonitor brings classroom activities, assessments, and student monitoring together in one place, supporting a more organized academic environment.",
    image: "https://ui-avatars.com/api/?name=Anjali+Rao&background=F0FDFA&color=14B8A6"
  },
  {
    id: 8,
    name: "Vikram Joshi",
    role: "Education Technology User",
    quote: "With live classes, digital assessments, and AI-assisted monitoring, EduMonitor offers a convenient way to support modern teaching and learning.",
    image: "https://ui-avatars.com/api/?name=Vikram+Joshi&background=E0F2FE&color=0284C7"
  }
];

const HomePage = () => {
  // State to track current testimonial index
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Handlers for Next and Prev buttons
  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  // Get active testimonial data
  const activeTestimonial = testimonials[currentTestimonialIndex];

  const [stats, setStats] = useState(null);
  const [animatedStats, setAnimatedStats] = useState({
    students: 0,
    teachers: 0,
    users: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // Fetch actual counts from the public dashboard endpoint.
  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const response = await getPublicStats();
        const result = response.data;

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Invalid homepage statistics response');
        }

        if (!cancelled) {
          setStats({
            students: Number(result.data.students) || 0,
            teachers: Number(result.data.teachers) || 0,
            users: Number(result.data.users) || 0,
          });
          setStatsError(false);
          setStatsLoading(false);
        }
      } catch (error) {
        console.error('Homepage statistics error:', error);
        if (!cancelled) {
          setStatsError(true);
          setStatsLoading(false);
        }
      }
    };

    fetchStats();

    // Refresh counts every 30 seconds.
    const refreshInterval = setInterval(fetchStats, 30000);

    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
    };
  }, []);

  // Animate counters upward from 0 to actual value when stats load or change
  useEffect(() => {
    if (!stats) return;

    const duration = 1200;
    const startTime = performance.now();
    const startValues = { ...animatedStats };
    let animationFrameId;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo function for smooth deceleration
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setAnimatedStats({
        students: Math.round(startValues.students + (stats.students - startValues.students) * easeProgress),
        teachers: Math.round(startValues.teachers + (stats.teachers - startValues.teachers) * easeProgress),
        users: Math.round(startValues.users + (stats.users - startValues.users) * easeProgress),
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [stats]);

  return (
    <div className="home-container">
      <Navbar />

      {/* Hero Section */}
      <header className="hero-section" id="home">
        <div className="hero-content">
          <p className="hero-eyebrow">EDUCATION • MONITORING • BETTER TOMORROW</p>
          <h1 className="hero-title">Monitor • Learn • <span>Excel</span></h1>
          <h2 className="hero-subtitle">Smart Virtual Classroom for a Better Learning Experience</h2>
          <p className="hero-desc">
            EduMonitor helps institutions track student activity, manage classes and ensure academic integrity through AI-powered monitoring and real-time insights.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">
              <Monitor size={18} /> Get Started
            </Link>
            <Link to="/about" className="btn-outline">
              <GraduationCap size={18} /> Learn More
            </Link>
          </div>
        </div>
      </header>

      {/* Community Section */}
      <section className="community-section" id="about">
        <div className="section-header">
          <span className="section-eyebrow">OUR COMMUNITY</span>
          <h2 className="section-title">Growing Together</h2>
          <p className="section-subtitle">Students, teachers and users — all working towards a smarter and more connected learning environment.</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card stat-blue">
            <div className="stat-icon-wrapper"><Users size={32} /></div>
            <h3>
              {statsLoading ? '...' : statsError ? '—' : `${animatedStats.students.toLocaleString()}+`}
            </h3>
            <h4>Students</h4>
            <p>Active learners and future leaders.</p>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon-wrapper"><Monitor size={32} /></div>
            <h3>
              {statsLoading ? '...' : statsError ? '—' : `${animatedStats.teachers.toLocaleString()}+`}
            </h3>
            <h4>Teachers</h4>
            <p>Guiding, supporting and inspiring.</p>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon-wrapper"><Users size={32} /></div>
            <h3>
              {statsLoading ? '...' : statsError ? '—' : `${animatedStats.users.toLocaleString()}+`}
            </h3>
            <h4>Total Users</h4>
            <p>Admins, staff and more working together.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-eyebrow">OUR FEATURES</span>
          <h2 className="section-title">Everything You Need in One Platform</h2>
          <p className="section-subtitle">Powerful tools to ensure effective learning, monitoring and management.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue"><Monitor size={28} /></div>
            <h3>Virtual Classroom</h3>
            <p>Organized live classes with screen sharing, notes and interactive tools.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green"><ClipboardCheck size={28} /></div>
            <h3>MCQ Evaluation</h3>
            <p>Timed online MCQ exams with instant grading and answer verification.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple"><Video size={28} /></div>
            <h3>WebRTC Live Class</h3>
            <p>Interactive video communication with low latency screen sharing.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon orange"><ShieldCheck size={28} /></div>
            <h3>AI Monitoring</h3>
            <p>Privacy-preserving computer vision tracking face presence and mobile phone distraction.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon pink"><Users size={28} /></div>
            <h3>Student & Teacher Portal</h3>
            <p>Manage classes, track progress, assignments and performance in one place.</p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <div className="cta-icon"><GraduationCap size={40} /></div>
          <div className="cta-text">
            <h3>Education is the key to a brighter future.</h3>
            <p>Let's build a better learning environment together.</p>
          </div>
        </div>
        <Link to="/register" className="btn-white">
          Get Started <ChevronRight size={18} />
        </Link>
      </section>

      {/* Why Choose Section */}
      <section className="why-choose-section">
        <div className="section-header">
          <span className="section-eyebrow">WHY CHOOSE EDUMONITOR?</span>
          <h2 className="section-title">Built for Smarter Learning</h2>
          <p className="section-subtitle">Modern technology, simple tools, and powerful features — designed for students, teachers and institutions.</p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon blue"><ShieldCheck size={24} /></div>
            <h4>Secure & Reliable</h4>
            <p>Ensures data privacy and secure access for all users.</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon green"><Zap size={24} /></div>
            <h4>Easy to Use</h4>
            <p>Simple interface for a seamless experience.</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon purple"><Award size={24} /></div>
            <h4>Better Learning Outcomes</h4>
            <p>Helps maintain discipline and improve academic performance.</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon teal"><Cpu size={24} /></div>
            <h4>Real-time Insights</h4>
            <p>Track live activity and stay informed at all times.</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon blue-light"><Star size={24} /></div>
            <h4>AI-Powered Insights</h4>
            <p>Intelligent tracking for smarter decisions.</p>
          </div>
        </div>
      </section>

      {/* Dynamic Testimonial Section */}
      <section className="testimonial-section">
        <div className="testimonial-card">
          <div className="testimonial-image">
            <img src={activeTestimonial.image} alt={activeTestimonial.name} />
          </div>
          <div className="testimonial-content">
            <p className="quote">"{activeTestimonial.quote}"</p>
            <div className="author-info">
              <h4>{activeTestimonial.name}</h4>
              <p>{activeTestimonial.role}</p>
            </div>
          </div>
          <div className="testimonial-controls">
            <button className="control-btn" onClick={handlePrevTestimonial}>
              <ChevronLeft size={20} />
            </button>
            <button className="control-btn" onClick={handleNextTestimonial}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;