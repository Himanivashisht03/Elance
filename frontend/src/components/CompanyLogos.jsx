//frontend\src\components\CompanyLogos.jsx
const CompanyLogos = ({ darkMode }) => {
  const companies = [
    { name: 'Google', logo: '/google-logo.png', careersUrl: 'https://careers.google.com' },
    { name: 'Microsoft', logo: '/microsoft-logo.png', careersUrl: 'https://careers.microsoft.com' },
    // Add 7 more companies...
  ];

  return (
    <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-6">
        <h2 className={`text-3xl font-bold text-center mb-12 ${darkMode ? 'text-white' : 'text-black'}`}>
          Trusted By Top Innovators
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {companies.map((company) => (
            <a
              key={company.name}
              href={company.careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center items-center p-4 rounded-lg hover:scale-105 transition-transform duration-300"
            >
              <img 
                src={darkMode 
                  ? company.logo.replace('.png', '-white.png') 
                  : company.logo
                } 
                alt={company.name} 
                className="h-12 object-contain filter grayscale hover:grayscale-0 transition-all"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyLogos;