const HttpStatusCode = {
  OK: { code: 200, message: 'OK' },
  CREATED: { code: 201, message: 'Created' },
  BAD_REQUEST: { code: 400, message: 'Bad Request' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'Forbidden || Account blocked' },
  USER_IS_NOT_ACTIVE: {
    code: 403,
    message: 'Inactive User || Account blocked',
  },
  NOT_FOUND: { code: 404, message: 'Not Found' },

  EXISTING_PHONE_NUMBER: {
    code: 409,
    defaultMessage: 'Phone number already exists',
  },
  EXISTING_EMAIL: {
    code: 409,
    defaultMessage: 'Emails already exist',
  },
  EXISTING_USERNAME: {
    code: 409,
    defaultMessage: 'Username already exists',
  },

  INTERNAL_SERVER_ERROR: {
    code: 500,
    defaultMessage: 'Internal Server Error',
  },

  NOUSERFOUND: { code: 404, message: 'No USER FOUND.' },
};

export default HttpStatusCode;
