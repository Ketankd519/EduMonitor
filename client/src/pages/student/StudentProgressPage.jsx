
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import './style.css';

const StudentProgressPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const fetchStudentProgress = async () => {
    try {
      const res = await API.get('/monitoring/student/progress');
      setData(res.data.analytics);
    } catch (err) {
      console.error('Error fetching progress metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { metric: 'Attendance', score: data?.attendanceScore ?? 100 },
    { metric: 'AI Attention', score: data?.attentionScore ?? 100 },
    { metric: 'MCQ Assignments', score: data?.assignmentScore ?? 0 },
    { metric: 'Academic Records', score: data?.academicScore ?? 0 },
  ];

  return (
    <div className="student-progress-page">
      <Navbar />

      <div className="student-progress-layout">
        <Sidebar />

        <main className="student-progress-main">
          <div className="student-progress-header">
            <h1 className="student-progress-title">
              Personal Progress Analytics
            </h1>

            <p className="student-progress-subtitle">
              Real-time overview of your attendance, AI attention score,
              assignments, and academics
            </p>
          </div>

          {loading ? (
            <div className="student-progress-loading">
              <div className="student-progress-spinner" />
              <p>Loading analytics...</p>
            </div>
          ) : (
            <div className="student-progress-grid">
              <div className="student-progress-metrics">
                <MetricCard
                  title="Overall Attendance"
                  score={`${data?.attendanceScore ?? 100}%`}
                  desc="Calculated from physical and live virtual sessions."
                  color="#059669"
                />

                <MetricCard
                  title="AI Attention Average"
                  score={`${data?.attentionScore ?? 100}%`}
                  desc="Evaluated via camera gaze alignment and focus metrics."
                  color="#1e3a8a"
                />

                <MetricCard
                  title="Assignment Performance"
                  score={`${data?.assignmentScore ?? 0}%`}
                  desc="Average score across submitted MCQ tests."
                  color="#d97706"
                />

                <MetricCard
                  title="Academic Ledger Total"
                  score={`${data?.academicScore ?? 0} pts`}
                  desc="Cumulative internal and examination record grade."
                  color="#0284c7"
                />
              </div>

              <section className="student-progress-chart-card">
                <h3 className="student-progress-chart-title">
                  Competency Radar
                </h3>

                <div className="student-progress-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />

                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#475569', fontSize: 12 }}
                      />

                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                      />

                      <Radar
                        name="Performance"
                        dataKey="score"
                        stroke="#1e3a8a"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <p className="student-progress-chart-note">
                  Compare your performance across four learning areas.
                </p>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const MetricCard = ({ title, score, desc, color }) => (
  <div className="student-progress-metric-card">
    <div className="student-progress-metric-info">
      <span className="student-progress-metric-title">{title}</span>
      <p className="student-progress-metric-description">{desc}</p>
    </div>

    <div
      className="student-progress-metric-score"
      style={{ color }}
    >
      {score}
    </div>
  </div>
);

export default StudentProgressPage;
