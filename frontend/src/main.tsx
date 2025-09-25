import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AppLayout } from './ui/AppLayout'
import EmailsPage from './pages/EmailsPage'
import SmtpPage from './pages/SmtpPage'
import SettingsPage from './pages/SettingsPage'
import SendPage from './pages/SendPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <EmailsPage /> },
      { path: 'emails', element: <EmailsPage /> },
      { path: 'smtp', element: <SmtpPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'send', element: <SendPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
