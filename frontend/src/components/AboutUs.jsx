//frontend\src\components\AboutUs.jsx
import { useState, useEffect } from 'react';
import CompanyLogos from './CompanyLogos';
import JobseekerLogin from './JobseekerLogin';
import UserProfile from './UserProfile';
import "./auth/Auth.css"
const AboutUs = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={darkMode ? '/logo-white.png' : '/logo-black.png'} 
              alt="Company Logo" 
              className="h-10"
            />
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {['Home', 'About', 'Careers', 'Contact'].map((item) => (
              <a 
                key={item}
                href="#"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  item === 'About' 
                    ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}` 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`py-20 ${darkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className={`text-4xl md:text-6xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
              <span className="block">We Build</span>
              <span className="block">Future Talent</span>
              <span className="text-2xl md:text-3xl font-normal opacity-80">Since 2012</span>
            </h2>
          </div>
          <div className="md:w-1/2">
            <img 
              src={darkMode ? "/abstract-dark.svg" : "/abstract-light.svg"} 
              alt="Abstract talent illustration" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Company Logos Section */}
      <CompanyLogos darkMode={darkMode} />

      {/* Career CTA Section */}
      <section className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="container mx-auto px-6 text-center">
          <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>
            Ready to Grow?
          </h2>
          <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Join our team of innovators and creators
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className={`px-8 py-3 rounded-lg font-semibold ${
              darkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            } transition-colors`}
          >
            Jobseeker Login
          </button>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <JobseekerLogin 
          darkMode={darkMode}
          onClose={() => setShowLoginModal(false)}
          onLogin={() => {
            setLoggedIn(true);
            setShowLoginModal(false);
          }}
        />
      )}

      {/* User Profile (shown after login) */}
      {loggedIn && <UserProfile darkMode={darkMode} />}

      {/* Footer */}
      <footer className={`py-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="container mx-auto px-6">
          {/* Footer content */}
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;