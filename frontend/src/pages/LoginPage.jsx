import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Rocket, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { handleLogin, handleRegister } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin 
      ? await handleLogin(email, password)
      : await handleRegister(email, password);

    if (!result.success) {
      setError(result.message);
    } else if (isLogin) {
      navigate('/dashboard'); // ← add this: redirect on successful login
    } else {
      alert("Registration successful! Please login.");
      setIsLogin(true);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-6 font-inter">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-emerald-400 flex items-center justify-center gap-3 italic">
          <Rocket size={40} className="text-emerald-500 fill-emerald-500/20" />
          APEX TRADER
        </h1>
        <p className="text-gray-400 mt-3 text-lg">Master the market in real-time.</p>
      </div>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="email" 
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="password" 
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-gray-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'Login to Terminal' : 'Join Apex'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-500">
          <p>
            {isLogin ? "Don't have an account?" : "Already an Apex member?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              {isLogin ? 'Register Here' : 'Login Here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;