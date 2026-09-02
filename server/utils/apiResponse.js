/**
 * Consistent success/error response shape used across all controllers.
 * Keeping this uniform makes the frontend's Axios error handling trivial.
 */
function success(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function error(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { success, error };
