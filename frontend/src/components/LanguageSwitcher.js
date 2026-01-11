import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, changeLanguage, languages } = useLanguage();

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
        <Globe size={20} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {languages.find(lang => lang.code === language)?.nativeName}
        </span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="py-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                language === lang.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{lang.nativeName}</span>
                {language === lang.code && (
                  <span className="text-blue-600">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;