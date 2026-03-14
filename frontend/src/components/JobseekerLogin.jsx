//frontend\src\components\JobseekerLogin.jsx
import { useState } from 'react';

const JobseekerLogin = ({ darkMode, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) {
      // Send OTP logic
      setOtpSent(true);
    } else {
      // Verify OTP logic
      onLogin();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-8 max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
            {otpSent ? 'Enter OTP' : 'Jobseeker Login'}
          </h3>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!otpSent ? (
            <div className="mb-4">
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                }`}
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Enter OTP sent to {email}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                }`}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-semibold ${
              darkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            } mb-4`}
          >
            {otpSent ? 'Verify & Login' : 'Get OTP'}
          </button>

          <div className="flex items-center my-4">
            <div className={`flex-grow h-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <span className={`px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>OR</span>
            <div className={`flex-grow h-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              type="button"
              className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <img src="/google-icon.png" alt="Google" className="h-6" />
            </button>
            <button
              type="button"
              className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <img src="/linkedin-icon.png" alt="LinkedIn" className="h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobseekerLogin;