import React from 'react';
import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, GraduationCap, LogOut } from 'lucide-react';

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Classroom Assistant</title>
        <meta name="description" content="Learning platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="min-h-screen relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/imgs/dashboard.png')`
          }}
        >
          <div className="absolute inset-0 bg-white/20"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                  <GraduationCap className="inline-block w-6 h-6 sm:w-7 sm:h-7 mr-2 text-indigo-600" />
                  Classroom Assistant
                </h1>
              </div>
              
              <nav className="flex items-center space-x-8">
                {user ? (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="hidden sm:block text-sm text-gray-700">
                      {user.name}
                    </span>
                    <button
                      onClick={logout}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                    >
                      <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2 sm:space-x-3">
                    <a
                      href="/login"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    >
                      Login
                    </a>
                    <a
                      href="/register-teacher"
                      className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium border border-gray-300 transition-colors"
                    >
                      Register
                    </a>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center w-full max-w-4xl">
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent sm:text-4xl lg:text-5xl xl:text-6xl mb-6">
                Awesome Classroom Platform
              </h2>
              <p className="text-base sm:text-lg text-white max-w-3xl mx-auto mb-8" style={{
                textShadow: '1px 1px 2px rgba(59, 130, 246, 0.6), 1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}>
                Manage dynamic courses and track student progress efficiently
              </p>
              
              {/* Buttons moved to main content area */}
              {!user && (
                <div className="flex flex-col items-center space-y-4 sm:space-y-6 w-full max-w-md mx-auto">
                  <a
                    href="/register-teacher"
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:text-white px-8 sm:px-16 py-4 sm:py-6 rounded-2xl text-lg sm:text-2xl font-bold transition-all duration-300 hover:scale-105 sm:hover:scale-110 shadow-2xl hover:shadow-3xl border-2 border-purple-400 hover:border-purple-300 text-center"
                  >
                    Start Your Path
                  </a>
                  
                  <div className="flex items-center space-x-2 sm:space-x-4 w-full">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent flex-1"></div>
                    <span className="text-gray-500 font-medium text-sm sm:text-base">or</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent flex-1"></div>
                  </div>
                  
                  <a
                    href="/login"
                    className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-700 px-6 sm:px-12 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl border-2 border-gray-300 hover:border-gray-400 text-center"
                  >
                    Continue It
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Section - Only for logged in users */}
          <div className="flex-shrink-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-8">
            <div className="text-center">
              {user ? (
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                    Hi {user.name}!</p>
                  <a
                    href={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student'}
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Go to Dashboard
                  </a>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg text-white mb-4" style={{
                    textShadow: '1px 1px 2px rgba(59, 130, 246, 0.6), 1px 1px 2px rgba(0, 0, 0, 0.8)'
                  }}>
                    Welcome to Classroom Assistant
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
