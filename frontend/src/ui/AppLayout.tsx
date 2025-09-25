import { NavLink, Outlet } from 'react-router-dom'
import './layout.css'

export function AppLayout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1 className="brand">Sender</h1>
        <nav>
          <NavLink to="/emails" className={({ isActive }) => isActive ? 'active' : ''}>Email List</NavLink>
          <NavLink to="/email-lists" className={({ isActive }) => isActive ? 'active' : ''}>Email Lists</NavLink>
          <NavLink to="/smtp-profiles" className={({ isActive }) => isActive ? 'active' : ''}>SMTP Profiles</NavLink>
          <NavLink to="/campaigns" className={({ isActive }) => isActive ? 'active' : ''}>Campaigns</NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>Settings</NavLink>
          <NavLink to="/send" className={({ isActive }) => isActive ? 'active' : ''}>Send</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout


