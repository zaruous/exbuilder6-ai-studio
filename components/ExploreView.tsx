
import React, { useState, useEffect } from 'react';
import { Search, Star, MessageSquare, Download, User, Calendar, X, Send, Flame, Clock, History } from 'lucide-react';
import { SharedComponent, Comment } from '../types';
import { addComment } from '../services/communityService';

interface ExploreViewProps {
  items: SharedComponent[];
  onLoadComponent: (item: SharedComponent) => void;
  onRefreshItems: () => void;
}

type SortCategory = 'popular' | 'newest' | 'history';

const ExploreView: React.FC<ExploreViewProps> = ({ items, onLoadComponent, onRefreshItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<SharedComponent | null>(null);
  const [activeCategory, setActiveCategory] = useState<SortCategory>('popular');
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  
  // Comment Form State
  const [commentContent, setCommentContent] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentAuthor, setCommentAuthor] = useState('');

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('exbuilder_history');
    if (savedHistory) {
        try {
            setHistoryIds(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to parse history", e);
        }
    }
  }, []);

  const addToHistory = (id: string) => {
    const newHistory = [id, ...historyIds.filter(h => h !== id)].slice(0, 20); // Keep last 20
    setHistoryIds(newHistory);
    localStorage.setItem('exbuilder_history', JSON.stringify(newHistory));
  };

  const handleViewDetails = (item: SharedComponent) => {
    setSelectedItem(item);
    addToHistory(item.id);
  };

  // Filtering and Sorting Logic
  const getProcessedItems = () => {
    // 1. Filter by Search Term
    let filtered = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 2. Sort/Filter by Category
    if (activeCategory === 'popular') {
        return [...filtered].sort((a, b) => b.likes - a.likes);
    } else if (activeCategory === 'newest') {
        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeCategory === 'history') {
        return filtered.filter(item => historyIds.includes(item.id))
                       .sort((a, b) => historyIds.indexOf(a.id) - historyIds.indexOf(b.id)); // Maintain history order (recent first)
    }
    return filtered;
  };

  const displayedItems = getProcessedItems();

  const handlePostComment = async () => {
    if (!selectedItem || !commentContent.trim()) return;
    
    await addComment(selectedItem.id, commentAuthor, commentContent, commentRating);
    setCommentContent('');
    setCommentRating(5);
    onRefreshItems();
  };

  // Helper for star display
  const renderStars = (rating: number) => {
    return (
        <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-current' : 'text-slate-600'}`} />
            ))}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      
      {/* Header Area */}
      <div className="border-b border-slate-800 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-2">
            
            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search community components, authors, or tags..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-slate-500 shadow-lg"
                />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-6">
                <button 
                    onClick={() => setActiveCategory('popular')}
                    className={`flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition-all ${activeCategory === 'popular' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <Flame className="w-4 h-4" />
                    Popular
                </button>
                <button 
                    onClick={() => setActiveCategory('newest')}
                    className={`flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition-all ${activeCategory === 'newest' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <Clock className="w-4 h-4" />
                    Newest
                </button>
                <button 
                    onClick={() => setActiveCategory('history')}
                    className={`flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition-all ${activeCategory === 'history' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <History className="w-4 h-4" />
                    Recently Viewed
                </button>
            </div>
          </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6">
         {displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                {activeCategory === 'history' ? (
                     <>
                        <History className="w-12 h-12 mb-4" />
                        <p>You haven't viewed any components yet.</p>
                     </>
                ) : (
                    <>
                        <Search className="w-12 h-12 mb-4" />
                        <p>No components found.</p>
                    </>
                )}
            </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {displayedItems.map(item => {
                    const avgRating = item.comments.length 
                        ? Math.round(item.comments.reduce((acc, c) => acc + c.rating, 0) / item.comments.length) 
                        : 0;
                    
                    // Simple "New" badge logic (if created within last 2 days)
                    const isNew = new Date(item.createdAt).getTime() > Date.now() - 86400000 * 2;

                    return (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-blue-900/10 flex flex-col group">
                            <div className="p-4 border-b border-slate-800/50 h-36 relative overflow-hidden bg-slate-950">
                                {/* Simple Mock Visual */}
                                <div className="absolute inset-0 opacity-40 scale-95 group-hover:scale-100 transition-transform duration-500" dangerouslySetInnerHTML={{__html: item.generationResult.previewMock || ''}} />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                                
                                <div className="absolute top-3 right-3 flex gap-2">
                                    {isNew && <span className="bg-emerald-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">NEW</span>}
                                    {item.likes > 50 && <span className="bg-amber-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1"><Flame className="w-3 h-3" /> HOT</span>}
                                </div>

                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="font-bold text-white truncate text-lg">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                        <User className="w-3 h-3" /> {item.author}
                                        <span className="text-slate-600">•</span>
                                        <Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-4">
                                <p className="text-sm text-slate-400 line-clamp-2 h-10">{item.description}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-3 bg-slate-950/30 border-t border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        <span>{avgRating || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>{item.comments.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-rose-400/70">
                                        <Flame className="w-3.5 h-3.5" />
                                        <span>{item.likes}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleViewDetails(item)}
                                    className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    );
                })}
             </div>
         )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            {selectedItem.title}
                            <span className="text-xs font-normal px-2 py-1 bg-slate-800 rounded-full text-slate-400 border border-slate-700">by {selectedItem.author}</span>
                        </h2>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Info & Comments */}
                    <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-900">
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">{selectedItem.description}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Reviews ({selectedItem.comments.length})
                            </h3>
                            
                            {/* Comment List */}
                            <div className="space-y-4 mb-6">
                                {selectedItem.comments.length > 0 ? (
                                    selectedItem.comments.map(comment => (
                                        <div key={comment.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-slate-300">{comment.author}</span>
                                                {renderStars(comment.rating)}
                                            </div>
                                            <p className="text-xs text-slate-400">{comment.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-xs text-slate-600 italic">No reviews yet. Be the first!</div>
                                )}
                            </div>
                        </div>

                        {/* Add Comment */}
                        <div className="p-4 bg-slate-900 border-t border-slate-800">
                             <div className="flex gap-2 mb-2">
                                {[1,2,3,4,5].map(star => (
                                    <button key={star} onClick={() => setCommentRating(star)} className="focus:outline-none">
                                        <Star className={`w-4 h-4 ${star <= commentRating ? 'text-amber-400 fill-current' : 'text-slate-700'}`} />
                                    </button>
                                ))}
                             </div>
                             <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Write a review..."
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                />
                                <button 
                                    onClick={handlePostComment}
                                    disabled={!commentContent}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                             </div>
                        </div>
                    </div>

                    {/* Right: Preview & Action */}
                    <div className="w-1/2 flex flex-col bg-slate-950">
                        <div className="flex-1 p-6 flex items-center justify-center bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]">
                            <div className="w-full max-w-sm bg-slate-800 rounded shadow-2xl p-4 pointer-events-none opacity-80" dangerouslySetInnerHTML={{__html: selectedItem.generationResult.previewMock || ''}} />
                        </div>
                        <div className="p-6 border-t border-slate-800 bg-slate-900">
                             <button 
                                onClick={() => onLoadComponent(selectedItem)}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                             >
                                <Download className="w-5 h-5" />
                                Load into Studio
                             </button>
                             <p className="text-center text-[10px] text-slate-500 mt-2">
                                This will populate your editor with the .clx, .js, and .java files from this component.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ExploreView;
