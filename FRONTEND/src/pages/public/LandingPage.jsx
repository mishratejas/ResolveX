import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { motion } from 'framer-motion';
import { 
  Zap, 
  MapPin, 
  Users, 
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Clock,
  TrendingUp,
  PlayCircle,
  Target,
  BarChart,
  MessageSquare,
  Globe
} from 'lucide-react';

const LandingPage = ({ openAuthModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add at the top of LandingPage.jsx, after useState declarations:
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  const checkAuth = () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };
  
  checkAuth();
  
  // Listen for login events
  const handleUserLogin = () => {
    checkAuth();
  };
  
  window.addEventListener('userLogin', handleUserLogin);
  return () => window.removeEventListener('userLogin', handleUserLogin);
}, []);

// Update the CTA buttons in your LandingPage.jsx:
<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
  {isAuthenticated ? (
    <>
      <button
  onClick={() => window.location.href = '/home'}
  className="group relative bg-white text-blue-700 font-semibold text-lg py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
>
        <span className="relative z-10 flex items-center gap-2">
          Go to Dashboard
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>
      
      <div className="text-white text-center">
        <p>Welcome back, {currentUser?.name}!</p>
        <p className="text-sm opacity-80">Ready to continue working on community issues?</p>
      </div>
    </>
  ) : (
    <>
      <button
        onClick={() => openAuthModal('user', 'signup')}
        className="group relative bg-white text-blue-700 font-semibold text-lg py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          Get Started Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>
      
      <button
        onClick={() => scrollToSection('features')}
        className="group bg-transparent border border-white/40 text-white font-semibold text-lg py-3 px-8 rounded-lg hover:bg-white/10 transition-all duration-200"
      >
        <span className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5" />
          See How It Works
        </span>
      </button>
    </>
  )}
</div>

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Reporting',
      description: 'Report community issues in seconds with our intuitive interface.',
      gradient: 'from-blue-500 to-cyan-500',
      stat: '90% Faster'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Live Tracking',
      description: 'Track issue status in real-time with notifications and updates.',
      gradient: 'from-blue-600 to-indigo-600',
      stat: 'Real-time'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Power',
      description: 'Collaborative problem-solving with verified community members.',
      gradient: 'from-cyan-500 to-teal-500',
      stat: '10K+ Active'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Verified Solutions',
      description: 'Expert-verified solutions ensuring quality and reliability.',
      gradient: 'from-blue-700 to-sky-700',
      stat: '98% Success'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Community Manager',
      text: 'ResolveX transformed our neighborhood issue resolution. 70% faster resolution time across all reports.',
      rating: 5,
      avatar: 'SJ',
      company: 'Greenwood Estates'
    },
    {
      name: 'Michael Chen',
      role: 'Property Director',
      text: 'The transparency and tracking features have dramatically improved tenant satisfaction and operational efficiency.',
      rating: 5,
      avatar: 'MC',
      company: 'Urban Properties Inc'
    },
    {
      name: 'Elena Rodriguez',
      role: 'City Council Member',
      text: 'ResolveX has bridged the communication gap between residents and local government like never before.',
      rating: 5,
      avatar: 'ER',
      company: 'Metro City Council'
    }
  ];

  const stats = [
    { label: 'Issues Resolved', value: '50K+', icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'Active Communities', value: '1.2K+', icon: <Users className="w-5 h-5" /> },
    { label: 'Avg. Resolution Time', value: '24h', icon: <Clock className="w-5 h-5" /> },
    { label: 'Satisfaction Rate', value: '96%', icon: <Star className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Professional Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-50/30 to-transparent"></div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f9ff_1px,transparent_1px),linear-gradient(to_bottom,#f0f9ff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.02]"></div>
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400"></div>
        
        {/* LinkedIn-style overlay pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        
        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 mb-6 border border-white/30">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium text-white">Trusted by 1,000+ Communities</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">Resolve</span>
              <span className="text-cyan-200">X</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
              Connect communities with solutions. Report, track, and resolve issues efficiently.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
              <button
                onClick={() => openAuthModal('user', 'signup')}
                className="group relative bg-white text-blue-700 font-semibold text-lg py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button
                onClick={() => scrollToSection('features')}
                className="group bg-transparent border border-white/40 text-white font-semibold text-lg py-3 px-8 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  See How It Works
                </span>
              </button>
            </div>
          </motion.div>

          {/* Stats Bar - LinkedIn Style */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-blue-100">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
                <div className="text-sm text-blue-100/80 font-medium">{stat.label}</div>
              </div>
            ))}
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
                className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-blue-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-blue-600">{feature.stat}</span>
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-all">
                    <ArrowRight className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white text-blue-600 font-medium rounded-full px-4 py-2 mb-4 border border-blue-200">
              <MessageSquare className="w-4 h-4" />
              <span>Community Feedback</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Community Leaders
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See how community managers and leaders are transforming their neighborhoods.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-blue-600 font-medium">{testimonial.company}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-blue-500 text-blue-500" />
                  ))}
                </div>
                
                <p className="text-gray-700 text-sm mb-6 italic">"{testimonial.text}"</p>
                
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Active Community</span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-sky-500"></div>
        
        {/* LinkedIn-style pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:50px_50px]"></div>
        </div>
        
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/30">
              <BarChart className="w-4 h-4" />
              <span className="text-sm font-medium text-white">Proven Results</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Streamline Your Community Management?
            </h2>
            
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-10">
              Join 1,200+ communities that have improved issue resolution time by 70% on average.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => openAuthModal('user', 'signup')}
                className="group bg-white text-blue-700 font-semibold text-lg py-3 px-10 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button
                onClick={() => scrollToSection('features')}
                className="group bg-transparent border border-white/50 text-white font-semibold text-lg py-3 px-10 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                View All Features
              </button>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-xl font-bold text-white">14-day</div>
                <div className="text-xs text-white/70">Free Trial</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">No Credit</div>
                <div className="text-xs text-white/70">Card Required</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">Cancel</div>
                <div className="text-xs text-white/70">Anytime</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;