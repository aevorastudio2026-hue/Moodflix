const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const movies = [
  {
    title: 'The Dark Knight',
    genre: 'Action',
    mood: 'Exciting',
    rating: 9.0,
    releaseYear: 2008,
    description: 'Batman faces the Joker in this epic crime thriller that explores the thin line between heroism and chaos.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'
  },
  {
    title: 'Inception',
    genre: 'Sci-Fi',
    mood: 'Mind-Bending',
    rating: 8.8,
    releaseYear: 2010,
    description: 'A thief who enters dreams to steal secrets is given a chance at redemption by performing the impossible: planting an idea in someone\'s mind.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'
  },
  {
    title: 'The Shawshank Redemption',
    genre: 'Drama',
    mood: 'Inspiring',
    rating: 9.3,
    releaseYear: 1994,
    description: 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
  },
  {
    title: 'Forrest Gump',
    genre: 'Drama',
    mood: 'Inspiring',
    rating: 8.8,
    releaseYear: 1994,
    description: 'A man with a low IQ but good intentions experiences key historical events while never losing his kindness.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/arw2vcBgqO43wQkQhTdidJ9KWLE.jpg'
  },
  {
    title: 'The Grand Budapest Hotel',
    genre: 'Comedy',
    mood: 'Fun',
    rating: 8.1,
    releaseYear: 2014,
    description: 'A legendary concierge and his loyal lobby boy become embroiled in a battle over a priceless painting.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/eWdyRC8y3YhGzRgBmZWrcH0kxKz.jpg'
  },
  {
    title: 'Parasite',
    genre: 'Thriller',
    mood: 'Suspenseful',
    rating: 8.6,
    releaseYear: 2019,
    description: 'A poor family schemes to infiltrate a wealthy household, leading to unexpected and violent consequences.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'
  },
  {
    title: 'Interstellar',
    genre: 'Sci-Fi',
    mood: 'Mind-Bending',
    rating: 8.6,
    releaseYear: 2014,
    description: 'A team of explorers travels through a wormhole in space to ensure humanity\'s survival.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
  },
  {
    title: 'The Matrix',
    genre: 'Action',
    mood: 'Exciting',
    rating: 8.7,
    releaseYear: 1999,
    description: 'A computer hacker learns the true nature of reality and his role in the war against its controllers.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'
  },
  {
    title: 'Spirited Away',
    genre: 'Animation',
    mood: 'Mesmerizing',
    rating: 8.6,
    releaseYear: 2001,
    description: 'A young girl enters a spirit world to save her parents who have been turned into pigs.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'
  },
  {
    title: 'The Godfather',
    genre: 'Crime',
    mood: 'Epic',
    rating: 9.2,
    releaseYear: 1972,
    description: 'An organized crime dynasty\'s aging patriarch transfers control to his reluctant son.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg'
  },
  {
    title: 'Whiplash',
    genre: 'Drama',
    mood: 'Intense',
    rating: 8.5,
    releaseYear: 2014,
    description: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams are mentored by an instructor who will stop at nothing to realize a student\'s potential.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/lIv1QinFqz4dlp5U4lQ6HaiskOZ.jpg'
  },
  {
    title: 'Get Out',
    genre: 'Horror',
    mood: 'Scary',
    rating: 7.7,
    releaseYear: 2017,
    description: 'A young African-American visits his white girlfriend\'s parents for the weekend, where the simmering uneasiness about their reception of him eventually reaches a boiling point.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/tfxHxk23N61jKq4ViRQf5oHTUII.jpg'
  },
  {
    title: 'Before Sunrise',
    genre: 'Romance',
    mood: 'Nostalgic',
    rating: 8.1,
    releaseYear: 1995,
    description: 'A young man and woman meet on a train in Europe, and wind up spending one evening together in Vienna.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/kjI03yzj2ZdKZz2vZRjePufQJAE.jpg'
  },
  {
    title: 'The Office (US)',
    genre: 'Comedy',
    mood: 'Easy Watch',
    rating: 8.9,
    releaseYear: 2005,
    description: 'A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjV2j18G3Tka.jpg'
  },
  {
    title: 'Grave of the Fireflies',
    genre: 'Animation',
    mood: 'Tearjerker',
    rating: 8.5,
    releaseYear: 1988,
    description: 'Two siblings struggle to survive in Japan during World War II.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/k6y7s2D2gDqJ1njKwJ3jyK7g8l5.jpg'
  },
  {
    title: 'Rocky',
    genre: 'Sport',
    mood: 'Motivational',
    rating: 8.1,
    releaseYear: 1976,
    description: 'A small-time boxer gets a supremely rare chance to fight a heavy-weight champion in a bout in which he strives to go the distance for his self-respect.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/tDJscakqjfL4doN5r5uV3OqQ3Jx.jpg'
  },
  {
    title: 'Blade Runner 2049',
    genre: 'Sci-Fi',
    mood: 'Late Night',
    rating: 8.0,
    releaseYear: 2017,
    description: 'A young blade runner\'s discovery of a long-buried secret leads him to track down former blade runner Rick Deckard, who\'s been missing for thirty years.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg'
  },
  {
    title: 'The Pianist',
    genre: 'Drama',
    mood: 'Dramatic',
    rating: 8.5,
    releaseYear: 2002,
    description: 'A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto of World War II.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/2hFv7d11jLQqBt0eqoG3Nj5Jk4E.jpg'
  },
  {
    title: 'Memento',
    genre: 'Mystery',
    mood: 'Mind-Bending',
    rating: 8.4,
    releaseYear: 2000,
    description: 'A man with short-term memory loss attempts to track down his wife\'s murderer by using notes and tattoos.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg'
  }
];

async function main() {
  console.log('🌱 Seeding database with English movies...');
  
  for (const movie of movies) {
    await prisma.movie.upsert({
      where: { title: movie.title },
      update: { 
        genre: movie.genre,
        mood: movie.mood,
        rating: movie.rating,
        releaseYear: movie.releaseYear,
        description: movie.description,
        posterUrl: movie.posterUrl
      },
      create: movie
    });
    console.log(`✅ Added/Updated: ${movie.title} [${movie.mood}]`);
  }
  
  console.log(`🎬 Successfully seeded ${movies.length} movies in English!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });