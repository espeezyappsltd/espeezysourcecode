// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   await prisma.article.createMany({
//     data: [
//       {
//         title: 'Welcome to Espeezy',
//         slug: 'welcome-to-espeezy',
//         content: 'This is the first article on Espeezy!',
//         author: 'Admin',
//         published: true,
//         metaTitle: 'Welcome to Espeezy',
//         metaDescription: 'Introduction to Espeezy platform.',
//         metaImage: '/assets/screenshots/welcome.png',
//       },
//       {
//         title: 'How to Use Espeezy',
//         slug: 'how-to-use-espeezy',
//         content: 'A guide on how to use the Espeezy platform.',
//         author: 'Admin',
//         published: true,
//         metaTitle: 'How to Use Espeezy',
//         metaDescription: 'Step-by-step guide for new users.',
//         metaImage: '/assets/screenshots/guide.png',
//       },
//       {
//         title: 'Espeezy Roadmap',
//         slug: 'espeezy-roadmap',
//         content: 'Upcoming features and plans for Espeezy.',
//         author: 'Admin',
//         published: true,
//         metaTitle: 'Espeezy Roadmap',
//         metaDescription: 'What’s next for Espeezy.',
//         metaImage: '/assets/screenshots/roadmap.png',
//       },
//     ],
//   });
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
