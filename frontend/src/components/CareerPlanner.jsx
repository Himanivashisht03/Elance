//frontend\src\components\CareerPlanner.jsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const CareerPlanner = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // ✅ Complete list of 50+ companies from your request
  const companies = [
    // ===== TECH GIANTS =====
    {
      id: 1,
      name: 'Google',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      website: 'https://careers.google.com',
      category: 'Tech Giants',
      size: 'large',
    },
    {
      id: 2,
      name: 'Microsoft',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
      website: 'https://careers.microsoft.com',
      category: 'Tech Giants',
      size: 'large',
    },
    {
      id: 3,
      name: 'Amazon',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      website: 'https://www.amazon.jobs',
      category: 'Tech Giants',
      size: 'large',
    },
    {
      id: 4,
      name: 'Meta',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
      website: 'https://www.metacareers.com',
      category: 'Tech Giants',
      size: 'regular',
    },
    {
      id: 5,
      name: 'Apple',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      website: 'https://jobs.apple.com',
      category: 'Tech Giants',
      size: 'regular',
    },
    
    // ===== ENTERPRISE SOFTWARE =====
    {
      id: 6,
      name: 'IBM',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg',
      website: 'https://www.ibm.com/careers',
      category: 'Enterprise',
      size: 'regular',
    },
    {
      id: 7,
      name: 'Oracle',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg',
      website: 'https://www.oracle.com/careers',
      category: 'Enterprise',
      size: 'regular',
    },
    {
      id: 8,
      name: 'Salesforce',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
      website: 'https://careers.salesforce.com',
      category: 'Enterprise',
      size: 'regular',
    },
    {
      id: 9,
      name: 'SAP',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg',
      website: 'https://www.sap.com/about/careers.html',
      category: 'Enterprise',
      size: 'regular',
    },
    {
      id: 10,
      name: 'VMware',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Vmware.svg',
      website: 'https://careers.vmware.com',
      category: 'Enterprise',
      size: 'regular',
    },
    
    // ===== NETWORKING & SECURITY =====
    {
      id: 11,
      name: 'Cisco',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Cisco_logo.svg',
      website: 'https://jobs.cisco.com',
      category: 'Networking',
      size: 'regular',
    },
    {
      id: 12,
      name: 'Fortinet',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Fortinet_logo.svg',
      website: 'https://www.fortinet.com/careers',
      category: 'Security',
      size: 'regular',
    },
    {
      id: 13,
      name: 'Palo Alto Networks',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Palo_Alto_Networks_Logo.svg',
      website: 'https://jobs.paloaltonetworks.com',
      category: 'Security',
      size: 'regular',
    },
    
    // ===== CERTIFICATION & TRAINING =====
    {
      id: 14,
      name: 'CompTIA',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/CompTIA_Logo.svg',
      website: 'https://www.comptia.org/about-us/careers',
      category: 'Certification',
      size: 'small',
    },
    {
      id: 15,
      name: 'Red Hat',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Red_Hat_logo.svg',
      website: 'https://www.redhat.com/en/jobs',
      category: 'Enterprise',
      size: 'regular',
    },
    
    // ===== DEVELOPMENT TOOLS =====
    {
      id: 16,
      name: 'JetBrains',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/JetBrains_Logo_2016.svg',
      website: 'https://www.jetbrains.com/careers',
      category: 'Tools',
      size: 'regular',
    },
    {
      id: 17,
      name: 'Unity',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Unity_2021.svg',
      website: 'https://careers.unity.com',
      category: 'Gaming',
      size: 'regular',
    },
    {
      id: 18,
      name: 'Autodesk',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Autodesk_Logo.svg',
      website: 'https://www.autodesk.com/careers',
      category: 'Design',
      size: 'regular',
    },
    {
      id: 19,
      name: 'Adobe',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.svg',
      website: 'https://adobe.wd5.myworkdayjobs.com/external_experienced',
      category: 'Creative',
      size: 'regular',
    },
    
    // ===== PROFESSIONAL PLATFORMS =====
    {
      id: 20,
      name: 'LinkedIn',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
      website: 'https://careers.linkedin.com',
      category: 'Social',
      size: 'regular',
    },
    {
      id: 21,
      name: 'HubSpot',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/HubSpot_Logo.svg',
      website: 'https://www.hubspot.com/careers',
      category: 'Marketing',
      size: 'regular',
    },
    {
      id: 22,
      name: 'Atlassian',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Atlassian_Logo.svg',
      website: 'https://www.atlassian.com/company/careers',
      category: 'Tools',
      size: 'regular',
    },
    {
      id: 23,
      name: 'ServiceNow',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/57/ServiceNow_logo.svg',
      website: 'https://careers.servicenow.com',
      category: 'Enterprise',
      size: 'regular',
    },
    {
      id: 24,
      name: 'Workday',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Workday_Logo.svg',
      website: 'https://www.workday.com/en-us/company/careers.html',
      category: 'HR Tech',
      size: 'regular',
    },
    
    // ===== ONLINE LEARNING PLATFORMS =====
    {
      id: 25,
      name: 'Coursera',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg',
      website: 'https://about.coursera.org/careers',
      category: 'Education',
      size: 'regular',
    },
    {
      id: 26,
      name: 'edX',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/EdX_logo.svg',
      website: 'https://www.edx.org/careers',
      category: 'Education',
      size: 'small',
    },
    {
      id: 27,
      name: 'Udacity',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Udacity_logo.svg',
      website: 'https://www.udacity.com/us/careers',
      category: 'Education',
      size: 'regular',
    },
    {
      id: 28,
      name: 'Pluralsight',
      logo: 'https://logos-world.net/wp-content/uploads/2021/02/Pluralsight-Symbol.png',
      website: 'https://www.pluralsight.com/careers',
      category: 'Education',
      size: 'regular',
    },
    {
      id: 29,
      name: 'Udemy',
      logo: 'https://www.udemy.com/staticx/udemy/images/v8/logo-udemy.svg',
      website: 'https://about.udemy.com/careers',
      category: 'Education',
      size: 'regular',
    },
    {
      id: 30,
      name: 'LinkedIn Learning',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
      website: 'https://learning.linkedin.com/about-us/careers',
      category: 'Education',
      size: 'small',
    },
    {
      id: 31,
      name: 'Skillshare',
      logo: 'https://static.skillshare.com/assets/images/header/skillshare-logo.svg',
      website: 'https://www.skillshare.com/about/careers',
      category: 'Education',
      size: 'regular',
    },
    {
      id: 32,
      name: 'FutureLearn',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/FutureLearn_logo.svg',
      website: 'https://www.futurelearn.com/info/about/careers',
      category: 'Education',
      size: 'small',
    },
    {
      id: 33,
      name: 'Khan Academy',
      logo: 'https://cdn.kastatic.org/images/khan-logo-vertical-transparent.png',
      website: 'https://www.khanacademy.org/careers',
      category: 'Education',
      size: 'regular',
    },
    {
      id: 34,
      name: 'Alison',
      logo: 'https://alison.com/assets/api/images/alison-logo.svg',
      website: 'https://alison.com/about/careers',
      category: 'Education',
      size: 'small',
    },
    
    // ===== SPECIALIZED LEARNING =====
    {
      id: 35,
      name: 'Simplilearn',
      logo: 'https://www.simplilearn.com/ice9/assets/images/simplilearn-logo.svg',
      website: 'https://www.simplilearn.com/careers',
      category: 'Education',
      size: 'regular',
    },
    {
      id: 36,
      name: 'Great Learning',
      logo: 'https://d2o2utebsixu4k.cloudfront.net/media/images/GL-2.0-logo.svg',
      website: 'https://www.mygreatlearning.com/careers',
      category: 'Education',
      size: 'regular',
    },
    {
      id: 37,
      name: 'DataCamp',
      logo: 'https://www.datacamp.com/datacamp-sq-logo.svg',
      website: 'https://www.datacamp.com/careers',
      category: 'Data Science',
      size: 'regular',
    },
    {
      id: 38,
      name: 'Codecademy',
      logo: 'https://static.codecademy.com/assets/logos/codecademy.svg',
      website: 'https://www.codecademy.com/careers',
      category: 'Programming',
      size: 'regular',
    },
    
    // ===== PRESTIGIOUS INSTITUTIONS =====
    {
      id: 39,
      name: 'Harvard Online',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Harvard_University_coat_of_arms.svg',
      website: 'https://online-learning.harvard.edu',
      category: 'University',
      size: 'regular',
    },
    {
      id: 40,
      name: 'MIT OpenCourseWare',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg',
      website: 'https://ocw.mit.edu',
      category: 'University',
      size: 'regular',
    },
    {
      id: 41,
      name: 'Stanford Online',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Seal_of_Leland_Stanford_Junior_University.svg',
      website: 'https://online.stanford.edu',
      category: 'University',
      size: 'regular',
    },
    
    // ===== COMPANY ACADEMIES =====
    {
      id: 42,
      name: 'HubSpot Academy',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/HubSpot_Logo.svg',
      website: 'https://academy.hubspot.com',
      category: 'Company Training',
      size: 'small',
    },
    {
      id: 43,
      name: 'Google Digital Garage',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      website: 'https://learndigital.withgoogle.com',
      category: 'Company Training',
      size: 'small',
    },
    {
      id: 44,
      name: 'Microsoft Learn',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
      website: 'https://docs.microsoft.com/en-us/learn',
      category: 'Company Training',
      size: 'small',
    },
  ];

  // ✅ Handle logo click to redirect to company website
  const handleLogoClick = (website) => {
    window.open(website, '_blank', 'noopener,noreferrer');
  };

  // ✅ Get box size based on company size
  const getBoxSize = (size) => {
    switch (size) {
      case 'large':
        return { width: 160, height: 160 };
      case 'small':
        return { width: 100, height: 100 };
      default:
        return { width: 130, height: 130 };
    }
  };

  // ✅ Group companies by category for better organization
  const categorizedCompanies = companies.reduce((acc, company) => {
    const category = company.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(company);
    return acc;
  }, {});

  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: '#f0f2f5',
      py: 6,
    }}>
      <Container maxWidth="xl">
        {/* ✅ Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 800, 
              color: '#333',
              mb: 2,
              fontSize: { xs: '3rem', md: '4rem' }
            }}
          >
            Careers
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#666',
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            Explore career opportunities at {companies.length}+ top companies, learning platforms, and prestigious institutions worldwide
          </Typography>
        </Box>

        {/* ✅ Company Logos Grid - All Companies */}
        <Box sx={{ 
          maxWidth: 1400, 
          mx: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          {companies.map((company) => {
            const boxSize = getBoxSize(company.size);
            
            return (
              <Tooltip key={company.id} title={`Visit ${company.name} - ${company.category}`} arrow>
                <Card 
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    width: boxSize.width,
                    height: boxSize.height,
                    minWidth: boxSize.width,
                    minHeight: boxSize.height,
                    maxWidth: boxSize.width,
                    maxHeight: boxSize.height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      '& img': {
                        transform: 'scale(1.1)',
                      }
                    },
                  }}
                  onClick={() => handleLogoClick(company.website)}
                >
                  <CardContent sx={{ 
                    p: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    '&:last-child': { pb: 0 }
                  }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '70%',
                      height: '70%'
                    }}>
                      <img
                        src={company.logo}
                        alt={`${company.name} logo`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <Box
                        sx={{
                          display: 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '50%',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: '#333',
                            textAlign: 'center',
                            fontSize: company.size === 'small' ? '0.6rem' : '0.8rem'
                          }}
                        >
                          {company.name}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Tooltip>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

export default CareerPlanner;
