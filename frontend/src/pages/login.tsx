import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';
import PasswordInput from '../components/common/PasswordInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login({ email, password });
      
      if (success) {
        // Redirect based on user role
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'teacher') {
          router.push('/teacher');
        } else if (user.role === 'student') {
          router.push('/student');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Classroom Assistant</title>
        <meta name="description" content="Login to Classroom Assistant" />
      </Head>
      
      <div className="min-h-screen relative overflow-hidden">
        {/* Background with Dot Texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>
          <div className="absolute inset-0 bg-white/50"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-white/90 backdrop-blur-md border-2 border-indigo-200 rounded-2xl p-8 shadow-2xl">
              <div>
                <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Sign in to access your classroom
                </p>
              </div>
              
                  <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <PasswordInput
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>

                <div className="text-center">
                  <a
                    href="/register-teacher"
                    className="font-semibold text-indigo-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    New teacher? Start your journey here
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
