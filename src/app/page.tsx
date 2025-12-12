'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { 
  Ship,
  Recycle, 
  Droplets, 
  Menu, 
  X, 
  Eye, 
  Navigation, 
  BarChart3, 
  User,
  Mail, 
  Phone, 
  LogOut,
  Github,
  Building2,
  Heart,
  Zap,
  Globe,
  MapPin,
  Shield,
  TrendingUp,
  CheckCircle,
  Play,
  ArrowRight,
  Rocket,
  Linkedin,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';

export default function Home() {
  const { user, userData, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [stats, setStats] = useState({
    activeDeployments: 0,
    wasteCollected: 0,
    riversMonitored: 0
  });

  // Fetch stats from Firebase
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch active bots count
        const botsSnapshot = await getDocs(collection(db, 'bots'));
        const activeDeployments = botsSnapshot.size;

        // Fetch deployments data to sum waste collected
        const deploymentsSnapshot = await getDocs(collection(db, 'deployments'));
        let totalWaste = 0;

        deploymentsSnapshot.forEach((doc) => {
          const data = doc.data();
          // Sum trash_collection.total_weight (in kg)
          if (data.trash_collection?.total_weight) {
            totalWaste += parseFloat(data.trash_collection.total_weight) || 0;
          }
        });

        // Fetch rivers count
        const riversSnapshot = await getDocs(collection(db, 'rivers'));
        const riversMonitored = riversSnapshot.size;

        setStats({
          activeDeployments,
          wasteCollected: totalWaste,
          riversMonitored
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default values on error
      }
    };

    fetchStats();
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['product', 'features', 'how-it-works', 'use-cases', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserDisplayName = () => {
    if (userData) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    return user?.email || 'User';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2.5">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center">
                <Image 
                  src="/img/app_launcher.png" 
                  alt="AGOS Logo" 
                  width={48} 
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">AGOS</h1>
                <p className="text-[10px] text-gray-600">Autonomous River Cleaning</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6" aria-label="Main navigation">
              <a href="#product" className={`text-sm font-medium transition-colors ${activeSection === 'product' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>Product</a>
              <a href="#features" className={`text-sm font-medium transition-colors ${activeSection === 'features' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>Features</a>
              <a href="#how-it-works" className={`text-sm font-medium transition-colors ${activeSection === 'how-it-works' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>How It Works</a>
              <a href="#use-cases" className={`text-sm font-medium transition-colors ${activeSection === 'use-cases' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>Use Cases</a>
              <a href="#contact" className={`text-sm font-medium transition-colors ${activeSection === 'contact' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>Contact</a>
            </nav>

            {/* Auth Section */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 px-2.5 py-1.5 bg-blue-50 rounded-lg">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">
                      {getUserDisplayName()}
                    </span>
                  </div>
                  <Link
                    href="/admin/dashboard"
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/admin/login"
                  className="px-5 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Admin Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-blue-200/50">
              <div className="flex flex-col space-y-4">
                <a href="#product" className={`font-medium transition-colors ${activeSection === 'product' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>Product</a>
                <a href="#features" className={`font-medium transition-colors ${activeSection === 'features' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>Features</a>
                <a href="#how-it-works" className={`font-medium transition-colors ${activeSection === 'how-it-works' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>How It Works</a>
                <a href="#use-cases" className={`font-medium transition-colors ${activeSection === 'use-cases' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>Use Cases</a>
                <a href="#contact" className={`font-medium transition-colors ${activeSection === 'contact' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>Contact</a>
                
                {user ? (
                  <div className="pt-4 border-t border-blue-200/50">
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {getUserDisplayName()}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Link
                        href="/admin/dashboard"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 text-center"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-center"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-blue-200/50">
                    <Link
                      href="/admin/login"
                      className="block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 text-center"
                    >
                      Admin Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white" aria-label="Hero section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left Column - Content */}
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-5 leading-tight">
                Autonomous River Cleaning
                <span className="block text-blue-600 mt-2">
                  with AI Technology
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                AGOS uses autonomous robots to detect, collect, and monitor river waste in real-time, providing sustainable solutions for water pollution.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  <a href="#product" className="flex items-center">
                    Watch Demo
                    <Play className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3">
                  <Link href="/admin/login" className="flex items-center">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Ship className="h-8 w-8 text-blue-600" />, number: "85%", label: "AI Accuracy" },
                { icon: <Droplets className="h-8 w-8 text-cyan-600" />, number: "10kg", label: "Per Cycle" },
                { icon: <MapPin className="h-8 w-8 text-green-600" />, number: "24/7", label: "Monitoring" },
                { icon: <Zap className="h-8 w-8 text-purple-600" />, number: "Real-time", label: "Analytics" }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="flex justify-center mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-0.5 text-center">{stat.number}</div>
                  <div className="text-xs text-gray-600 text-center">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Video Section */}
      <section id="product" className="py-16 bg-white" aria-labelledby="product-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 id="product-heading" className="text-3xl font-bold text-gray-900 mb-3">See AGOS in Action</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Watch how our autonomous system revolutionizes river cleanup
            </p>
          </div>
          
          <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/IVvUtF27LQ0"
              title="AGOS Product Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="border-0"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-3xl font-bold text-gray-900 mb-3">Key Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to monitor, manage, and maintain clean rivers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Eye className="h-8 w-8" />,
                title: "AI-Powered Detection",
                description: "85% accurate trash detection using computer vision. Identifies waste types in real-time.",
                color: "blue"
              },
              {
                icon: <Navigation className="h-8 w-8" />,
                title: "Autonomous Navigation",
                description: "GPS and sonar-guided bots that safely navigate rivers without human intervention.",
                color: "cyan"
              },
              {
                icon: <Droplets className="h-8 w-8" />,
                title: "Water Quality Monitoring",
                description: "Track pH, turbidity, and other key water quality indicators continuously.",
                color: "green"
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Real-Time Dashboard",
                description: "Web-based control center with live data, analytics, and customizable reports.",
                color: "purple"
              },
              {
                icon: <Ship className="h-8 w-8" />,
                title: "Fleet Management",
                description: "Control multiple bots simultaneously with scheduling and task assignment.",
                color: "orange"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Emergency Controls",
                description: "Instant recall and safety overrides for complete operational control.",
                color: "red"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className={`inline-flex p-3 rounded-lg bg-${feature.color}-100 text-${feature.color}-600 mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-blue-600" aria-labelledby="how-it-works-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="how-it-works-heading" className="text-3xl font-bold text-white mb-3">How AGOS Works</h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Simple, automated river cleaning in four phases
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Deploy",
                description: "Strategic bot deployment to target areas",
                icon: <Rocket className="h-10 w-10" />
              },
              {
                step: "02",
                title: "Detect",
                description: "AI vision identifies and classifies floating waste",
                icon: <Eye className="h-10 w-10" />
              },
              {
                step: "03",
                title: "Collect",
                description: "Collects trash and environmental data",
                icon: <Recycle className="h-10 w-10" />
              },
              {
                step: "04",
                title: "Repurpose",
                description: "Waste recycling and circular economy connection",
                icon: <Zap className="h-10 w-10" />
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                  <div className="text-white mb-4 flex justify-center">
                    {step.icon}
                  </div>
                  <div className="text-xs font-semibold text-blue-200 mb-2 text-center">STEP {step.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">{step.title}</h3>
                  <p className="text-sm text-blue-100 text-center">{step.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:flex absolute top-1/2 z-10 items-center justify-center" style={{ right: '-1.5rem', transform: 'translateY(-50%)' }}>
                    <ArrowRight className="h-6 w-6 text-white/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDG Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">UN Sustainable Development Goals</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Every AGOS deployment contributes to 5 UN SDGs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[
              { 
                sdg: "6", 
                title: "Clean Water and Sanitation",
                icon: <Droplets className="h-12 w-12" />,
                bgColor: "bg-blue-50",
                textColor: "text-blue-600"
              },
              { 
                sdg: "11", 
                title: "Sustainable Cities",
                icon: <Building2 className="h-12 w-12" />,
                bgColor: "bg-orange-50",
                textColor: "text-orange-600"
              },
              { 
                sdg: "12", 
                title: "Responsible Consumption",
                icon: <Recycle className="h-12 w-12" />,
                bgColor: "bg-yellow-50",
                textColor: "text-yellow-600"
              },
              { 
                sdg: "13", 
                title: "Climate Action",
                icon: <Globe className="h-12 w-12" />,
                bgColor: "bg-green-50",
                textColor: "text-green-600"
              },
              { 
                sdg: "14", 
                title: "Life Below Water",
                icon: <Heart className="h-12 w-12" />,
                bgColor: "bg-cyan-50",
                textColor: "text-cyan-600"
              }
            ].map((sdg, index) => (
              <div key={index} className="bg-white rounded-lg p-3 md:p-6 border border-gray-200 shadow-sm text-center">
                <div className={`inline-flex p-2 md:p-4 rounded-full ${sdg.bgColor} ${sdg.textColor} mb-2 md:mb-3`}>
                  {sdg.icon}
                </div>
                <div className={`text-xl md:text-2xl font-bold ${sdg.textColor} mb-1 md:mb-2`}>
                  SDG {sdg.sdg}
                </div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700 leading-tight">{sdg.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 relative overflow-hidden" aria-labelledby="use-cases-heading">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 id="use-cases-heading" className="text-4xl font-bold text-gray-900 mb-4">Who Benefits from AGOS?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Built for organizations committed to environmental sustainability
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <Building2 className="h-10 w-10" />,
                title: "Local Government Units",
                description: "Automate river cleanup operations, reduce manual labor costs, and provide citizens with data-driven environmental reports.",
                benefits: ["Cost-effective cleanup", "Real-time monitoring", "Public transparency"],
                color: "blue",
                gradient: "from-blue-500 to-blue-600"
              },
              {
                icon: <Heart className="h-10 w-10" />,
                title: "Environmental NGOs",
                description: "Scale your impact with autonomous technology. Track cleanup progress and generate reports for stakeholders.",
                benefits: ["Greater reach", "Data collection", "Impact measurement"],
                color: "green",
                gradient: "from-green-500 to-green-600"
              },
              {
                icon: <TrendingUp className="h-10 w-10" />,
                title: "Corporate CSR Programs",
                description: "Meet sustainability goals with measurable environmental impact. Adopt rivers and track your contribution.",
                benefits: ["Measurable impact", "Brand visibility", "ESG compliance"],
                color: "purple",
                gradient: "from-purple-500 to-purple-600"
              },
              {
                icon: <Globe className="h-10 w-10" />,
                title: "Research Institutions",
                description: "Access comprehensive environmental data for studies on water quality, pollution patterns, and ecosystem health.",
                benefits: ["Rich datasets", "Long-term monitoring", "Research partnerships"],
                color: "orange",
                gradient: "from-orange-500 to-orange-600"
              }
            ].map((useCase, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 relative overflow-hidden"
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${useCase.gradient}`}></div>
                
                <div className="flex flex-col md:flex-row items-start md:space-x-5 space-y-4 md:space-y-0">
                  {/* Icon with gradient background */}
                  <div className={`flex-shrink-0 p-4 rounded-xl bg-gradient-to-br ${useCase.gradient} text-white shadow-lg mx-auto md:mx-0`}>
                    {useCase.icon}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left md:!ml-3">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                    <p className="text-sm text-gray-600 mb-5 leading-relaxed">{useCase.description}</p>
                    
                    {/* Benefits list with enhanced styling */}
                    <div className="space-y-3">
                      {useCase.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center justify-center md:justify-start text-sm text-gray-700">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mr-3 shadow-md`}>
                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Bottom decorative element */}
                <div className={`absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br ${useCase.gradient} opacity-5 rounded-tl-full`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet the innovators behind AGOS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Jacqueline DC. Reyes, CDSA",
                role: "Chief Executive Officer",
                description: "AI/ML Engineer leading innovation in autonomous environmental technology",
                color: "blue",
                desktopOrder: "md:order-2" // Center on desktop
              },
              {
                name: "Mark Benson A. Matanguihan",
                role: "Chief Technology Officer",
                description: "Fullstack Developer and Mobile App Lead driving technical excellence",
                color: "cyan",
                desktopOrder: "md:order-1" // Left on desktop
              },
              {
                name: "Alexandra Andrea S. Fortu, CDSA",
                role: "Chief Financial Officer",
                description: "Leading marketing, research, and financial strategy",
                color: "purple",
                desktopOrder: "md:order-3" // Right on desktop
              }
            ].map((member, index) => (
              <div key={index} className={`bg-white rounded-2xl p-8 border border-gray-200 shadow-lg text-center ${member.desktopOrder}`}>
                {/* Avatar placeholder */}
                <div className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-${member.color}-500 to-${member.color}-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl`}>
                  {member.name.split(' ')[0][0]}{member.name.split(' ')[1]?.[0] || member.name.split(' ')[2]?.[0]}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className={`text-sm font-semibold text-${member.color}-600 mb-4`}>{member.role}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Ready to Transform Your River?
            </h2>
            <p className="text-lg md:text-xl text-blue-50 mb-6 max-w-3xl mx-auto">
              Join leading organizations using AGOS to create cleaner, healthier waterways.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/admin/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-xl font-bold text-base shadow-2xl transition-all duration-200"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a 
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-3 border-white text-white rounded-xl font-bold text-base backdrop-blur-sm transition-all duration-200"
              >
                Contact Sales
              </a>
            </div>
          </div>
          
          {/* Bottom stats bar */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-10 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">{stats.activeDeployments}</div>
              <div className="text-sm text-blue-100">Active Deployments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {stats.wasteCollected > 1000 
                  ? `${(stats.wasteCollected / 1000).toFixed(1)}T` 
                  : `${stats.wasteCollected.toFixed(0)}kg`}
              </div>
              <div className="text-sm text-blue-100">Waste Collected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">{stats.riversMonitored}</div>
              <div className="text-sm text-blue-100">Rivers Monitored</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50" aria-labelledby="contact-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="contact-heading" className="text-3xl font-bold text-gray-900 mb-3">Get in Touch</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Interested in learning more about AGOS or partnering with us?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Mail className="h-6 w-6" />, title: "Email Us", value: "contact@agos-systems.com", color: "blue" },
              { icon: <Phone className="h-6 w-6" />, title: "Call Us", value: "+1 (555) 123-4567", color: "cyan" },
              { icon: <Github className="h-6 w-6" />, title: "Open Source", value: "github.com/agos-systems", color: "purple" }
            ].map((contact, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                <div className={`inline-flex p-3 rounded-lg bg-${contact.color}-100 text-${contact.color}-600 mb-4`}>
                  {contact.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{contact.title}</h3>
                <p className="text-sm text-gray-600">{contact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16" role="contentinfo" aria-label="Footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1">
                  <Image 
                    src="/img/app_launcher.png" 
                    alt="AGOS Logo" 
                    width={40} 
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold">AGOS</span>
              </div>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-md">
                Autonomous river cleaning technology powered by AI. Transforming waterways and creating sustainable solutions for environmental conservation.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            {/* Product */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white text-sm transition-colors">How It Works</a></li>
                <li><a href="#product" className="text-gray-400 hover:text-white text-sm transition-colors">Demo</a></li>
                <li><a href="/admin/login" className="text-gray-400 hover:text-white text-sm transition-colors">Dashboard</a></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                <li><a href="#use-cases" className="text-gray-400 hover:text-white text-sm transition-colors">Use Cases</a></li>
                <li><a href="/impact" className="text-gray-400 hover:text-white text-sm transition-colors">Impact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">About Us</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</a></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Case Studies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                &copy; 2025 AGOS Systems. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms</a>
                <a href="#contact" className="text-gray-400 hover:text-white text-sm transition-colors">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}



