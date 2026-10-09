import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import CaptchaEarn from './pages/CaptchaEarn/CaptchaEarn.jsx';
import History from './pages/History.jsx';

function Protected({ children }) {
  const { authed } = useAuth();
  return authed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/captcha-earn" element={<Protected><CaptchaEarn /></Protected>} />
      <Route path="/history" element={<Protected><History /></Protected>} />
      <Route path="*" element={<Navigate to="/captcha-earn" replace />} />
    </Routes>
  );
}
