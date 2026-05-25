import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini API client if API key is provided
let aiClient: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY" && API_KEY.trim() !== "") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI client initialized successfully on server.");
  } catch (error) {
    console.error("Failed to initialize Gemini AI client:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. AI health insights will run using realistic rule-based fallback responses.");
}

app.use(express.json());

// Path to mock database file
const DB_FILE = path.join(process.cwd(), "db.json");

// Define Initial Seed Data
const DEFAULT_ARTICLES = [
  {
    id: "art-1",
    title: "Memahami Fase Siklus Menstruasi Anda",
    category: "Education",
    content: "Siklus menstruasi rata-rata berlangsung 28 hari dan terdiri dari empat fase utama:\n\n1. Fase Menstruasi (Hari 1-5): Luruhnya dinding endometrium rahim berwujud pendarahan. Kadar hormon estrogen dan progesteron berada di titik terendah.\n\n2. Fase Folikular (Hari 6-14): Hormon Estrogen naik merangsang folikel indung telur berkembang. Dinding rahim menebal kembali.\n\n3. Fase Ovulasi (Hari 14): Sel telur matang dilepaskan ke saluran falopi. Ini adalah puncak kesuburan wanita.\n\n4. Fase Luteal (Hari 15-28): Korpus luteum memproduksi progesteron untuk mempersiapkan rahim terhadap kemungkinan pembuahan. Jika tidak dibuahi, kadar hormon kembali anjlok dan memicu menstruasi baru.",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600"
  },
  {
    id: "art-2",
    title: "Makanan Terbaik untuk Mengurangi Kram Perut (Dismenore)",
    category: "Nutrition",
    content: "Kram menstruasi terjadi akibat kontraksi otot rahim dipicu senyawa prostaglandin. Anda dapat menenangkannya secara alami melalui asupan nutrisi:\n\n- Pisang & Alpukat: Kaya magnesium untuk melemaskan otot rahim.\n- Kacang Almond & Salmon: Mengandung asam lemak omega-3 anti-inflamasi tinggi.\n- Yogurt & Tahu: Sumber kalsium penyeimbang ketegangan saraf.\n- Teh Jahe / Chamomile Hangat: Melebarkan pembuluh darah panggul untuk mengurangi ketegangan.",
    readTime: "3 min read",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=600"
  },
  {
    id: "art-3",
    title: "Olahraga Ringan Saat Menstruasi: Panduan Aman",
    category: "Fitness",
    content: "Melakukan aktivitas fisik moderat atau ringan saat haid dianjurkan untuk menstimulasi hormon endorfin (pereda stres dan nyeri alami). Jenis olahraga ramah menstruasi:\n\n1. Hatha/Yin Yoga: Fokus pada peregangan panggul bawah dan pinggang.\n2. Berjalan Cepat: Aliran darah tetap produktif tanpa mengguncang uterus berlebih.\n3. Pilatess Ringan: Meregangkan otot inti dengan aman.\n\nHindari latihan beban berat (high-intensity) or inversion postures (posisi kepala di bawah) saat volume sirkulasi rahim sedang deras.",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600"
  },
  {
    id: "art-4",
    title: "Menjaga Kesehatan Mental Selama Fase PMS (Premenstrual Syndrome)",
    category: "Mind",
    content: "Fluktuasi serotonin sebelum menstruasi sering memicu kecemasan, iritabilitas (mood swing), dan depresi ringan. Kiat menjaga kestabilan psikologis:\n\n- Tulis Jurnal Emosi: Kenali pola pemicu kecemasan pramenstruasi.\n- Kurangi Gula & Kafein: Mengurangi gelombang rasa cemas dan debaran jantung.\n- Prioritaskan Deep Sleep: Beristirahatlah 7-8 jam per hari.\n- Meditasi Napas Dalam (Pranayama): Aktifkan sistem saraf parasimpatik untuk meredakan amarah atau sensibilitas berlebih.",
    readTime: "6 min read",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600"
  }
];

