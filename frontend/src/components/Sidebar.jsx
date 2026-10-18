import { Link, useLocation } from 'react-router-dom'
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
  Users
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import StatusPill from './StatusPill'

export default function Sidebar({ currentTab, onTabSelect }) {
  const { user, role, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const path = location.pathname

  // Helper for tab-based clicks if on the same page
  function handleNav(tabKey, targetPath) {
    if (onTabSelect && path === targetPath) {
      onTabSelect(tabKey)
    }
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="brand-link">
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={24} /></div>
          <div>
            <strong>Scholarship Expert</strong>
            <small>{role === 'admin' ? 'ADMIN CONTROL CENTER' : 'DISCOVERY & GUIDANCE'}</small>
          </div>
        </div>
      </Link>

      <div className="side-label">NAVIGATION</div>

      {/* STUDENT NAVIGATION (Strictly Discovery & Guidance Only - No AI Jargon) */}
      {isAuthenticated && role === 'student' && (
        <>
          <Link
            to="/student/dashboard?tab=overview"
            onClick={() => handleNav('overview', '/student/dashboard')}
            className={`nav-item ${path === '/student/dashboard' && (!currentTab || currentTab === 'overview') ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link
            to="/student/dashboard?tab=profile"
            onClick={() => handleNav('profile', '/student/dashboard')}
            className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
          >
            <User size={18} /> My Profile
          </Link>
          <Link
            to="/student/dashboard?tab=eligible"
            onClick={() => handleNav('eligible', '/student/dashboard')}
            className={`nav-item ${currentTab === 'eligible' ? 'active' : ''}`}
          >
            <Award size={18} /> Eligible Scholarships
          </Link>
          <Link
            to="/student/dashboard?tab=improve"
            onClick={() => handleNav('improve', '/student/dashboard')}
            className={`nav-item ${currentTab === 'improve' ? 'active' : ''}`}
          >
            <TrendingUp size={18} /> Actionable Guidance
          </Link>
          <Link
            to="/student/dashboard?tab=tracker"
            onClick={() => handleNav('tracker', '/student/dashboard')}
            className={`nav-item ${currentTab === 'tracker' ? 'active' : ''}`}
          >
            <FileCheck2 size={18} /> Application Tracker
          </Link>
          <Link
            to="/student/dashboard?tab=notifications"
            onClick={() => handleNav('notifications', '/student/dashboard')}
            className={`nav-item ${currentTab === 'notifications' ? 'active' : ''}`}
          >
            <History size={18} /> Deadlines &amp; Alerts
          </Link>
          <Link
            to="/student/dashboard?tab=history"
            onClick={() => handleNav('history', '/student/dashboard')}
            className={`nav-item ${currentTab === 'history' ? 'active' : ''}`}
          >
            <History size={18} /> Evaluation History
          </Link>
        </>
      )}

      {/* ADMIN NAVIGATION (Full AI Control Center & Management) */}
      {isAuthenticated && role === 'admin' && (
        <>
          <Link
            to="/admin/dashboard?tab=overview"
            onClick={() => handleNav('overview', '/admin/dashboard')}
            className={`nav-item ${path === '/admin/dashboard' && (!currentTab || currentTab === 'overview') ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} /> Admin Dashboard
          </Link>
          <Link
            to="/admin/dashboard?tab=schemes"
            onClick={() => handleNav('schemes', '/admin/dashboard')}
            className={`nav-item ${currentTab === 'schemes' ? 'active' : ''}`}
          >
            <BookOpenCheck size={18} /> Scholarship Management
          </Link>
          <Link
            to="/admin/dashboard?tab=rules"
            onClick={() => handleNav('rules', '/admin/dashboard')}
            className={`nav-item ${currentTab === 'rules' ? 'active' : ''}`}
          >
            <Settings size={18} /> Eligibility Rules
          </Link>
          <Link
            to="/admin/algorithms"
            className={`nav-item ${path === '/admin/algorithms' ? 'active' : ''}`}
          >
            <Sparkles size={18} /> AI Control Center
          </Link>
          <Link
            to="/admin/dashboard?tab=analytics"
            onClick={() => handleNav('analytics', '/admin/dashboard')}
            className={`nav-item ${currentTab === 'analytics' ? 'active' : ''}`}
          >
            <TrendingUp size={18} /> Evaluation Analytics
          </Link>
          <Link
            to="/admin/dashboard?tab=verification"
            onClick={() => handleNav('verification', '/admin/dashboard')}
            className={`nav-item ${currentTab === 'verification' ? 'active' : ''}`}
          >
            <ShieldCheck size={18} /> Source Verification
          </Link>
        </>
      )}

      {/* PUBLIC VISITOR NAVIGATION */}
      {!isAuthenticated && (
        <>
          <div className="side-label">ACCESS PORTALS</div>
          <Link to="/student/login" className={`nav-item ${path === '/student/login' ? 'active' : ''}`}>
            <User size={18} /> Student Login
          </Link>
          <Link to="/admin/login" className={`nav-item ${path === '/admin/login' ? 'active' : ''}`}>
            <ShieldCheck size={18} /> Admin Login
          </Link>
          <Link to="/student/register" className={`nav-item ${path === '/student/register' ? 'active' : ''}`}>
            <Users size={18} /> Student Register
          </Link>
        </>
      )}

      <div className="sidebar-bottom">
        {isAuthenticated ? (
          <div className="user-profile-widget">
            <div className="user-info-row">
              <div className={`user-avatar ${role === 'admin' ? 'admin-avatar' : ''}`}>
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <strong>{user.full_name}</strong>
                <StatusPill status={role} />
              </div>
            </div>
            <button className="logout-btn" onClick={logout} title="Sign Out">
              <LogOut size={15} /> <span>Sign out</span>
            </button>
          </div>
        ) : (
          <div className="ai-status">
            <span className="status-dot" />
            <div>
              <strong>Service active</strong>
              <small>Scholarship Discovery</small>
            </div>
          </div>
        )}
        <small className="version">PROJECT BUILD 2.0.0</small>
      </div>
    </aside>
  )
}
