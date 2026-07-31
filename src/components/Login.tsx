import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Armchair, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(
        error.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : error.message
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      {/* Main Card Container */}
      <div className="w-full m-4 max-w-xs bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Top Header Section */}
        <div className="bg-gray-300 p-5 text-center border-b border-slate-200/80">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mx-auto shadow-sm">
            <Armchair className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-black tracking-tight">
            Event Manager
          </div>
        </div>

        {/* Form Body Section */}
        <div className="p-4">
          <div className="mb-4">
            <p className="text-md font-bold text-slate-900 mb-1">
              Sign In
            </p>
            <p className="text-xs text-slate-500">
              Welcome back! Please enter your credentials.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs text-left text-slate-700 font-medium mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-slate-700 font-medium">
                  Password
                </label>
                {/* <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Silakan hubungi Administrator untuk mereset password.');
                  }}
                  className="text-[11px] font-mono text-blue-600 hover:underline font-medium"
                >
                  Forgot Password?
                </a> */}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-1">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-black border-slate-300 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label
                htmlFor="remember_me"
                className="ml-2 text-xs text-slate-600 cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-black hover:bg-slate-800 active:bg-slate-900 text-white text-xs font-mono font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Footer Section */}
        {/* <div className="bg-[#f3f6fc] py-4 px-6 text-center border-t border-slate-200/80">
          <p className="text-xs text-slate-600">
            Need an account?{' '}
            <a
              href="mailto:admin@event.com"
              className="font-mono text-blue-600 hover:underline font-medium"
            >
              Contact Administrator
            </a>
          </p>
        </div> */}

      </div>
    </div>
  );
};