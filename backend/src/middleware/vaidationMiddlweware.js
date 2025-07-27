const helpers = require('../utils/helpers.js');
const { ERROR_CODES } = require('../utils/constants.js');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json(
        helpers.createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          error.details[0].message
        )
      );
    }
    
    next();
  };
};

module.exports = { validate };