const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../utils/prisma');

const preferenceSchema = z.object({
  likedGenres: z.array(z.string()).optional(),
  dislikedGenres: z.array(z.string()).optional(),
  likedMoods: z.array(z.string()).optional(),
  dislikedMoods: z.array(z.string()).optional(),
  likedKeywords: z.array(z.string()).optional(),
  dislikedKeywords: z.array(z.string()).optional(),
});

function parseJsonArray(str) {
  try {
    return JSON.parse(str || '[]');
  } catch {
    return [];
  }
}

function serializeArray(arr) {
  return JSON.stringify(arr || []);
}

async function getPreferences(req, res) {
  try {
    const userId = req.user.id;

    const preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      return res.json({
        success: true,
        data: {
          likedGenres: [],
          dislikedGenres: [],
          likedMoods: [],
          dislikedMoods: [],
          likedKeywords: [],
          dislikedKeywords: [],
        },
      });
    }

    return res.json({
      success: true,
      data: {
        likedGenres: parseJsonArray(preference.likedGenres),
        dislikedGenres: parseJsonArray(preference.dislikedGenres),
        likedMoods: parseJsonArray(preference.likedMoods),
        dislikedMoods: parseJsonArray(preference.dislikedMoods),
        likedKeywords: parseJsonArray(preference.likedKeywords),
        dislikedKeywords: parseJsonArray(preference.dislikedKeywords),
      },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updatePreferences(req, res) {
  try {
    const userId = req.user.id;

    const parseResult = preferenceSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const {
      likedGenres,
      dislikedGenres,
      likedMoods,
      dislikedMoods,
      likedKeywords,
      dislikedKeywords,
    } = parseResult.data;

    const preference = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        likedGenres: serializeArray(likedGenres),
        dislikedGenres: serializeArray(dislikedGenres),
        likedMoods: serializeArray(likedMoods),
        dislikedMoods: serializeArray(dislikedMoods),
        likedKeywords: serializeArray(likedKeywords),
        dislikedKeywords: serializeArray(dislikedKeywords),
      },
      create: {
        userId,
        likedGenres: serializeArray(likedGenres),
        dislikedGenres: serializeArray(dislikedGenres),
        likedMoods: serializeArray(likedMoods),
        dislikedMoods: serializeArray(dislikedMoods),
        likedKeywords: serializeArray(likedKeywords),
        dislikedKeywords: serializeArray(dislikedKeywords),
      },
    });

    return res.json({
      success: true,
      message: 'Preferences updated',
      data: {
        likedGenres: parseJsonArray(preference.likedGenres),
        dislikedGenres: parseJsonArray(preference.dislikedGenres),
        likedMoods: parseJsonArray(preference.likedMoods),
        dislikedMoods: parseJsonArray(preference.dislikedMoods),
        likedKeywords: parseJsonArray(preference.likedKeywords),
        dislikedKeywords: parseJsonArray(preference.dislikedKeywords),
      },
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getPreferences, updatePreferences };