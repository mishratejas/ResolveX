import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { motion } from 'framer-motion';
import {
  Zap, MapPin, Users, CheckCircle, ArrowRight, Shield,
  Clock, TrendingUp, PlayCircle, Target, BarChart, MessageSquare,
  Globe, Star
} from 'lucide-react';

const LandingPage = ({ openAuthModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Reporting',
      description: 'Report community issues in seconds with our intuitive interface.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Live Tracking',
      description: 'Track issue status in real-time with notifications and updates.',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Power',
      description: 'Collaborative problem-solving with verified community members.',
      gradient: 'from-cyan-500 to-teal-500',
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Verified Solutions',
      description: 'Expert-reviewed resolutions ensuring quality and accountability.',
      gradient: 'from-blue-700 to-sky-700',
    },
  ];

  const howItWorks = [
    { step: '01', title: 'Submit an Issue', desc: 'Describe the problem and attach photos if needed.' },
    { step: '02', title: 'Track Progress', desc: 'Follow real-time status updates from our team.' },
    { step: '03', title: 'Issue Resolved', desc: 'Get notified once the issue is confirmed resolved.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-50/30 to-transparent" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute top-40 right-10 w-64 h-64 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f9ff_1px,transparent_1px),linear-gradient(to_bottom,#f0f9ff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.02]" />
      </div>

      <Navbar
        isScrolled={isScrolled}
        openAuthModal={openAuthModal}
        scrollToSection={scrollToSection}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Hero Section */}
      <section id="home" className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />

        <div className="container relative mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 mb-6 border border-white/30">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Your Voice, Our Priority</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">Resolve</span>
              <span className="text-cyan-200">X</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
              Connect communities with solutions. Report, track, and resolve issues efficiently.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => openAuthModal('user', 'signup')}
                className="group relative bg-white text-blue-700 font-semibold text-lg py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="group bg-transparent border border-white/40 text-white font-semibold text-lg py-3 px-8 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  See How It Works
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 font-medium rounded-full px-4 py-2 mb-4">
              <Target className="w-4 h-4" />
              <span>Key Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Community Management
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade tools designed for efficient community issue resolution and management.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-blue-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white text-blue-600 font-medium rounded-full px-4 py-2 mb-4 border border-blue-200">
              <BarChart className="w-4 h-4" />
              <span>How It Works</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple Three-Step Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting community issues resolved has never been easier.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-2rem)] h-0.5 bg-gradient-to-r from-blue-200 to-cyan-200" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-sky-500" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:50px_50px]" />
        </div>

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Make a Difference in Your Community?
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-10">
              Join community members who are actively improving their neighborhoods through transparent issue reporting and resolution.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => openAuthModal('user', 'signup')}
                className="group bg-white text-blue-700 font-semibold text-lg py-3 px-10 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button
                onClick={() => openAuthModal('user', 'login')}
                className="group bg-transparent border border-white/50 text-white font-semibold text-lg py-3 px-10 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;