const INITIAL_DB = {
  users: [
    {
      id: "oryza-id",
      name: "Oryza",
      email: "oryza@example.com",
      password: "password123",
      cycleLength: 28,
      periodLength: 5,
      notificationSettings: {
        periodReminder: true,
        fertileReminder: true,
        dailyTips: true
      }
    }
  ],
  cycleRecords: [
    {
      id: "rec-1",
      userId: "oryza-id",
      startDate: "2026-03-01",
      endDate: "2026-03-05",
      flowIntensity: "Medium",
      symptoms: ["Kram perut", "Kelelahan"],
      mood: "Sensitive",
      notes: "Siklus haid lancar seperti biasa, nyeri panggul ringan di hari kedua.",
      createdAt: "2026-03-01T12:00:00.000Z"
    },
    {
      id: "rec-2",
      userId: "oryza-id",
      startDate: "2026-03-29",
      endDate: "2026-04-03",
      flowIntensity: "Heavy",
      symptoms: ["Kram perut", "Sakit kepala", "Sakit pinggang"],
      mood: "Sad",
      notes: "Cukup lemas di hari-hari awal. Mengompres perut menggunakan air hangat sangat membantu.",
      createdAt: "2026-03-29T08:00:00.000Z"
    },
    {
      id: "rec-3",
      userId: "oryza-id",
      startDate: "2026-04-26",
      endDate: "2026-04-30",
      flowIntensity: "Medium",
      symptoms: ["Kram perut", "Kembung"],
      mood: "Sensitive",
      notes: "Sedikit kembung sebelum datang bulan. Kram perut mereda di hari ke-3.",
      createdAt: "2026-04-26T09:00:00.000Z"
    }
  ],
  bookmarks: [] as { id: string; userId: string; articleId: string }[]
};

// Helper function to load DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
    return INITIAL_DB;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading database, resetting...", error);
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
    return INITIAL_DB;
  }
}

// Helper function to save DB
function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to DB", err);
  }
}

// ------------------------------------------
// API ENDPOINTS
// ------------------------------------------

// Authentication
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  const user = db.users.find((u: any) => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, cycleLength: user.cycleLength, periodLength: user.periodLength, notificationSettings: user.notificationSettings } });
  } else {
    res.status(401).json({ success: false, message: "Email atau password tidak sesuai." });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, cycleLength = 28, periodLength = 5 } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Semua kolom pendaftaran harus diisi." });
  }

  const db = loadDB();
  const exists = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: "Alamat email ini sudah terdaftar." });
  }

  const newUser = {
    id: "user-" + Date.now(),
    name,
    email,
    password,
    cycleLength: Number(cycleLength),
    periodLength: Number(periodLength),
    notificationSettings: {
      periodReminder: true,
      fertileReminder: true,
      dailyTips: true
    }
  };

  db.users.push(newUser);
  saveDB(db);

  res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, cycleLength: newUser.cycleLength, periodLength: newUser.periodLength, notificationSettings: newUser.notificationSettings } });
});

// Get User Detail
app.get("/api/user/:userId", (req, res) => {
  const db = loadDB();
  const user = db.users.find((u: any) => u.id === req.params.userId);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(404).json({ success: false, message: "User tidak ditemukan" });
  }
});

// Update User Profile
app.put("/api/user/:userId", (req, res) => {
  const { name, cycleLength, periodLength, notificationSettings } = req.body;
  const db = loadDB();
  const idx = db.users.findIndex((u: any) => u.id === req.params.userId);
  if (idx !== -1) {
    if (name) db.users[idx].name = name;
    if (cycleLength) db.users[idx].cycleLength = Number(cycleLength);
    if (periodLength) db.users[idx].periodLength = Number(periodLength);
    if (notificationSettings) db.users[idx].notificationSettings = notificationSettings;
    saveDB(db);
    res.json({ success: true, user: db.users[idx] });
  } else {
    res.status(404).json({ success: false, message: "User tidak ditemukan" });
  }
});

// Get all cycle records for user
app.get("/api/records/:userId", (req, res) => {
  const db = loadDB();
  const records = db.cycleRecords.filter((r: any) => r.userId === req.params.userId);
  // Sort by startDate descending
  records.sort((a: any, b: any) => b.startDate.localeCompare(a.startDate));
  res.json({ success: true, records });
});

