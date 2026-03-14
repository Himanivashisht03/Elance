//frontend/src/contexts/ProfileContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import config from '../config';

const { API_URL } = config;

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};

const getToken = () => localStorage.getItem('token');

const defaultProfile = {
  name: '', email: '', phone: '', location: '',
  currentRole: '', currentCompany: '', bio: '', summary: '',
  skills: [], education: [], workExperience: [],
  github: '', website: '',
  resumeFile: null, resumeUrl: null,
};

// DB user → profile state
const mapUserToProfile = (user) => ({
  name:           user.username        || user.name || '',
  email:          user.email           || '',
  phone:          user.phone           || '',
  location:       user.location        || '',
  bio:            user.bio             || '',
  summary:        user.bio             || '',
  currentRole:    user.careerGoals?.currentRole || '',
  currentCompany: user.currentCompany  || '',
  github:         user.socialLinks?.github   || user.github   || '',
  website:        user.socialLinks?.portfolio || user.website  || '',

  // ── Skills: DB mein [String] hai ──
  skills: Array.isArray(user.skills) ? user.skills : [],

  // ── Education: DB se map ──
  education: (user.education || []).map(e => ({
    degree:      e.degree      || '',
    institution: e.institution || '',
    field:       e.field       || '',
    year:        e.endYear     || e.startYear || '',
  })),

  // ── Work Experience: DB se map ──
  workExperience: (user.experience || []).map(e => ({
    title:       e.title       || '',
    company:     e.company     || '',
    location:    e.location    || '',
    duration:    e.startDate
      ? `${new Date(e.startDate).getFullYear()} - ${e.endDate ? new Date(e.endDate).getFullYear() : 'Present'}`
      : (e.duration || ''),
    description: e.description || '',
  })),

  // ── Resume: DB se (persist after logout) ──
  resumeFile: user.resumeName || null,
  resumeUrl:  user.resumeUrl  || null,
});

// profile state → backend payload
const mapProfileToPayload = (profile) => {
  const payload = {};
  if (profile.name           !== undefined) payload.username       = profile.name;
  if (profile.phone          !== undefined) payload.phone          = profile.phone;
  if (profile.location       !== undefined) payload.location       = profile.location;
  if (profile.bio            !== undefined) payload.bio            = profile.bio;
  if (profile.summary        !== undefined) payload.bio            = profile.summary;
  if (profile.currentCompany !== undefined) payload.currentCompany = profile.currentCompany;
  if (profile.currentRole    !== undefined) payload.careerGoals    = { currentRole: profile.currentRole };
  if (profile.github         !== undefined) payload.socialLinks    = { ...(payload.socialLinks||{}), github: profile.github };
  if (profile.website        !== undefined) payload.socialLinks    = { ...(payload.socialLinks||{}), portfolio: profile.website };

  // Skills — direct [String] array
  if (Array.isArray(profile.skills)) payload.skills = profile.skills;

  // Education
  if (Array.isArray(profile.education)) {
    payload.education = profile.education.map(e => ({
      degree:      e.degree      || '',
      institution: e.institution || '',
      field:       e.field       || '',
      startYear:   e.year        || '',
      endYear:     e.year        || '',
    }));
  }

  // Work Experience
  if (Array.isArray(profile.workExperience)) {
    payload.experience = profile.workExperience.map(e => ({
      title:       e.title       || '',
      company:     e.company     || '',
      location:    e.location    || '',
      description: e.description || '',
    }));
  }

  return payload;
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(false);

  // ── DB se profile load karo ──
  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setProfile(defaultProfile);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = mapUserToProfile(data.user);
        setProfile(mapped);
        // Lightweight cache (non-sensitive)
        localStorage.setItem('userProfile', JSON.stringify(mapped));
      } else {
        // Token invalid — cache clear karo
        localStorage.removeItem('userProfile');
        setProfile(defaultProfile);
      }
    } catch (err) {
      // Network error — cache se load karo
      const saved = localStorage.getItem('userProfile');
      if (saved) { try { setProfile(JSON.parse(saved)); } catch (_) {} }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Profile save to DB + state update ──
  const saveProfileToBackend = async (updatedProfile) => {
    const token = getToken();
    if (!token) return;
    try {
      const payload = mapProfileToPayload(updatedProfile);
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        // DB se fresh map karo (authoritative)
        const mapped = {
          ...mapUserToProfile(data.user),
          // Resume state preserve karo (alag route se save hoti hai)
          resumeFile: updatedProfile.resumeFile || mapUserToProfile(data.user).resumeFile,
          resumeUrl:  updatedProfile.resumeUrl  || mapUserToProfile(data.user).resumeUrl,
        };
        setProfile(mapped);
        localStorage.setItem('userProfile', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const updateProfile = async (updates) => {
    const merged = { ...profile, ...updates };
    setProfile(merged); // Optimistic update
    localStorage.setItem('userProfile', JSON.stringify(merged));
    return await saveProfileToBackend(merged);
  };

  const integrateResumeData = async (analysisData) => {
    if (!analysisData) return;
    const merged = {
      ...profile,
      name:           analysisData.personalInfo?.name        || profile.name,
      email:          analysisData.personalInfo?.email       || profile.email,
      phone:          analysisData.personalInfo?.phone       || profile.phone,
      location:       analysisData.personalInfo?.location    || profile.location,
      currentRole:    analysisData.currentRole               || profile.currentRole,
      currentCompany: analysisData.currentCompany            || profile.currentCompany,
      skills: analysisData.skills
        ? [...new Set([...profile.skills, ...analysisData.skills])]
        : profile.skills,
      education: analysisData.education
        ? [...profile.education, ...analysisData.education.map(e => ({
            degree: e.degree||'', institution: e.institution||'',
            year: e.year||'', field: e.field||e.degree||'',
          }))]
        : profile.education,
      workExperience: analysisData.experience
        ? [...(profile.workExperience||[]), ...analysisData.experience.map(e => ({
            title: e.title||'', company: e.company||'',
            duration: e.duration||'', description: e.description||'',
          }))]
        : profile.workExperience||[],
    };
    setProfile(merged);
    localStorage.setItem('userProfile', JSON.stringify(merged));
    await saveProfileToBackend(merged);
    return merged;
  };

  // ── Logout pe profile clear ──
  const resetProfile = () => {
    setProfile(defaultProfile);
    localStorage.removeItem('userProfile');
    localStorage.removeItem('resumeAnalysis');
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, integrateResumeData, resetProfile, fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
