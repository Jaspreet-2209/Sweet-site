import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  LogOut, 
  User, 
  Candy, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Joyride, { STATUS, EVENTS } from 'react-joyride';

const API_BASE = 'https://sweet-site.onrender.com/api';

// --- COMPONENTS ---

// 1. Toast Notification
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const bgClass = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed bottom-5 right-5 ${bgClass} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-bounce-in`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

// 2. Modal Container
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-5 border-b border-rose-100 bg-rose-50">
          <h3 className="text-xl font-bold text-rose-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-rose-200 rounded-full transition text-rose-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Tour Custom Tooltip Component
const CustomTooltip = ({ continuous, index, step, primaryProps, skipProps, tooltipProps }) => {
  const quotes = [
    "Welcome to SweetTooth! 🍬 Where every craving finds its match!",
    "A hero section that's sweeter than dessert! Life's too short for boring websites.",
    "Find your perfect treat! Search works like magic - just type and watch the sweets appear.",
    "Your gateway to sweet adventures! Sign in to unlock all features.",
    "Power in your hands! Only admins can create, edit, or delete sweets - with great power comes great responsibility!",
    "Sweet masterpiece in a box! Each sweet tells a story of flavor and delight.",
    "Complete the journey! You're now ready to explore all the sweetness we offer."
  ];

  return (
    <div {...tooltipProps} className="bg-white rounded-2xl shadow-2xl p-6 max-w-md border border-rose-100">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white p-2 rounded-lg">
            <Candy size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{step.title}</h3>
        </div>
        <p className="text-slate-600 mb-3">{step.content}</p>
        
        {/* Quote Section */}
        <div className="bg-rose-50 p-4 rounded-lg border-l-4 border-rose-400 mb-4">
          <p className="text-slate-700 italic text-sm">"{quotes[index]}"</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full ${i === index ? 'w-8 bg-rose-500' : 'w-2 bg-rose-200'}`}
            />
          ))}
        </div>
        
        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...skipProps}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition shadow-rose-200"
          >
            {continuous ? (index === 6 ? "Finish Tour 🎉" : "Next") : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Main Application Component
export default function App() {
  // --- STATE ---
  const [sweets, setSweets] = useState([]);
  
  // Auth State
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  
  // UI State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Admin Form State
  const [currentSweet, setCurrentSweet] = useState(null);

  // Tour Guide State
  const [runTour, setRunTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // --- API HELPER ---
  const authHeader = () => token ? { 'Authorization': `Bearer ${token}` } : {};

  // --- INITIALIZATION ---
  
  // Check for saved session and show tour on first visit
  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    const savedUser = localStorage.getItem('current_user');
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    // Show tour on first visit or after 24 hours
    if (!hasSeenTour) {
      setTimeout(() => {
        setRunTour(true);
      }, 1000);
    }
  }, []);

  // Fetch Sweets (Debounced for search)
  const fetchSweets = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE}/sweets`;
      
      // Use search endpoint if filters are active
      if (searchQuery || categoryFilter !== 'All') {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (categoryFilter !== 'All') params.append('category', categoryFilter);
        url = `${API_BASE}/sweets/search?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch sweets');
      
      const data = await res.json();
      setSweets(data);
    } catch (err) {
      console.error(err);
      showToast('Could not load sweets. Is the backend running?', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  // Load sweets on mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSweets();
    }, 300); // 300ms debounce for search typing
    return () => clearTimeout(timeoutId);
  }, [fetchSweets]);

  // --- TOUR GUIDE ---
  const tourSteps = [
    {
      target: 'body',
      title: 'Welcome to SweetTooth! 🍭',
      content: 'Let me guide you through our sweet wonderland. Discover how to find, purchase, and manage delicious desserts!',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.hero-section',
      title: 'Sweet Introduction',
      content: 'Our hero section showcases the essence of SweetTooth - where life meets sweetness. Scroll to explore our story!',
      placement: 'bottom',
    },
    {
      target: '.search-bar',
      title: 'Find Your Sweet Spot',
      content: 'Search for your favorite desserts by name or filter by category. Type "chocolate" or select "Donuts" to see magic happen!',
      placement: 'bottom',
    },
    {
      target: '.auth-section',
      title: 'Your Sweet Account',
      content: 'Sign in to unlock full features. Regular users can purchase sweets, while admins get superpowers to manage inventory!',
      placement: 'left',
    },
    {
      target: '.admin-controls',
      title: 'Admin Superpowers',
      content: 'Only visible to admins! Add new sweets, edit existing ones, or remove items. The "Add Sweet" button appears only for admin users.',
      placement: 'left',
    },
    {
      target: '.first-sweet',
      title: 'Sweet Details',
      content: 'Each sweet card shows image, price, quantity, and description. Hover over cards to see admin controls (if you are admin).',
      placement: 'top',
    },
    {
      target: '.purchase-btn',
      title: 'Sweet Satisfaction',
      content: 'Click purchase to buy a sweet! Stock decreases with each purchase. Sold out items show a special badge.',
      placement: 'top',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, index, type } = data;

    if (type === EVENTS.TOUR_END || [STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      setTourStepIndex(0);
      localStorage.setItem('hasSeenTour', 'true');
    } else if (type === EVENTS.STEP_AFTER) {
      setTourStepIndex(index + 1);
    }
  };

  const startTour = () => {
    setRunTour(true);
    setTourStepIndex(0);
  };

  // --- ACTIONS ---

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('current_user');
    localStorage.removeItem('jwt_token');
    showToast('Logged out successfully.');
  };

  const handlePurchase = async (sweet) => {
    if (!user) {
      setAuthMode('login');
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/sweets/${sweet._id}/purchase`, {
        method: 'POST',
        headers: { ...authHeader() }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(`Purchased 1 ${sweet.name}!`);
      fetchSweets(); // Refresh data to show new quantity
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAdminDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this sweet?')) return;

    try {
      const res = await fetch(`${API_BASE}/sweets/${id}`, {
        method: 'DELETE',
        headers: { ...authHeader() }
      });
      
      if (!res.ok) throw new Error('Delete failed');
      
      showToast('Item deleted successfully.');
      fetchSweets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAdminSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const sweetData = {
      name: formData.get('name'),
      category: formData.get('category'),
      price: parseFloat(formData.get('price')),
      quantity: parseInt(formData.get('quantity')),
      description: formData.get('description'),
      image: formData.get('image') || "https://placehold.co/400x300/pink/white?text=Sweet"
    };

    try {
      let url = `${API_BASE}/sweets`;
      let method = 'POST';

      if (currentSweet) {
        url = `${url}/${currentSweet._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          ...authHeader() 
        },
        body: JSON.stringify(sweetData)
      });

      if (!res.ok) throw new Error('Failed to save sweet');

      showToast(currentSweet ? 'Sweet updated!' : 'New sweet added!');
      setIsEditOpen(false);
      fetchSweets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openAdminModal = (sweet = null) => {
    setCurrentSweet(sweet);
    setIsEditOpen(true);
  };

  // --- RENDER HELPERS ---
  const categories = ['All', 'Macarons', 'Donuts', 'Cakes', 'Chocolates', 'Brownies', 'Cupcakes', 'Tarts', 'Other'];

  return (
    <div className="min-h-screen bg-rose-50 font-sans text-slate-800">
      {/* Joyride Tour */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        stepIndex={tourStepIndex}
        continuous
        showSkipButton={false}
        showProgress
        callback={handleJoyrideCallback}
        styles={{
          options: {
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(244, 63, 94, 0.1)',
            primaryColor: '#f43f5e',
            textColor: '#334155',
            zIndex: 10000,
          },
          buttonNext: {
            backgroundColor: '#f43f5e',
          },
          buttonBack: {
            color: '#f43f5e',
          },
        }}
        tooltipComponent={CustomTooltip}
        spotlightPadding={10}
        disableOverlayClose
        disableScrolling={false}
      />

      {/* Tour Start Button */}
      {!runTour && (
        <button
          onClick={startTour}
          className="fixed bottom-6 left-6 z-30 bg-gradient-to-r from-rose-500 to-purple-600 text-white p-4 rounded-full shadow-2xl shadow-rose-300 hover:shadow-rose-400 transition-all hover:scale-110 group"
          title="Start Tour Guide"
        >
          <div className="relative">
            <Candy size={24} className="group-hover:animate-bounce" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </button>
      )}

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />

      {/* --- NAVBAR --- */}
      <nav className="bg-white sticky top-0 z-40 shadow-sm border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setSearchQuery(''); setCategoryFilter('All')}}>
              <div className="bg-rose-500 p-2 rounded-lg text-white">
                <Candy size={24} />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-purple-600 hidden sm:block">
                SweetTooth
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block search-bar">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-300 group-focus-within:text-rose-500">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search for sweets..."
                  className="block w-full pl-10 pr-3 py-2 border border-rose-100 rounded-full leading-5 bg-rose-50 placeholder-rose-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-200 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 auth-section">
              <div className="admin-controls">
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => openAdminModal()}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium transition shadow-md shadow-emerald-200"
                  >
                    <Plus size={16} /> Add Sweet
                  </button>
                )}
              </div>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider">{user.role}</span>
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
                  className="flex items-center gap-2 text-rose-600 font-medium hover:bg-rose-50 px-4 py-2 rounded-full transition"
                >
                  <User size={18} /> Sign In
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-4 search-bar">
          <input
            type="text"
            placeholder="Search sweets..."
            className="w-full pl-4 pr-4 py-2 border border-rose-100 rounded-lg bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative bg-white overflow-hidden hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 px-4 sm:px-6 lg:px-8 pt-10">
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
              <span className="block xl:inline">Life is short.</span>{' '}
              <span className="block text-rose-500 xl:inline">Make it sweet.</span>
            </h1>
            <p className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-lg sm:max-w-xl md:mt-5 md:text-xl">
              Handcrafted desserts made with love and the finest ingredients. From airy macarons to rich brownies, satisfy your cravings today.
            </p>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-rose-100">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full opacity-80"
            src="https://images.unsplash.com/photo-1558326567-98ae2405596b?auto=format&fit=crop&q=80&w=1000"
            alt="Delicious donuts"
          />
        </div>
      </div>

      {/* --- FILTERS & GRID --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-8 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                  : 'bg-white text-slate-600 hover:bg-rose-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sweets Grid */}
        {isLoading ? (
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
                <p className="mt-4 text-slate-500">Loading deliciousness...</p>
            </div>
        ) : sweets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sweets.map((sweet, index) => (
              <div 
                key={sweet._id} 
                className={`bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group border border-rose-50 ${index === 0 ? 'first-sweet' : ''}`}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-rose-100">
                  <img 
                    src={sweet.image} 
                    alt={sweet.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => e.target.src = 'https://placehold.co/400x300/pink/white?text=Sweet'}
                  />
                  {sweet.quantity === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg transform -rotate-6">SOLD OUT</span>
                    </div>
                  )}
                  {/* Admin Controls Overlay */}
                  {user?.role === 'admin' && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openAdminModal(sweet)}
                        className="p-2 bg-white/90 text-blue-600 rounded-full shadow-lg hover:bg-blue-50"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleAdminDelete(sweet._id)}
                        className="p-2 bg-white/90 text-red-600 rounded-full shadow-lg hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-rose-500 uppercase tracking-wide">{sweet.category}</span>
                      <h3 className="text-xl font-bold text-slate-800 leading-tight">{sweet.name}</h3>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">${sweet.price.toFixed(2)}</span>
                  </div>
                  
                  <p className="text-slate-500 text-sm mb-6 flex-1">{sweet.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-xs font-medium ${sweet.quantity < 5 ? 'text-orange-500' : 'text-slate-400'}`}>
                      {sweet.quantity === 0 ? 'Out of stock' : `${sweet.quantity} left in stock`}
                    </span>
                    <button
                      onClick={() => handlePurchase(sweet)}
                      disabled={sweet.quantity === 0}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm purchase-btn ${
                        sweet.quantity === 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white hover:shadow-rose-200'
                      }`}
                    >
                      <ShoppingBag size={18} />
                      {sweet.quantity === 0 ? 'Sold Out' : 'Purchase'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-rose-300" />
            </div>
            <h3 className="text-xl font-medium text-slate-900">No sweets found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
            <button 
              onClick={() => {setCategoryFilter('All'); setSearchQuery('');}}
              className="mt-4 text-rose-500 font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      {/* --- AUTH MODAL --- */}
      <Modal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        title={authMode === 'login' ? 'Welcome Back' : 'Join SweetTooth'}
      >
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              name="email"
              type="email" 
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-rose-500 text-white py-2.5 rounded-lg font-semibold hover:bg-rose-600 transition shadow-lg shadow-rose-200"
          >
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
          <div className="text-center text-sm text-slate-500 mt-4">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-rose-600 font-semibold hover:underline"
            >
              {authMode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- ADMIN EDIT MODAL --- */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={currentSweet ? 'Edit Sweet' : 'Add New Sweet'}
      >
        <form onSubmit={handleAdminSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Product Name</label>
            <input 
              name="name" 
              required 
              defaultValue={currentSweet?.name}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <select 
                name="category" 
                defaultValue={currentSweet?.category || 'Macarons'}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Price ($)</label>
              <input 
                name="price" 
                type="number" 
                step="0.01" 
                required 
                defaultValue={currentSweet?.price}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Stock Quantity</label>
            <input 
              name="quantity" 
              type="number" 
              required 
              defaultValue={currentSweet?.quantity || 10}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Image URL</label>
            <input 
              name="image" 
              type="url" 
              placeholder="https://..."
              defaultValue={currentSweet?.image}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea 
              name="description" 
              rows="3" 
              required
              defaultValue={currentSweet?.description}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>
          <button 
            type="submit" 
            className="w-full bg-emerald-500 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-600 transition shadow-lg shadow-emerald-200"
          >
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} SweetTooth Shop. All cravings reserved.</p>
        </div>
      </footer>
    </div>
  );
}
