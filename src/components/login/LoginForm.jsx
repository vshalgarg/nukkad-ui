import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';


const initialForm = { email: "", password: "" };

const LoginForm = () => {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
 const { login, submitting, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(form) || { errors: {} };
      setErrors(result.errors || {});

      if (Object.keys(result.errors || {}).length === 0) {
        setForm(initialForm);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setErrors({ general: 'An unexpected error occurred' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-96 h-96 bg-white shadow-2xl rounded-2xl p-6 flex flex-col justify-between items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-500 text-white rounded-full shadow-lg border-2 border-green-200 mb-3 animate-pulse">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Admin Login</h2>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full mt-2 shadow-sm">
            Secure Access
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-4">
          <div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 shadow-sm text-sm ${
                errors.email ? 'border-red-400' : 'border-gray-200'
              } hover:border-indigo-300 placeholder-gray-400`}
            />
            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 shadow-sm text-sm ${
                errors.password ? 'border-red-400' : 'border-gray-200'
              } hover:border-indigo-300 placeholder-gray-400`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
            {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password}</div>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-green-400 to-green-500 text-white py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-400">
          © 2025 <span className="font-semibold text-green-500">Nukkad-app</span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;