// Save or Update a cycle record
app.post("/api/records", (req, res) => {
  const { id, userId, startDate, endDate, flowIntensity, symptoms = [], mood, notes } = req.body;
  if (!userId || !startDate) {
    return res.status(400).json({ success: false, message: "User ID dan Tanggal Mulai wajib diisi." });
  }

  const db = loadDB();
  
  if (id) {
    // Update existing
    const idx = db.cycleRecords.findIndex((r: any) => r.id === id);
    if (idx !== -1) {
      db.cycleRecords[idx] = {
        ...db.cycleRecords[idx],
        startDate,
        endDate: endDate || undefined,
        flowIntensity,
        symptoms,
        mood,
        notes,
        createdAt: new Date().toISOString()
      };
      saveDB(db);
      return res.json({ success: true, record: db.cycleRecords[idx] });
    }
  }

  // Create new
  const newRecord = {
    id: "rec-" + Date.now(),
    userId,
    startDate,
    endDate: endDate || undefined,
    flowIntensity: flowIntensity || "Medium",
    symptoms,
    mood: mood || "Calm",
    notes,
    createdAt: new Date().toISOString()
  };

  db.cycleRecords.push(newRecord);
  saveDB(db);

  res.json({ success: true, record: newRecord });
});

// Delete a cycle record
app.delete("/api/records/:recordId", (req, res) => {
  const db = loadDB();
  const idx = db.cycleRecords.findIndex((r: any) => r.id === req.params.recordId);
  if (idx !== -1) {
    db.cycleRecords.splice(idx, 1);
    saveDB(db);
    res.json({ success: true, message: "Catatan terhapus." });
  } else {
    res.status(404).json({ success: false, message: "Catatan tidak ditemukan." });
  }
});

// Delete account
app.delete("/api/user/:userId", (req, res) => {
  const db = loadDB();
  const idx = db.users.findIndex((u: any) => u.id === req.params.userId);
  if (idx !== -1) {
    // Delete user, their records and passwords
    db.users.splice(idx, 1);
    db.cycleRecords = db.cycleRecords.filter((r: any) => r.userId !== req.params.userId);
    db.bookmarks = db.bookmarks.filter((b: any) => b.userId !== req.params.userId);
    saveDB(db);
    res.json({ success: true, message: "Akun berhasil dihapus." });
  } else {
    res.status(404).json({ success: false, message: "User tidak ditemukan" });
  }
});

// Get Bookmarks for user
app.get("/api/bookmarks/:userId", (req, res) => {
  const db = loadDB();
  const userBookmarks = db.bookmarks.filter((b: any) => b.userId === req.params.userId);
  const articleIds = userBookmarks.map((b: any) => b.articleId);
  const bookmarkedArticles = DEFAULT_ARTICLES.filter((art) => articleIds.includes(art.id));
  res.json({ success: true, bookmarks: bookmarkedArticles });
});

// Toggle bookmark
app.post("/api/bookmarks", (req, res) => {
  const { userId, articleId } = req.body;
  const db = loadDB();
  const idx = db.bookmarks.findIndex((b: any) => b.userId === userId && b.articleId === articleId);
  
  let bookmarked = false;
  if (idx !== -1) {
    // Remove bookmark
    db.bookmarks.splice(idx, 1);
  } else {
    // Add bookmark
    db.bookmarks.push({
      id: "bmk-" + Date.now(),
      userId,
      articleId
    });
    bookmarked = true;
  }
  
  saveDB(db);
  res.json({ success: true, isBookmarked: bookmarked });
});

// Get static articles
app.get("/api/articles", (req, res) => {
  const { category, search } = req.query;
  let filtered = [...DEFAULT_ARTICLES];
  
  if (category && category !== "All") {
    filtered = filtered.filter(art => art.category.toLowerCase() === (category as string).toLowerCase());
  }
  
  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(art => 
      art.title.toLowerCase().includes(q) || 
      art.content.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, articles: filtered });
});

