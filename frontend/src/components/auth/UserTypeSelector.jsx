//frontend\src\components\auth\UserTypeSelector.jsx
import React from 'react';
import './Auth.css';

const UserTypeSelector = ({ userType, setUserType }) => {
  return (
    <div className="user-type-selector">
      <p>I am a:</p>
      <div className="user-type-options">
        <button
          type="button"
          className={`user-type-btn ${userType === 'jobSeeker' ? 'active' : ''}`}
          onClick={() => setUserType('jobSeeker')}
        >
          Job Seeker
        </button>
        <button
          type="button"
          className={`user-type-btn ${userType === 'recruiter' ? 'active' : ''}`}
          onClick={() => setUserType('recruiter')}
        >
          Recruiter
        </button>
      </div>
    </div>
    
  );
};

export default UserTypeSelector;