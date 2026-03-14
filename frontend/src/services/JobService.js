// frontend/src/services/JobService.js
import { authService } from './AuthService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const jobService = {
  // Get auth headers
  getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },

  // Post new job
async postJob(jobData) {
  try {
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to post job');
    }

    return data;
  } catch (error) {
    console.error('Post job error:', error);
    throw error;
  }
},

  // Get all jobs (for job seekers)
  async getAllJobs(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/jobs?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch jobs');
      }

      return data;
    } catch (error) {
      console.error('Get jobs error:', error);
      throw error;
    }
  },

  // Get recruiter's posted jobs
  async getRecruiterJobs() {
    try {
      const response = await fetch(`${API_URL}/jobs/recruiter`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch recruiter jobs');
      }

      return data;
    } catch (error) {
      console.error('Get recruiter jobs error:', error);
      throw error;
    }
  },

  // Update job
  async updateJob(jobId, jobData) {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(jobData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update job');
      }

      return data;
    } catch (error) {
      console.error('Update job error:', error);
      throw error;
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete job');
      }

      return data;
    } catch (error) {
      console.error('Delete job error:', error);
      throw error;
    }
  },

  // Update job status
  async updateJobStatus(jobId, status) {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}/status/${status}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update job status');
      }

      return data;
    } catch (error) {
      console.error('Update job status error:', error);
      throw error;
    }
  },

  // Apply for a job
  async applyForJob(jobId, coverLetter = '') {
    try {
      const response = await fetch(`${API_URL}/jobs/apply`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ jobId, coverLetter })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to apply for job');
      }

      return data;
    } catch (error) {
      console.error('Apply for job error:', error);
      throw error;
    }
  },

  // Get job applications (for recruiter)
  async getJobApplications(jobId) {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}/applications`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
      }

      return data;
    } catch (error) {
      console.error('Get applications error:', error);
      throw error;
    }
  },

  // Get user's applications (for job seeker)
  async getUserApplications() {
    try {
      const response = await fetch(`${API_URL}/jobs/applications/my`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch your applications');
      }

      return data;
    } catch (error) {
      console.error('Get user applications error:', error);
      throw error;
    }
  },

  // Update application status (for recruiter)
  async updateApplicationStatus(applicationId, status, notes = '') {
    try {
      const response = await fetch(`${API_URL}/jobs/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, notes })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update application status');
      }

      return data;
    } catch (error) {
      console.error('Update application status error:', error);
      throw error;
    }
  },
  

  // Get application statistics (for recruiter)
  async getApplicationStats() {
    try {
      const response = await fetch(`${API_URL}/jobs/applications/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch application stats');
      }

      return data;
    } catch (error) {
      console.error('Get application stats error:', error);
      throw error;
    }
  },

  // Toggle save/unsave job
  async toggleSaveJob(jobId) {
    try {
      const response = await fetch(`${API_URL}/auth/save-job/${jobId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save job');
      return data;
    } catch (error) {
      console.error('Save job error:', error);
      throw error;
    }
  },

  // Get saved jobs
  async getSavedJobs() {
    try {
      const response = await fetch(`${API_URL}/auth/saved-jobs`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch saved jobs');
      return data.savedJobs || [];
    } catch (error) {
      console.error('Get saved jobs error:', error);
      throw error;
    }
  },

  // Get public jobs (no auth)
  async getPublicJobs(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/jobs/public?${queryParams}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch jobs');
      return data;
    } catch (error) {
      console.error('Get public jobs error:', error);
      throw error;
    }
  },

  // Get job seeker analytics
  async getJobSeekerAnalytics() {
    try {
      const response = await fetch(`${API_URL}/auth/analytics`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch analytics');
      return data;
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Get current user profile from backend
  async getMyProfile() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
      return data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  // Get platform stats (for landing page)
async getPlatformStats() {
  try {
    const response = await fetch(`${API_URL}/jobs/stats`, {
      method: 'GET'
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch platform stats');
    }

    return data;
  } catch (error) {
    console.error('Get platform stats error:', error);
    throw error;
  }
},
// JobService.js mein getPlatformStats ke baad yeh add karo:

  // Get public stats (no auth) — for landing page
  async getPublicStats() {
    try {
      const response = await fetch(`${API_URL}/jobs/public/stats`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch stats');
      return data;
    } catch (error) {
      console.error('Get public stats error:', error);
      throw error;
    }
  },
};