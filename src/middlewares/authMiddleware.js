const { verifyToken } = require('../utils/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../utils/prisma');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('[authMiddleware] Token received:', token.substring(0, 30) + '...');
  console.log('[authMiddleware] JWT_SECRET from config:', require('../config').JWT_SECRET.substring(0, 10) + '...');

  try {
    const decoded = verifyToken(token);
    console.log('[authMiddleware] Token decoded:', JSON.stringify(decoded));
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, createdAt: true }
    });
    console.log('[authMiddleware] User found:', user);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[authMiddleware] Error:', error.message, error.stack);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

module.exports = authMiddleware;