//frontend/src/components/UserProfile.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Tabs, Tab,
  TextField, Button, Avatar, Chip, Grid,
  IconButton, Fade, Alert, CircularProgress, LinearProgress
} from '@mui/material';
import {
  Person, Work, School, Edit, Save, Upload, Delete, Add,
  CloudUpload, InsertDriveFile, CheckCircle
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const fieldSx = {
  mb: 2,
  '& .MuiOutlinedInput-root': {
    color: 'white',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#42a5f5' },
    '&.Mui-disabled': { color: 'rgba(255,255,255,0.7)' },
    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.7)',
    '&.Mui-focused': { color: '#42a5f5' },
    '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)' },
  },
  '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.7)' },
};

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   RESUME UPLOAD SECTION
   - DB se resume load hota hai — logout ke baad bhi rehta hai
   - onUploadSuccess: upload/delete ke baad AuthContext + Profile refresh
══════════════════════════════════════════════════════════════ */
const ResumeUploadSection = ({ user, onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMsg,    setUploadMsg]    = useState('');
  const [resumeName,   setResumeName]   = useState(user?.resumeName       || '');
  const [resumeUrl,    setResumeUrl]    = useState(user?.resumeUrl        || '');
  const [uploadedAt,   setUploadedAt]   = useState(user?.resumeUploadedAt || null);
  const [deleting,     setDeleting]     = useState(false);

  // Sync when user object updates (after login)
  useEffect(() => {
    setResumeName(user?.resumeName       || '');
    setResumeUrl(user?.resumeUrl         || '');
    setUploadedAt(user?.resumeUploadedAt || null);
  }, [user?.resumeName, user?.resumeUrl, user?.resumeUploadedAt]);

  const getToken = () => localStorage.getItem('token') || '';

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.pdf', '.doc', '.docx'].includes(ext)) {
      setUploadStatus('error'); setUploadMsg('Only PDF, DOC, DOCX allowed'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('error'); setUploadMsg('Max file size is 5MB'); return;
    }
    setUploading(true); setUploadStatus(null);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await axios.post(`${API}/auth/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${getToken()}` },
      });
      setResumeUrl(res.data.resumeUrl   || '');
      setResumeName(res.data.resumeName || file.name);
      setUploadedAt(res.data.resumeUploadedAt || new Date().toISOString());
      setUploadStatus('success');
      setUploadMsg('Resume saved! It will stay after logout.');
      if (onUploadSuccess) await onUploadSuccess();
    } catch (err) {
      setUploadStatus('error');
      setUploadMsg('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/auth/resume`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setResumeUrl(''); setResumeName(''); setUploadedAt(null);
      setUploadStatus(null); setUploadMsg('');
      if (onUploadSuccess) await onUploadSuccess();
    } catch {
      setUploadStatus('error'); setUploadMsg('Failed to remove resume');
    } finally {
      setDeleting(false);
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <Card sx={{
      mb: 3,
      background: 'rgba(26,35,50,0.9)',
      border: resumeName ? '2px solid rgba(66,165,245,0.55)' : '2px dashed rgba(66,165,245,0.4)',
      borderRadius: 3,
      transition: 'border-color 0.3s',
      '&:hover': { borderColor: 'rgba(66,165,245,0.75)' },
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {resumeName
            ? <InsertDriveFile sx={{ color: '#42a5f5', fontSize: 36 }} />
            : <CloudUpload     sx={{ color: '#42a5f5', fontSize: 36 }} />}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {resumeName ? 'Resume Uploaded' : 'Upload Your Resume'}
            </Typography>
            {resumeName ? (
              <>
                <Typography variant="body2" sx={{ color: '#42a5f5', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📄 {resumeName}
                </Typography>
                {uploadedAt && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                    Uploaded {fmtDate(uploadedAt)} · saved to your account
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                PDF, DOC, DOCX · Max 5MB · Saved permanently to your account
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {resumeName && resumeUrl && (
              <Button variant="outlined" size="small"
                href={`http://localhost:5000${resumeUrl}`} target="_blank" rel="noopener noreferrer"
                sx={{ borderColor: '#42a5f5', color: '#42a5f5', textTransform: 'none',
                  '&:hover': { borderColor: '#90caf9', color: '#90caf9' } }}>
                View
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx"
              onChange={handleFileChange} style={{ display: 'none' }} id="resume-file-input" />
            <label htmlFor="resume-file-input">
              <Button variant="contained" component="span" size="small"
                startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <Upload />}
                disabled={uploading}
                sx={{ background: 'linear-gradient(45deg,#1976d2,#42a5f5)', textTransform: 'none',
                  '&:hover': { background: 'linear-gradient(45deg,#1565c0,#1976d2)' } }}>
                {uploading ? 'Uploading…' : resumeName ? 'Replace' : 'Upload Resume'}
              </Button>
            </label>
            {resumeName && (
              <IconButton size="small" onClick={handleDelete} disabled={deleting}
                sx={{ color: 'rgba(255,100,100,0.7)', '&:hover': { color: '#f44336' } }}>
                {deleting ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </Box>

        {uploading && (
          <LinearProgress sx={{ mt: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(45deg,#1976d2,#42a5f5)' } }} />
        )}
        {uploadStatus && (
          <Alert severity={uploadStatus}
            icon={uploadStatus === 'success' ? <CheckCircle /> : undefined}
            sx={{ mt: 2 }} onClose={() => setUploadStatus(null)}>
            {uploadMsg}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const UserProfile = () => {
  // ── FIX: refreshUser bhi lo AuthContext se ──
  const { user, refreshUser } = useContext(AuthContext);
  const { profile, loading, updateProfile, fetchProfile } = useProfile();

  const [activeTab,  setActiveTab]  = useState(0);
  const [isEditing,  setIsEditing]  = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [draft,        setDraft]        = useState({});
  const [newSkill,     setNewSkill]     = useState('');
  const [newEducation, setNewEducation] = useState({ degree: '', institution: '', year: '', field: '' });

  useEffect(() => {
    if (profile) setDraft({ ...profile });
  }, [profile]);

  const handleEdit   = () => { setDraft({ ...profile }); setIsEditing(true);  setSaveStatus(null); };
  const handleCancel = () => { setDraft({ ...profile }); setIsEditing(false); setSaveStatus(null); };

  const handleSave = async () => {
    setSaving(true); setSaveStatus(null);
    try {
      await updateProfile(draft);
      await refreshUser?.();
      setSaveStatus('success');
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
  };

  const addSkill    = () => {
    const s = newSkill.trim();
    if (s && !draft.skills?.includes(s)) {
      setDraft(prev => ({ ...prev, skills: [...(prev.skills || []), s] }));
      setNewSkill('');
    }
  };
  const removeSkill = (idx) =>
    setDraft(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }));

  const addEducation = () => {
    if (newEducation.degree && newEducation.institution) {
      setDraft(prev => ({ ...prev, education: [...(prev.education || []), { ...newEducation }] }));
      setNewEducation({ degree: '', institution: '', year: '', field: '' });
    }
  };
  const removeEducation = (idx) =>
    setDraft(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }));

  const display = isEditing ? draft : profile;

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,#0f1419,#1a2332,#2d3748)' }}>
        <Typography variant="h4" sx={{ color: 'white' }}>Please login to view your profile</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f1419,#1a2332,#2d3748)',
      display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Container maxWidth="lg" sx={{ pt: 15, pb: 4, position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h2" sx={{ fontWeight: 800,
              background: 'linear-gradient(45deg,#42a5f5,#1976d2)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              My Profile
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
              Manage your professional profile — data synced with your account
            </Typography>
          </Box>
        </Fade>

        {/* ── Resume Section — DB se load hota hai, persist karta hai ── */}
        <ResumeUploadSection
          user={user}
          onUploadSuccess={async () => {
            await refreshUser?.();
            await fetchProfile();
          }}
        />

        {saveStatus === 'success' && <Alert severity="success" sx={{ mb: 2 }}>✅ Profile saved to your account!</Alert>}
        {saveStatus === 'error'   && <Alert severity="error"   sx={{ mb: 2 }}>❌ Failed to save. Please try again.</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#42a5f5' }} />
            <Typography sx={{ color: 'white', ml: 2, alignSelf: 'center' }}>Loading your profile...</Typography>
          </Box>
        ) : (
          <Card sx={{ background: 'rgba(26,35,50,0.8)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4 }}>

            {/* Header */}
            <Box sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', p: 4, color: 'white' }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Avatar sx={{ width: 100, height: 100, border: '4px solid rgba(255,255,255,0.3)',
                    fontSize: '2.5rem', background: 'linear-gradient(45deg,#1976d2,#42a5f5)' }}>
                    {(display?.name || user?.username || '?').charAt(0).toUpperCase()}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {display?.name || user?.username || 'Your Name'}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {display?.currentRole || 'Role not set'}
                    {display?.currentCompany ? ` at ${display.currentCompany}` : ''}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8 }}>
                    {display?.location || 'Location not set'}
                    {display?.skills?.length > 0 && ` • ${display.skills.length} skills`}
                  </Typography>
                </Grid>
                <Grid item>
                  {!isEditing ? (
                    <IconButton onClick={handleEdit}
                      sx={{ background: 'rgba(255,255,255,0.2)', color: 'white',
                        '&:hover': { background: 'rgba(255,255,255,0.3)' } }}>
                      <Edit />
                    </IconButton>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                      Editing...
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
                sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', '&.Mui-selected': { color: '#42a5f5' } },
                  '& .MuiTabs-indicator': { backgroundColor: '#42a5f5' } }}>
                <Tab icon={<Person />} label="Profile" />
                <Tab icon={<Work />}   label="Experience" />
                <Tab icon={<School />} label="Education" />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Profile Tab */}
              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>Personal Info</Typography>
                    {[
                      { label: 'Full Name', name: 'name'     },
                      { label: 'Email',     name: 'email'    },
                      { label: 'Phone',     name: 'phone'    },
                      { label: 'Location',  name: 'location' },
                    ].map(f => (
                      <TextField key={f.name} fullWidth label={f.label} name={f.name}
                        value={display?.[f.name] || ''}
                        onChange={handleChange}
                        disabled={!isEditing || f.name === 'email'}
                        sx={fieldSx} />
                    ))}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>Skills</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {(display?.skills || []).map((skill, idx) => (
                        <Chip key={idx} label={skill}
                          onDelete={isEditing ? () => removeSkill(idx) : undefined}
                          sx={{ background: 'linear-gradient(45deg,#1976d2,#42a5f5)', color: 'white',
                            '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' } }} />
                      ))}
                      {(!display?.skills || display.skills.length === 0) && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                          No skills yet — add manually
                        </Typography>
                      )}
                    </Box>
                    {isEditing && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField size="small" placeholder="Add skill" value={newSkill}
                          onChange={e => setNewSkill(e.target.value)}
                          onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                          sx={{ ...fieldSx, mb: 0, flex: 1 }} />
                        <Button variant="contained" onClick={addSkill} startIcon={<Add />} size="small"
                          sx={{ background: 'linear-gradient(45deg,#1976d2,#42a5f5)', whiteSpace: 'nowrap' }}>
                          Add
                        </Button>
                      </Box>
                    )}
                    <Typography variant="h6" sx={{ color: 'white', mt: 3, mb: 2, fontWeight: 600 }}>Bio</Typography>
                    <TextField fullWidth multiline rows={4} label="Bio / Summary" name="bio"
                      value={display?.bio || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      sx={fieldSx} />
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Experience Tab */}
              <TabPanel value={activeTab} index={1}>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>Work Experience</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Current Role" name="currentRole"
                      value={display?.currentRole || ''} onChange={handleChange}
                      disabled={!isEditing} sx={fieldSx} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Current Company" name="currentCompany"
                      value={display?.currentCompany || ''} onChange={handleChange}
                      disabled={!isEditing} sx={fieldSx} />
                  </Grid>
                </Grid>
                {(display?.workExperience || []).length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                      Experience History
                    </Typography>
                    {(display.workExperience || []).map((exp, idx) => (
                      <Card key={idx} sx={{ mb: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>{exp.title}</Typography>
                          <Typography variant="body1" sx={{ color: '#42a5f5' }}>{exp.company}</Typography>
                          {exp.duration    && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{exp.duration}</Typography>}
                          {exp.description && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>{exp.description}</Typography>}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </TabPanel>

              {/* Education Tab */}
              <TabPanel value={activeTab} index={2}>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>Education</Typography>
                {(display?.education || []).length === 0 && (
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', mb: 2 }}>
                    No education entries yet
                  </Typography>
                )}
                {(display?.education || []).map((edu, idx) => (
                  <Card key={idx} sx={{ mb: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                    {isEditing && (
                      <IconButton onClick={() => removeEducation(idx)}
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#f44336' } }}>
                        <Delete />
                      </IconButton>
                    )}
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>{edu.degree}</Typography>
                      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>{edu.institution}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {edu.field}{edu.year ? ` • ${edu.year}` : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                {isEditing && (
                  <Card sx={{ mb: 2, background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.3)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Add Education</Typography>
                      <Grid container spacing={2}>
                        {[
                          { label: 'Degree',          k: 'degree',      placeholder: 'e.g. B.Tech Computer Science' },
                          { label: 'Institution',     k: 'institution', placeholder: 'e.g. IIT Delhi' },
                          { label: 'Field of Study',  k: 'field',       placeholder: 'e.g. Computer Science' },
                          { label: 'Graduation Year', k: 'year',        placeholder: '2024' },
                        ].map(f => (
                          <Grid item xs={12} md={6} key={f.k}>
                            <TextField fullWidth label={f.label} placeholder={f.placeholder}
                              value={newEducation[f.k]}
                              onChange={e => setNewEducation(prev => ({ ...prev, [f.k]: e.target.value }))}
                              sx={fieldSx} />
                          </Grid>
                        ))}
                        <Grid item xs={12}>
                          <Button variant="contained" onClick={addEducation} startIcon={<Add />}
                            disabled={!newEducation.degree || !newEducation.institution}
                            sx={{ background: 'linear-gradient(45deg,#1976d2,#42a5f5)' }}>
                            Add Education
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </TabPanel>
            </CardContent>

            {/* Action buttons */}
            <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {isEditing && (
                <Button variant="outlined" onClick={handleCancel}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.05)' } }}>
                  Cancel
                </Button>
              )}
              <Button variant="contained"
                onClick={isEditing ? handleSave : handleEdit}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : isEditing ? <Save /> : <Edit />}
                disabled={saving}
                sx={{ background: 'linear-gradient(45deg,#1976d2,#42a5f5)',
                  '&:hover': { background: 'linear-gradient(45deg,#1565c0,#1976d2)' } }}>
                {saving ? 'Saving...' : isEditing ? 'Save to Account' : 'Edit Profile'}
              </Button>
            </Box>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default UserProfile;
