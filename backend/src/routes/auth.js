const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { checkValidation } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');

// Login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], checkValidation, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username }).populate('stationId', 'name stationCode');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        stationId: user.stationId._id,
        stationName: user.stationId.name,
        stationCode: user.stationId.stationCode
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Verify token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-passwordHash')
      .populate('stationId', 'name stationCode');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'User not found or inactive'
      });
    }
    
    res.json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        stationId: user.stationId._id,
        stationName: user.stationId.name
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Verification failed'
    });
  }
});

// Logout (optional - mainly for cleanup)
router.post('/logout', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
