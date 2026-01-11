import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Zap, Eye, CheckCircle, ArrowRight } from 'lucide-react';

const Landing = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <FileText className="w-12 h-12 text-blue-500" />,
      title: t('step1Title'),
      description: t('step1Desc'),
    },
    {
      icon: <Zap className="w-12 h-12 text-yellow-500" />,
      title: t('step2Title'),
      description: t('step2Desc'),
    },
    {
      icon: <Eye className="w-12 h-12 text-purple-500" />,
      title: t('step3Title'),
      description: t('step3Desc'),
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-green-500" />,
      title: t('step4Title'),
      description: t('step4Desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Indian Flag Colors Accent */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-2 bg-gradient-to-r from-government-orange via-government-white to-government-green rounded-full"></div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('welcomeTitle')}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-4 font-semibold">
            {t('welcomeSubtitle')}
          </p>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-10">
            {t('welcomeDescription')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="btn-primary flex items-center justify-center space-x-2 text-lg"
            >
              <span>{t('getStarted')}</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="btn-secondary flex items-center justify-center space-x-2 text-lg"
            >
              <span>{t('login')}</span>
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            {t('howItWorks')}
          </h2>
          <div className="w-24 h-1 bg-blue-500 mx-auto mb-12"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">3+</div>
              <div className="text-xl">Languages Supported</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10+</div>
              <div className="text-xl">Complaint Categories</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">AI</div>
              <div className="text-xl">Powered Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of citizens making their voices heard
          </p>
          <Link
            to="/signup"
            className="btn-primary text-lg inline-flex items-center space-x-2"
          >
            <span>Create Free Account</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            © 2026 JanSamvaad AI. Made with ❤️ for Indian Citizens.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;