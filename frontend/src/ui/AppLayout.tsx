import { NavLink, Outlet } from 'react-router-dom'
import './layout.css'

export function AppLayout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1 className="brand">Sender</h1>
        <nav>
          <NavLink to="/emails" className={({ isActive }) => isActive ? 'active' : ''}>Email List</NavLink>
          <NavLink to="/smtp" className={({ isActive }) => isActive ? 'active' : ''}>SMTP Profiles</NavLink>
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


