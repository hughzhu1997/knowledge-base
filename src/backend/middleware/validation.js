// Validation middleware for common request validation

// Validate required fields
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

// Validate email format
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

// Validate password strength
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

// Validate UUID
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

// Validate document category
const validateCategory = (req, res, next) => {
  const { category } = req.body;
  const validCategories = ['prd', 'architecture', 'api', 'db', 'code', 'dependency'];
  
  if (category && !validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid category',
      message: `Category must be one of: ${validCategories.join(', ')}`,
      validCategories
    });
  }

  next();
};

module.exports = {
  validateRequired,
  validateEmail,
  validatePassword,
  validateObjectId,
  validateCategory
};
