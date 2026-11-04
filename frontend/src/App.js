import React, { useEffect, Suspense, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { toggle } from './store/themeSlice';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from './contexts/AuthContext';

const Home = React.lazy(() => import('./pages/Home'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const CreatePost = React.lazy(() => import('./pages/CreatePost'));
const AuthorDashboard = React.lazy(() => import('./pages/AuthorDashboard'));
const CreateCategory = React.lazy(() => import('./pages/CreateCategory'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Help = React.lazy(() => import('./pages/Help'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto mt-12 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-sm">Please refresh the page or try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const theme = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext);

  const AuthorOnlyRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (String(user.role || '').trim().toLowerCase() !== 'author') {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    dispatch(toggle());
  };

  return (
    <div
      className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100`}
    >
      <ToastContainer />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="mx-auto min-h-[calc(100vh-80px)] max-w-[1600px] bg-gray-50 px-4 py-8 transition-colors duration-300 dark:bg-slate-950">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center text-center text-gray-600 dark:text-slate-300">
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  Loading page...
                </div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<AuthorOnlyRoute><AuthorDashboard /></AuthorOnlyRoute>} />
              <Route path="/posts/:slug" element={<PostDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/help" element={<Help />} />
              <Route path="/create" element={<AuthorOnlyRoute><CreatePost /></AuthorOnlyRoute>} />
              <Route path="/category" element={<AuthorOnlyRoute><CreateCategory /></AuthorOnlyRoute>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
