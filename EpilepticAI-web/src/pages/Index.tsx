import { ArrowRight, Moon, Sun, CheckCircle, Zap, Lock, TrendingUp, Activity, Clock, AlertCircle, Shield, BarChart3, LineChart, Bell, Users, Brain, Gauge, Smartphone, Eye } from "lucide-react";
import logo from "@/components/EpilepticAI.png";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";

const Index = () => {
  const { theme, setTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-purple-950 dark:via-purple-900 dark:to-blue-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border-b border-gray-200/30 dark:border-slate-800/30 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="EpilepticAI" className="w-8 h-8 object-contain" />
              <span className="font-bold text-sm text-purple-900 dark:text-purple-300">EpilepticAI</span>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>
              <button 
                onClick={handleLoginClick}
                className="bg-blue-600 dark:bg-blue-700 text-cyan-100 px-6 py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <style>{`
          @keyframes float-3d {
            0%, 100% { transform: translateZ(0px) rotateX(0deg) rotateY(0deg); }
            50% { transform: translateZ(20px) rotateX(5deg) rotateY(5deg); }
          }
          .animate-float-3d {
            animation: float-3d 6s ease-in-out infinite;
            perspective: 1000px;
          }
        `}</style>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-purple-900 dark:text-white leading-tight">
                Smarter Epilepsy Monitoring, Designed for Doctors
              </h1>
              <p className="text-lg text-slate-700 dark:text-slate-100 leading-relaxed max-w-xl">
                A streamlined platform that brings real-time insights, patient evolution, and critical alerts together — so you can focus on care, not admin.
              </p>
              <button 
                onClick={handleLoginClick}
                className="px-8 py-3 bg-purple-600 dark:bg-purple-700 text-white dark:text-white font-semibold rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Dashboard Preview */}
            <div className="hidden md:flex items-center justify-end pr-12 animate-float-3d">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 543 355'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23c026d3;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%232563eb;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='543' height='355' fill='url(%23bg)'/%3E%3Ccircle cx='350' cy='150' r='120' fill='%23a78bfa' opacity='0.3'/%3E%3Crect x='320' y='30' width='200' height='60' rx='8' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.3)' stroke-width='1'/%3E%3Ctext x='340' y='50' font-family='Arial' font-size='14' fill='%2399f6e4' font-weight='bold'%3E📡 Live Monitoring%3C/text%3E%3Ctext x='340' y='70' font-family='Arial' font-size='12' fill='%23c7d2fe'%3E12 Patients Active%3C/text%3E%3Crect x='40' y='80' width='200' height='60' rx='8' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.3)' stroke-width='1'/%3E%3Ctext x='60' y='100' font-family='Arial' font-size='14' fill='%23fbbf24' font-weight='bold'%3E⚠️ Predicted Event%3C/text%3E%3Ctext x='60' y='120' font-family='Arial' font-size='12' fill='%23c7d2fe'%3ERisk spike in 1.5h%3C/text%3E%3Crect x='40' y='230' width='200' height='60' rx='8' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.3)' stroke-width='1'/%3E%3Ctext x='60' y='250' font-family='Arial' font-size='14' fill='%23f87171' font-weight='bold'%3E⚡ Seizure Detected%3C/text%3E%3Ctext x='60' y='270' font-family='Arial' font-size='12' fill='%23c7d2fe'%3EAI Confidence: 94%25%3C/text%3E%3C/svg%3E"
                alt="Dashboard Preview"
                className="w-full max-w-lg rounded-2xl shadow-2xl drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why EpilepticAI Makes the Difference */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Why EpilepticAI Makes the Difference</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">Elevate your epilepsy monitoring with intelligent insights that save time and improve patient outcomes.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Stay Ahead of Critical Cases With intelligent alerts</h3>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Understand Patient Evolution At a glance</h3>
              
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Centralize Epilepsy Monitoring In one secure platform</h3>
              
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Reduce Manual Work and Elevate clinical decision-making</h3>
            
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Comprehensive Features for Modern Healthcare</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">Everything you need to monitor, analyze, and care for your epilepsy patients.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-blue-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-3">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Patient Overview</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">A clean, organized dashboard that gives you instant visibility on your entire patient base.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-green-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-3">
                <LineChart className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Patient Profile Pages</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">All relevant info — details, seizure patterns, history — neatly structured and always accessible.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-orange-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Real-Time Alerts</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Prioritized notifications for patients who may require immediate attention.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-red-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Secure & Doctor-Controlled</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Built with healthcare-grade protection and privacy-by-design principles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Doctors Choose EpilepticAI */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Why Doctors Choose EpilepticAI</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">Built by clinicians, for clinicians</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Less Time Organizing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">More time analyzing</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">See the Big Picture</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Without digging</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Stay Aligned</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">With your patients' daily reality</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gauge className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Upgrade Your Workflow</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">With smart, automated monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">Simple setup, powerful insights — get started in minutes.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative text-center">
              <div className="w-20 h-20 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Set Up Patient Profile</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">In seconds with essential medical information.</p>
            </div>

            <div className="relative text-center">
              <div className="w-20 h-20 bg-green-600 dark:bg-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl font-bold">2</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Provide Secure Access</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">So the patient can use our mobile monitoring app.</p>
            </div>

            <div className="relative text-center">
              <div className="w-20 h-20 bg-orange-600 dark:bg-orange-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl font-bold">3</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Start Receiving Insights</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Episodes, patterns, alerts, and daily insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Confidence */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Trust & Medical-Grade Confidence</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">Enterprise standards for healthcare</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-br from-blue-50 dark:from-slate-800 to-blue-100 dark:to-slate-900 rounded-lg border border-blue-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Data Privacy First</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Designed with strict data privacy in mind</p>
            </div>

            <div className="p-8 bg-gradient-to-br from-green-50 dark:from-slate-800 to-green-100 dark:to-slate-900 rounded-lg border border-green-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Supported by Intelligence</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Your expertise, supported by reliable intelligence</p>
            </div>

            <div className="p-8 bg-gradient-to-br from-orange-50 dark:from-slate-800 to-orange-100 dark:to-slate-900 rounded-lg border border-orange-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-orange-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Clinical Precision</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Built for confidentiality and clinical precision</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-purple-900 dark:text-white mb-4">Bring Clarity into Epilepsy Monitoring</h2>
          <p className="text-lg text-slate-700 dark:text-slate-100 mb-10 max-w-xl mx-auto">
            Join forward-thinking doctors who are transforming patient care with intelligent monitoring solutions.
          </p>
          <button 
            onClick={handleLoginClick}
            className="px-8 py-4 bg-purple-600 dark:bg-purple-700 text-cyan-100 dark:text-white font-semibold rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
          >
            Get Started Now <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src={logo} alt="EpilepticAI" className="w-8 h-8 object-contain" />
                  <span className="text-lg font-bold text-purple-900">EpilepticAI</span>
                </div>
                <p className="text-sm text-slate-400">Clinical monitoring for better patient outcomes.</p>
              </div>
              
              <div className="text-left sm:text-right">
                <p className="text-sm text-slate-300 mb-2">
                  <a href="mailto:support@epilepticai.com" className="text-white hover:text-blue-400 transition-colors">
                    support@epilepticai.com
                  </a>
                </p>
                <p className="text-xs text-slate-500">© 2025 EpilepticAI. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;