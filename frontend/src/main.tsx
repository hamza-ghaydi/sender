import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AppLayout } from './ui/AppLayout'
import EmailsPage from './pages/EmailsPage'
import EmailListsPage from './pages/EmailListsPage'
import SmtpPage from './pages/SmtpPage'
import SmtpProfilesPage from './pages/SmtpProfilesPage'
import CampaignsPage from './pages/CampaignsPage'
import SettingsPage from './pages/SettingsPage'
import SendPage from './pages/SendPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <EmailsPage /> },
      { path: 'emails', element: <EmailsPage /> },
      { path: 'email-lists', element: <EmailListsPage /> },
      { path: 'smtp', element: <SmtpPage /> },
      { path: 'smtp-profiles', element: <SmtpProfilesPage /> },
      { path: 'campaigns', element: <CampaignsPage /> },
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
