import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import '../components/layout/Layouts.css';

export default function DashboardLayout() {
  return (
    <div className="dashboard-shell">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
