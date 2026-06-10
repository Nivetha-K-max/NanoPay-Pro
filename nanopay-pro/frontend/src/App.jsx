import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/notifications/preferences" element={<NotificationPreferencesPage />} />
        <Route path="*" element={<div className="p-8 text-slate-600">NanoPay Pro</div>} />
      </Routes>
    </BrowserRouter>
  );
}
