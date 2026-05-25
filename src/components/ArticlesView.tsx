import { useState, useEffect } from "react";
import { BookOpen, Search, Bookmark, BookmarkCheck, Clock, ArrowRight, X, Sparkles } from "lucide-react";
import { Article } from "../types";

interface ArticlesViewProps {
  userId: string;
  bookmarks: Article[];
  onToggleBookmark: (id: string) => Promise<boolean>;
}

export default function ArticlesView({ userId, bookmarks, onToggleBookmark }: ArticlesViewProps) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Check if article is bookmarked
  const isBookmarked = (id: string) => bookmarks.some(b => b.id === id);

  // Fetch articles from full-stack endpoint
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const categoryParam = activeTab === "Bookmarks" ? "All" : activeTab;
      const res = await fetch(`/api/articles?category=${categoryParam}&search=${searchQuery}`);
      const data = await res.json();
      if (data.success) {
        if (activeTab === "Bookmarks") {
          // Filter dynamically based on bookmarks list
          const bIds = bookmarks.map(b => b.id);
          setArticles(data.articles.filter((art: Article) => bIds.includes(art.id)));
        } else {
          setArticles(data.articles);
        }
      }
    } catch (err) {
      console.error("Failed to load wellness articles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [activeTab, searchQuery, bookmarks]);

  const categories = ["All", "Education", "Nutrition", "Fitness", "Mind", "Bookmarks"];

  return (
    <div className="space-y-5 pb-6">
      {/* Page header */}
      <div className="flex justify-between items-center bg-white p-1 pb-2">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block font-semibold">Self-Care Library</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Wellness Articles</h1>
        </div>
        <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-indigo-500" />
        </div>
      </div>

      {/* Elegant search input bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari makanan pereda nyeri, artikel PMS, meditasi..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-medium focus:border-rose-400 focus:outline-none placeholder:text-slate-400 shadow-xs"
        />
      </div>

      {/* Horizontal categories scroll filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        {categories.map((cat) => {
          const isSelected = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-full border text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                isSelected 
                  ? "bg-rose-500 border-rose-500 text-white shadow-xs" 
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {cat === "Bookmarks" ? "My Saved" : cat}
            </button>
          );
        })}
      </div>

      {/* Articles Grid list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2].map((i) => (
            <div key={i} className="bg-slate-100 rounded-3xl h-60 animate-pulse border border-slate-200/40"></div>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((art) => {
            const bookmarked = isBookmarked(art.id);
            return (
              <div 
                key={art.id}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
              >
                {/* Article Header Image */}
                <div className="h-44 w-full relative overflow-hidden">
                  <img 
                    src={art.imageUrl} 
                    alt={art.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-full text-[10px] font-bold text-rose-600 border border-rose-100">
                    {art.category}
                  </span>
                  <button
                    onClick={() => onToggleBookmark(art.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center border border-slate-100 text-slate-600 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    {bookmarked ? (
                      <BookmarkCheck className="w-4 h-4 text-rose-500 fill-rose-100" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Article texts summary */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-sans text-slate-400 font-semibold uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{art.readTime}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">
                      {art.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-full truncate">
                    {art.content}
                  </p>

                  <button 
                    onClick={() => setSelectedArticle(art)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer flex items-center gap-1 self-start group transition-all"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl py-12 px-6 text-center space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">Empty Library Room</h4>
          <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto">
            {activeTab === "Bookmarks" 
              ? "Anda belum menyimpan artikel kesehatan. Ketuk ikon Bookmark di atas artikel edukasi mana saja untuk menambahkannya ke sini secara offline." 
              : "Tidak ada artikel kesehatan yang cocok dengan kriteria pencarian Anda. Coba hapus beberapa kata kunci."}
          </p>
        </div>
      )}

      {/* ARTICLE READER MODAL CONTENT OVERLAY */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto relative shadow-2xl flex flex-col animate-in fade-in zoom-in duration-150">
            {/* Header image cover in modal */}
            <div className="h-48 w-full relative shrink-0">
              <img 
                src={selectedArticle.imageUrl} 
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="absolute bottom-4 left-4 px-3 py-1 bg-rose-500 text-white font-bold rounded-full text-xs">
                {selectedArticle.category}
              </span>
            </div>

            {/* Read text content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold font-sans uppercase">
                  <Clock className="w-4 h-4" />
                  <span>{selectedArticle.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 leading-snug">
                  {selectedArticle.title}
                </h2>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Main content body formatted in paragraphs */}
              <div className="text-xs text-slate-600 leading-relaxed font-sans space-y-3.5 whitespace-pre-line">
                {selectedArticle.content}
              </div>

              {/* Action row in modal footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-[11px] font-medium text-slate-400">Shared via Period Tracker app</span>
                <button
                  onClick={() => {
                    onToggleBookmark(selectedArticle.id);
                  }}
                  className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 font-bold text-slate-700 hover:text-rose-500 transition-colors text-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isBookmarked(selectedArticle.id) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-rose-500 fill-rose-100" />
                      <span>Bookmarked</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Save for Later</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
