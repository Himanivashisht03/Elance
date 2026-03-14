//backend\routes\test.js
const express = require('express');
const router = express.Router();
const sendOTP = require('../utils/sendOTP');

// Test route for sending OTP
router.post('/test-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const testOTP = '123456'; // Test OTP
        
        console.log('Attempting to send test OTP to:', email);
        
        await sendOTP(email, testOTP);
        
        res.json({ 
            success: true, 
            message: 'Test OTP sent successfully',
            email
        });
    } catch (error) {
        console.error('Test OTP Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send test OTP',
            error: error.message 
        });
    }
});

module.exports = router;