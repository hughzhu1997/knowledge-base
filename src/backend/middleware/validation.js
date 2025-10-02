// validation.js
// Validation middleware for common request validation and data sanitization

/**
 * Validate that required fields are present in request body
 * @param {Array<string>} fields - Array of required field names
 * @returns {Function} Express middleware function
 */
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    fields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: `The following fields are required: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    next();
  };
};

/**
 * Validate email format using regex pattern
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }
  }

  next();
};

/**
 * Validate password strength and length requirements
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'Password must be at least 6 characters long'
      });
    }
  }

  next();
};

/**
 * Validate UUID format for route parameters
 * @param {string} paramName - Name of the parameter to validate (default: 'id')
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        error: 'Invalid ID format',
        message: 'The provided ID is not a valid UUID'
      });
    }

    next();
  };
};

/**
 * Validate document category against allowed values
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const validateCategory = (req, res, next) => {
  const { category } = req.body;
  const validCategories = ['prd', 'architecture', 'api', 'db', 'code', 'dependency', 'tech', 'tools', 'security', 'tutorial', 'other'];
  
  if (category && !validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid category',
      message: `Category must be one of: ${validCategories.join(', ')}`,
      validCategories
    });
  }
  
  next();
};

/**
 * Validate document type against allowed values
 * Validates docType field for document creation and updates
 * Supports: SOP (Standard Operating Procedure), Review, Research, General
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const validateDocType = (req, res, next) => {
  const { docType } = req.body;
  const validDocTypes = ['SOP', 'Review', 'Research', 'General'];
  
  // Only validate if docType is provided (optional field for backward compatibility)
  if (docType && !validDocTypes.includes(docType)) {
    return res.status(400).json({
      error: 'Invalid document type',
      message: `Document type must be one of: ${validDocTypes.join(', ')}`,
      validDocTypes
    });
  }
  
  next();
};

module.exports = {
  validateRequired,
  validateEmail,
  validatePassword,
  validateObjectId,
  validateCategory,
  validateDocType
};
