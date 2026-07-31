import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout({ titulo }) {
  return (
    <div className="min-h-screen bg-base-bg">
      <Sidebar />
      <div className="ml-64">
        <Header titulo={titulo} />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}