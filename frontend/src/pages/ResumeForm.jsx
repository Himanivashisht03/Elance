//frontend/src/pages/ResumeForm.jsx
import React, { useState, useContext } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  LinearProgress,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Person,
  Work,
  School,
  Star,
  Close,
  CheckCircle,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { authService } from '../services/AuthService';
import config from '../config';

const { API_URL } = config;

const ResumeForm = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // manual form state
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    skills: '',
    currentRole: '',
    currentCompany: '',
    education: '',
    experience: ''
  });

  const { user } = useContext(AuthContext);
  const { profile, integrateResumeData, updateProfile } = useProfile();

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const token = authService.getToken();
      const response = await fetch(`${API_URL}/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result.analysis);
        setSuccess('Resume uploaded and analyzed successfully!');
        setShowAnalysis(true);
        setFile(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload resume');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setManualForm({ ...manualForm, [name]: value });
  };

  const handleManualSubmit = async () => {
    const manualAnalysis = {
      personalInfo: {
        name: manualForm.name,
        email: manualForm.email,
        phone: manualForm.phone,
        location: manualForm.location,
      },
      currentRole: manualForm.currentRole,
      currentCompany: manualForm.currentCompany,
      skills: manualForm.skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
      experience: [
        { title: manualForm.experience, company: manualForm.currentCompany, duration: '', description: '' }
      ].filter(exp => exp.title),
      education: [
        { degree: manualForm.education, institution: '', year: '', field: manualForm.education }
      ].filter(edu => edu.degree)
    };

    setUploading(true);
    setError('');
    try {
      await integrateResumeData(manualAnalysis);
      setSuccess('✅ Profile saved to your account successfully!');
      setManualForm({ name:'', email:'', phone:'', location:'', skills:'', currentRole:'', currentCompany:'', education:'', experience:'' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleGeminiAnalyze = async () => {
    if (!file) {
      setError('Please upload a resume first');
      return;
    }

    setUploading(true);
    try {
      const apiKey = "YOUR_GEMINI_API_KEY"; // Replace with your real Gemini API key

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: "Extract structured resume details (personal info, skills, work experience, education) from this resume." }
                ]
              }
            ]
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const result = await response.json();
      const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiText) {
        setAnalysis(JSON.parse(aiText));
        setShowAnalysis(true);
      } else {
        setError("Gemini API returned no analysis");
      }
    } catch (err) {
      console.error(err);
      setError("Gemini API analysis failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!analysis) return;

    // Integrate the resume data into the profile
    await integrateResumeData(analysis);
    
    setSuccess('✅ Profile saved to your account successfully!');
    setShowAnalysis(false);
    setAnalysis(null);
    
    // Clear manual form
    setManualForm({
      name: '',
      email: '',
      phone: '',
      location: '',
      skills: '',
      currentRole: '',
      currentCompany: '',
      education: '',
      experience: ''
    });

    // Show success message for longer
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    setAnalysis(null);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 15, textAlign: 'center' }}>
        <Typography variant="h4" color="error">
          Please login to upload your resume
        </Typography>
        <Button variant="contained" href="/" sx={{ mt: 2 }}>
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 15, pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          📄 Smart Resume Upload
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Upload your resume, fill manually, or let AI analyze it
        </Typography>
      </Box>

      {/* Current Profile Status */}
      {(profile.name || profile.skills.length > 0) && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<CheckCircle />}
        >
          <Typography variant="body2">
            <strong>Current Profile:</strong> {profile.name || 'Unnamed'} • 
            {profile.skills.length} skills • {profile.education.length} education entries • 
            {profile.workExperience?.length || 0} work experiences
          </Typography>
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                🚀 Upload Your Resume
              </Typography>
              
              <Box
                sx={{
                  border: '2px dashed #1976d2',
                  borderRadius: 3,
                  p: 4,
                  textAlign: 'center',
                  mb: 3,
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  }
                }}
                onClick={() => document.getElementById('file-input').click()}
              >
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {file ? file.name : 'Click to select PDF file'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported format: PDF (Max 5MB)
                </Typography>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Box>

              {file && (
                <Box sx={{ mb: 3 }}>
                  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Description color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body1">{file.name}</Typography>
                    </Box>
                    <IconButton onClick={() => setFile(null)} size="small">
                      <Close />
                    </IconButton>
                  </Paper>
                </Box>
              )}

              {uploading && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Processing your resume...
                  </Typography>
                  <LinearProgress variant="indeterminate" />
                </Box>
              )}

              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!file || uploading}
                fullWidth
                size="large"
                sx={{ 
                  py: 2,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  }
                }}
              >
                {uploading ? 'Processing...' : '🤖 Analyze Resume'}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleGeminiAnalyze}
                disabled={!file || uploading}
              >
                🔮 Analyze with Gemini AI
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Manual Form Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                ✍️ Fill Resume Details Manually
              </Typography>

              <TextField 
                fullWidth 
                label="Full Name" 
                name="name" 
                value={manualForm.name} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }} 
                placeholder={profile.name || "Enter your full name"}
              />
              <TextField 
                fullWidth 
                label="Email" 
                name="email" 
                value={manualForm.email} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }}
                placeholder={profile.email || "Enter your email"}
              />
              <TextField 
                fullWidth 
                label="Phone" 
                name="phone" 
                value={manualForm.phone} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }}
                placeholder={profile.phone || "Enter your phone number"}
              />
              <TextField 
                fullWidth 
                label="Location" 
                name="location" 
                value={manualForm.location} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }}
                placeholder={profile.location || "Enter your location"}
              />
              <TextField 
                fullWidth 
                label="Current Role" 
                name="currentRole" 
                value={manualForm.currentRole} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }}
                placeholder={profile.currentRole || "Enter your current role"}
              />
              <TextField 
                fullWidth 
                label="Current Company" 
                name="currentCompany" 
                value={manualForm.currentCompany} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }}
                placeholder={profile.currentCompany || "Enter your current company"}
              />
              <TextField 
                fullWidth 
                label="Skills (comma separated)" 
                name="skills" 
                value={manualForm.skills} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }}
                placeholder={profile.skills.length > 0 ? profile.skills.join(', ') : "React, Node.js, Python"}
                helperText="Separate multiple skills with commas"
              />
              <TextField 
                fullWidth 
                label="Education" 
                name="education" 
                value={manualForm.education} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }}
                placeholder="Bachelor of Technology in Computer Science"
              />
              <TextField 
                fullWidth 
                label="Experience" 
                name="experience" 
                value={manualForm.experience} 
                onChange={handleFormChange} 
                sx={{ mb: 2 }}
                placeholder="Software Developer, Frontend Engineer, etc."
              />

              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleManualSubmit}
                disabled={(!manualForm.name && !manualForm.email && !manualForm.skills) || uploading}
                sx={{
                  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                  }
                }}
              >
                {uploading ? 'Saving...' : 'Save to Profile'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Results Dialog */}
      <Dialog open={showAnalysis} onClose={handleCloseAnalysis} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5">
              🤖 Resume Analysis Results
            </Typography>
            <IconButton onClick={handleCloseAnalysis}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {analysis && (
            <Box>
              {/* Personal Info */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    👤 Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Name</Typography>
                      <Typography variant="body1">{analysis.personalInfo?.name || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{analysis.personalInfo?.email || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{analysis.personalInfo?.phone || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body1">{analysis.personalInfo?.location || 'Not provided'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Current Role */}
              {(analysis.currentRole || analysis.currentCompany) && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💼 Current Position
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {analysis.currentRole || 'Role not specified'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {analysis.currentCompany ? `at ${analysis.currentCompany}` : 'Company not specified'}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {analysis.skills && analysis.skills.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🛠️ Skills & Technologies
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {analysis.skills.map((skill, index) => (
                        <Chip key={index} label={skill} color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {analysis.experience && analysis.experience.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📈 Work Experience
                    </Typography>
                    {analysis.experience.map((exp, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Typography variant="h6">{exp.title || 'Position not specified'}</Typography>
                        <Typography variant="body1" color="primary">{exp.company || 'Company not specified'}</Typography>
                        <Typography variant="body2" color="text.secondary">{exp.duration || 'Duration not specified'}</Typography>
                        {exp.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>{exp.description}</Typography>
                        )}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {analysis.education && analysis.education.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🎓 Education
                    </Typography>
                    {analysis.education.map((edu, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Typography variant="h6">{edu.degree || 'Degree not specified'}</Typography>
                        <Typography variant="body1" color="primary">{edu.institution || 'Institution not specified'}</Typography>
                        <Typography variant="body2" color="text.secondary">{edu.year || 'Year not specified'}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnalysis} variant="outlined">
            Close
          </Button>
          <Button 
            onClick={handleUpdateProfile} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            }}
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ResumeForm;