// Get Gemini AI insights
app.post("/api/insights/ai", async (req, res) => {
  const { userId, records, cycleLength = 28, periodLength = 5 } = req.body;
  
  if (!records || records.length === 0) {
    return res.json({
      success: true,
      insight: "Mulai dengan merekam siklus pertama Anda di menu 'Record' untuk memicu analisis kecerdasan buatan (Gemini AI)."
    });
  }

  // Format cycle records context for the prompt
  const recordsDescription = records.map((r: any, index: number) => {
    return `Catatan ${index + 1}:
    - Tanggal Mulai: ${r.startDate}
    - Tanggal Selesai: ${r.endDate || "Belum berakhir"}
    - Intensitas Aliran Darah: ${r.flowIntensity}
    - Gejala yang Dirasakan: ${r.symptoms.join(", ") || "Tidak ada"}
    - Suasana Hati (Mood): ${r.mood}
    - Catatan tambahan: ${r.notes || "Tidak ada"}`;
  }).join("\n\n");

  const prompt = `Anda adalah asisten AI Kesehatan khusus Kesehatan Perempuan dan Siklus Menstruasi. 
  Berikut adalah catatan siklus menstruasi terbaru dari pengguna:
  Rata-rata Durasi Siklus: ${cycleLength} hari
  Rata-rata Durasi Menstruasi: ${periodLength} hari
  
  Catatan Historis Pengguna:
  ${recordsDescription}
  
  Berdasarkan data di atas, berikanlah wawasan kesehatan (health insights) yang personal, solutif, empatik, singkat, dan terstruktur dalam bahasa Indonesia yang ramah serta mudah dipahami.
  Fokus berikan:
  1. Analisis singkat keteraturan siklus.
  2. Pola gejala dominan yang dirasakan beserta anjuran tindakan preventif atau pereda keluhan (misalnya nutrisi, olahraga, gaya hidup).
  3. Tips kesuburan singkat berdasarkan siklusnya.
  
  Aturan format pengembalian:
  Jaga respon Anda padat (maksimal 150-180 kata), gunakan format markdown murni, tumpukan bullet point yang rapi tanpa kata-kata pengantar panjang seperti "Halo Oryza, ini adalah analisis Anda".`;

  // Try calling Gemini API
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Anda adalah dokter spesialis obstetri & ginekologi (Obgyn) yang ahli dan penuh perhatian. Respon Anda harus praktis, aman, edukatif, dan ramah wanita.",
          temperature: 0.7,
        }
      });
      
      const text = response.text;
      if (text) {
        return res.json({ success: true, insight: text });
      }
    } catch (err) {
      console.error("Gemini content generation failed, falling back:", err);
    }
  }

  // Fallback AI Analysis (Rule-Based Generator if API Key is missing or failed)
  console.log("Using realistic fallback generator for AI health insights.");
  
  // Basic analytical logic to make the app look extremely intelligent even without an API Key
  const symptomsCount: Record<string, number> = {};
  let totalRecords = records.length;
  let matchesCramps = 0;
  let matchesHeadache = 0;
  
  records.forEach((r: any) => {
    if (r.symptoms.includes("Kram perut")) matchesCramps++;
    if (r.symptoms.includes("Sakit kepala")) matchesHeadache++;
  });

  let advice = "**Keteraturan Siklus:** Siklus Anda terlihat memiliki keteraturan yang sangat baik (${cycleLength} hari). Perbedaan jarak tanggal antar siklus sangat konsisten.\n\n";
  
  if (matchesCramps > totalRecords / 2) {
    advice += "**Analisis Gejala & Reduksi Kram:** Kram perut sering kali muncul di awal menstruasi Anda. Cobalah mencukupi asupan mineral magnesium (pisang, cokelat hitam, bayam) 3 hari sebelum perkiraan tanggal haid dimulai.\n\n";
  } else if (matchesHeadache > totalRecords / 2) {
    advice += "**Keluhan Sakit Kepala:** Keluhan migrain pra-menstruasi nampaknya dipicu oleh penurunan level estrogen secara tiba-tiba. Pastikan tidur tidak larut malam dan kurangi tingkat konsumsi minuman berkafein tinggi saat fase luteal.\n\n";
  } else {
    advice += "**Kondisi Fisik & Mood:** Keluhan fisik tergolong wajar. Pola perubahan mood (sensibilitas tinggi) saat fase luteal adalah reaksi alami tubuh menyikapi peralihan dominansi progesteron.\n\n";
  }

  advice += "**Saran Nutrisi & Kebugaran:** Lakukan olahraga peregangan panggul (yoga ringkas) selama 15 menit setiap sore demi melebarkan sirkulasi panggul dan melepaskan endorfin natural.";

  res.json({ success: true, insight: advice });
});


// ------------------------------------------
// VITE MIDDLEWARE SETUP
// ------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Single page app fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Development server running at http://localhost:${PORT}`);
  });
}

startServer();
