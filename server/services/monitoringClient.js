const axios = require('axios');

const pythonClient = axios.create({
  baseURL: process.env.PYTHON_MONITORING_URL || 'http://localhost:8000',
  timeout: 8000, // a hung frame analysis shouldn't hang the whole request
});

/**
 * Sends one base64 frame to the Python service for analysis.
 * Throws on network failure / non-2xx — the caller (monitoringController)
 * is responsible for turning that into a clear, honest API response
 * rather than a silent fake result.
 */
async function analyzeFrame(base64Frame) {
  const { data } = await pythonClient.post('/analyze', { frame: base64Frame });
  return data;
}

module.exports = { analyzeFrame };
