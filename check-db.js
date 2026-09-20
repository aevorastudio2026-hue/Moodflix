const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const movies = await prisma.movie.findMany({ take: 5 });
  console.log('Movies in DB:', movies.length);
  movies.forEach(m => console.log(m.id, m.title));
}
main().catch(console.error).finally(() => prisma.$disconnect());