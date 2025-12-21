const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// User validation rules
const userValidation = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .optional()
      .isIn(['GOON', 'HASHIRA', 'OYAKATASAMA'])
      .withMessage('Invalid role')
  ],
  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username or email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  update: [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must not exceed 500 characters')
  ]
};

// Task validation rules
const taskValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('bountyAmount')
      .isFloat({ min: 0 })
      .withMessage('Bounty amount must be a positive number'),
    body('deadline')
      .isISO8601()
      .withMessage('Deadline must be a valid date')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Deadline must be in the future');
        }
        return true;
      }),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('bountyAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Bounty amount must be a positive number'),
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
    body('status')
      .optional()
      .isIn(['AVAILABLE', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'])
      .withMessage('Invalid status')
  ],
  updateStatus: [
    body('status')
      .isIn(['AVAILABLE', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'])
      .withMessage('Invalid status')
  ]
};

// License validation rules
const licenseValidation = {
  create: [
    body('teamName')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Team name must be between 3 and 100 characters'),
    body('licenseKey')
      .trim()
      .notEmpty()
      .withMessage('License key is required'),
    body('expirationDate')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be a valid date'),
    body('maxUsers')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max users must be at least 1')
  ]
};

module.exports = {
  validate,
  userValidation,
  taskValidation,
  licenseValidation
};
