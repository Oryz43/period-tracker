import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.bookmark.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.prediction.deleteMany({});
  await prisma.cycleRecord.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding data...');

  // Create a default user matching the wireframe: "Oryza"
  const user = await prisma.user.create({
    data: {
      name: 'Oryza',
      email: 'oryza@example.com',
      password: 'hashed_password_123', // In real apps, hash with bcrypt/argon2
      cycleLength: 28,
      periodLength: 5,
      periodReminder: true,
      fertileReminder: true,
      dailyTips: true,
    },
  });

  console.log(`Created default user: ${user.name}`);

  // Create some historic cycle records for user to simulate insights page correctly
  const now = new Date();
  
  // Last cycle (approx 28 days ago)
  const lastCycleStart = new Date();
  lastCycleStart.setDate(now.getDate() - 28);
  const lastCycleEnd = new Date();
  lastCycleEnd.setDate(lastCycleStart.getDate() + 4);

  // Two cycles ago
  const prevCycleStart = new Date();
  prevCycleStart.setDate(now.getDate() - 56);
  const prevCycleEnd = new Date();
  prevCycleEnd.setDate(prevCycleStart.getDate() + 5);

  // Three cycles ago
  const threeCyclesStart = new Date();
  threeCyclesStart.setDate(now.getDate() - 84);
  const threeCyclesEnd = new Date();
  threeCyclesEnd.setDate(threeCyclesStart.getDate() + 5);

  await prisma.cycleRecord.createMany({
    data: [
      {
        userId: user.id,
        startDate: threeCyclesStart,
        endDate: threeCyclesEnd,
        flowIntensity: 'Medium',
        symptoms: ['Cramps', 'Fatigue'],
        mood: 'Sensitive',
        notes: 'Slightly emotional in the afternoon.',
      },
      {
        userId: user.id,
        startDate: prevCycleStart,
        endDate: prevCycleEnd,
        flowIntensity: 'Heavy',
        symptoms: ['Cramps', 'Headache', 'Bloating'],
        mood: 'Calm',
        notes: 'Felt very tired on day 2. Drank lots of warm water.',
      },
      {
        userId: user.id,
        startDate: lastCycleStart,
        endDate: lastCycleEnd,
        flowIntensity: 'Medium',
        symptoms: ['Cramps', 'Headache'],
        mood: 'Sensitive',
        notes: 'Normal pain level, sleep was good.',
      }
    ],
  });

  console.log('Seeded previous cycle records.');

  // Predictions
  const nextPredictedStart = new Date();
  nextPredictedStart.setDate(now.getDate() + 5); // In 5 days!
  const nextPredictedEnd = new Date();
  nextPredictedEnd.setDate(nextPredictedStart.getDate() + 5);

  const nextOvulation = new Date();
  nextOvulation.setDate(nextPredictedStart.getDate() - 14); // Ovulation is usually 14 days before next period

  const fertileStart = new Date();
  fertileStart.setDate(nextOvulation.getDate() - 5);
  const fertileEnd = new Date();
  fertileEnd.setDate(nextOvulation.getDate() + 1);

  await prisma.prediction.create({
    data: {
      userId: user.id,
      predictedStart: nextPredictedStart,
      predictedEnd: nextPredictedEnd,
      ovulationDate: nextOvulation,
      fertileStart: fertileStart,
      fertileEnd: fertileEnd,
    },
  });

  console.log('Seeded future projections.');

  // Create articles
  const articles = await prisma.article.createMany({
    data: [
      {
        title: 'Memahami Fase Siklus Menstruasi Anda',
        category: 'Education',
        content: `Siklus menstruasi terdiri dari empat fase utama:
Fase Menstruasi: Luruhnya dinding rahim saat sel telur tidak dibuahi. Biasanya berlangsung 3-7 hari.
Fase Folikular: Hormon estrogen meningkat untuk mempersiapkan sel telur baru berkembang di ovarium.
Fase Ovulasi: Pelepasan sel telur matang dari ovarium, waktu paling subur bagi wanita.
Fase Luteal: Pembentukan korpus luteum untuk mempersiapkan kehamilan jika ada pembuahan, atau memicu menstruasi baru.`,
        readTime: '4 min read',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2620',
      },
      {
        title: 'Makanan Terbaik untuk Mengurangi Kram Perut',
        category: 'Nutrition',
        content: `Mengonsumsi makanan kaya magnesium, asam lemak omega-3, dan kalsium dapat membantu menenangkan otot-otot rahim Anda selama siklus PMS:
- Pisang (kaya akan B6 dan magnesium untuk mengurangi kembung)
- Sayuran hijau tua seperti bayam dan brokoli (tinggi zat besi)
- Salmon & biji chia (meredakan inflamasi kram perut)
- Teh jahe hangat hangat untuk membantu sirkulasi darah`,
        readTime: '3 min read',
        imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2620',
      },
      {
        title: 'Olahraga Ringan Saat Menstruasi: Boleh atau Tidak?',
        category: 'Fitness',
        content: `Melakukan aktivitas fisik ringan seperti yoga, berjalan santai, atau stretching sangat dianjurkan saat menstruasi. Gerakan ringan merangsang pelepasan endorfin yang dapat bertindak sebagai pereda nyeri alami serta membantu mood Anda tetap stabil. Hindari latihan intensitas tinggi (HIIT) jika tubuh terasa lemas atau sedang merasakan kram perut hebat.`,
        readTime: '5 min read',
        imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2620',
      },
      {
        title: 'Menjaga Kesehatan Mental Selama PMS (Premenstrual Syndrome)',
        category: 'Mind',
        content: `Fluktuasi serotonin dan hormon reproduksi sering kali menyebabkan ketidakstabilan emosi sebelum menstruasi dimulai. Latihlah meditasi pernapasan dalam, buatlah jurnal harian tentang perasaan Anda, batasi asupan kafein dan gula berlebih yang dapat meningkatkan kecemasan, serta ambil waktu istirahat yang berkualitas tanpa rasa bersalah.`,
        readTime: '6 min read',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2620',
      }
    ],
  });

  console.log('Seeded educational wellness articles.');
  console.log('Prisma seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
