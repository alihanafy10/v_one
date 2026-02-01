const { validationResult } = require('express-validator');

// Check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_FAILED',
      details: errors.array()
    });
  }
  
  next();
};

module.exports = {
  checkValidation
};
