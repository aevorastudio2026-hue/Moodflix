require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'moodflix_super_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
};