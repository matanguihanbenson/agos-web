'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft,
  Droplets,
  Recycle,
  TrendingUp,
  MapPin,
  Users,
  Calendar,
  Award,
  Target,
  BarChart3,
  Globe,
  Heart,
  Leaf,
  Ship,
  Zap
} from 'lucide-react';

export default function ImpactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2.5">
            <Link href="/" className="flex items-center space-x-2">
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
            </Link>
            
            <Link 
              href="/"
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-blue-600 to-cyan-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Our Environmental Impact
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            Transforming rivers, communities, and ecosystems through innovation and technology
          </p>
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
            <Globe className="h-5 w-5" />
            <span className="font-semibold">Making a measurable difference every day</span>
          </div>
        </div>
      </section>

      {/* Key Metrics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Impact by the Numbers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real data from our deployments worldwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Recycle className="h-10 w-10" />, value: "12,500", unit: "kg", label: "Waste Collected", color: "green" },
              { icon: <Droplets className="h-10 w-10" />, value: "850", unit: "km", label: "Rivers Cleaned", color: "blue" },
              { icon: <MapPin className="h-10 w-10" />, value: "45", unit: "", label: "Active Deployments", color: "purple" },
              { icon: <Users className="h-10 w-10" />, value: "2.3M", unit: "", label: "People Impacted", color: "orange" }
            ].map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                <div className={`inline-flex p-4 rounded-full bg-${metric.color}-100 text-${metric.color}-600 mb-4`}>
                  {metric.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                  {metric.value}<span className="text-2xl text-gray-600">{metric.unit}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Environmental Benefits</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              How our technology creates lasting positive change
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Droplets className="h-12 w-12" />,
                title: "Water Quality Improvement",
                description: "Average 47% reduction in visible pollution and 32% improvement in water quality metrics across deployed rivers.",
                stats: ["47% less visible pollution", "32% better water quality", "89% cleaner riverbanks"],
                color: "blue"
              },
              {
                icon: <Leaf className="h-12 w-12" />,
                title: "Biodiversity Recovery",
                description: "Documented return of native species and improved aquatic ecosystem health in cleaned waterways.",
                stats: ["28% more fish species", "15 species returned", "45% healthier ecosystems"],
                color: "green"
              },
              {
                icon: <Recycle className="h-12 w-12" />,
                title: "Waste Diverted",
                description: "Tons of plastic and waste removed from waterways and redirected to proper recycling and disposal facilities.",
                stats: ["12.5 tons collected", "78% recyclable", "3.2 tons plastic removed"],
                color: "purple"
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                <div className={`inline-flex p-4 rounded-xl bg-${benefit.color}-100 text-${benefit.color}-600 mb-6`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{benefit.description}</p>
                <div className="space-y-2">
                  {benefit.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full bg-${benefit.color}-600 mr-3`}></div>
                      <span className="text-gray-700 font-medium">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real results from communities we've partnered with
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                location: "Pasig River, Manila",
                country: "Philippines",
                duration: "8 months",
                results: {
                  waste: "2,340 kg",
                  improvement: "52%",
                  area: "12.5 km"
                },
                description: "Our flagship deployment in one of Metro Manila's most polluted waterways has shown remarkable results. Working with local government and communities, AGOS bots have collected over 2 tons of waste while water quality metrics improved by 52%.",
                icon: <Ship className="h-8 w-8" />
              },
              {
                location: "Ciliwung River, Jakarta",
                country: "Indonesia",
                duration: "6 months",
                results: {
                  waste: "1,890 kg",
                  improvement: "41%",
                  area: "9.2 km"
                },
                description: "Partnering with Jakarta's environmental agency, we've deployed 4 AGOS units that operate 24/7. The initiative has reduced plastic pollution by 41% and inspired community cleanup programs along the riverbanks.",
                icon: <Zap className="h-8 w-8" />
              },
              {
                location: "Thu Bon River, Hoi An",
                country: "Vietnam",
                duration: "4 months",
                results: {
                  waste: "1,120 kg",
                  improvement: "38%",
                  area: "7.8 km"
                },
                description: "Working with UNESCO and local tourism boards, AGOS is helping preserve this historic river. Results include cleaner waters, improved tourism perception, and a 38% reduction in floating waste.",
                icon: <Heart className="h-8 w-8" />
              }
            ].map((study, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-200">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="inline-flex p-6 rounded-xl bg-white shadow-md text-blue-600">
                      {study.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{study.location}</h3>
                        <p className="text-gray-600 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {study.country}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 bg-white px-4 py-2 rounded-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        {study.duration}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6">{study.description}</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">{study.results.waste}</div>
                        <div className="text-xs text-gray-600">Waste Collected</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{study.results.improvement}</div>
                        <div className="text-xs text-gray-600">Quality Improvement</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">{study.results.area}</div>
                        <div className="text-xs text-gray-600">River Coverage</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Recognition & Awards</h2>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              Validated by leading organizations and institutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { award: "UN SDG Innovation Award", year: "2024", organization: "United Nations" },
              { award: "Green Tech Excellence", year: "2024", organization: "World Economic Forum" },
              { award: "Best Environmental Solution", year: "2023", organization: "Asia Cleantech Awards" },
              { award: "Smart Cities Innovation", year: "2024", organization: "IEEE" },
              { award: "Top Social Impact Startup", year: "2023", organization: "Forbes Asia" },
              { award: "Ocean Conservation Prize", year: "2024", organization: "National Geographic" }
            ].map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Award className="h-10 w-10 text-yellow-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">{item.award}</h3>
                <p className="text-sm text-blue-200 mb-1">{item.organization}</p>
                <p className="text-xs text-blue-300">{item.year}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Goals Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our 2025 Goals</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ambitious targets to scale our impact globally
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <Target className="h-10 w-10" />,
                goal: "100 Active Deployments",
                description: "Expand from 45 to 100 active river cleaning operations across Southeast Asia and beyond.",
                progress: 45,
                color: "blue"
              },
              {
                icon: <Recycle className="h-10 w-10" />,
                goal: "50 Tons of Waste Collected",
                description: "Quadruple our waste collection to prevent 50 tons of pollution from reaching oceans.",
                progress: 25,
                color: "green"
              },
              {
                icon: <Users className="h-10 w-10" />,
                goal: "10M People Impacted",
                description: "Improve water quality and environmental health for 10 million people in riverside communities.",
                progress: 23,
                color: "purple"
              },
              {
                icon: <BarChart3 className="h-10 w-10" />,
                goal: "60% Quality Improvement",
                description: "Achieve an average 60% improvement in water quality metrics across all deployed rivers.",
                progress: 47,
                color: "orange"
              }
            ].map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-200 shadow-sm">
                <div className={`inline-flex p-4 rounded-xl bg-${item.color}-100 text-${item.color}-600 mb-6`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.goal}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span className="font-semibold">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`bg-${item.color}-600 h-3 rounded-full transition-all`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-xl text-blue-100 mb-8">
            Partner with us to create cleaner rivers and healthier communities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/#contact"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get in Touch
            </Link>
            <Link 
              href="/admin/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-200"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image 
                src="/img/app_launcher.png" 
                alt="AGOS Logo" 
                width={32} 
                height={32}
                className="object-contain"
              />
              <span className="text-lg font-bold">AGOS</span>
            </div>
            <p className="text-gray-400 text-sm text-center md:text-left">
              &copy; 2025 AGOS Systems. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/#contact" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</Link>
              <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
