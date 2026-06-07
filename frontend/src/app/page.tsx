"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Send, 
  Smile, 
  MessageSquare, 
  Plus, 
  BrainCircuit,
  LayoutDashboard,
  BarChart3,
  FileText,
  PanelLeft,
  ChevronRight,
  Target,
  Zap,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  FileDown,
  UserPlus,
  Users,
  X,
  ShieldCheck,
  SlidersHorizontal,
  Share2,
  Bell,
  FileUp,
  Menu,
  User,
  Settings,
  LogOut
} from "lucide-react";
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useAuth } from "@/context/AuthContext";

// --- API Configuration ---
const API_BASE = "https://sentimentsync-ai-1.onrender.com/api";

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

// --- Types ---
type Tab = 'dashboard' | 'chat' | 'analytics' | 'reports' | 'team' | 'dataset';
type Role = 'Viewer' | 'Analyst' | 'Admin';

interface Notification {
  id: string;
  message: string;
  timestamp: string;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Pending';
  joinedAt: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentiment_score?: number;
  confidence?: number;
}

interface AnalyticsData {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  csat: number;
  avg_confidence: number;
  weekly_trend: TrendEntry[];
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface PieEntry {
  name: string;
  value: number;
  color: string;
}

interface TrendEntry {
  name: string;
  positive: number;
  negative: number;
  total: number;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
}

interface DatasetAnalysis {
  summary: string;
  positive: number;
  negative: number;
  neutral: number;
}

// --- Main Application Component ---
export default function SentimentSyncAI() {
  const { token, user, logout } = useAuth();
  // --- State Management ---
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollab, setNewCollab] = useState({ name: '', email: '', role: 'Viewer' as Role });
  const [chatSearch, setChatSearch] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [chatSentimentFilter, setChatSentimentFilter] = useState<Message['sentiment'] | 'all'>('all');
  const [chatDateRange, setChatDateRange] = useState({ start: '', end: '' });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    positive: 0,
    negative: 0,
    neutral: 0,
    total: 0,
    csat: 0,
    avg_confidence: 0,
    weekly_trend: []
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Helper for authenticated fetches
  const authFetch = useCallback((url: string, options: RequestInit = {}) => {
    return fetchWithTimeout(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }, [token]);

  // --- API Action Handlers ---

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE}/conversations`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      setApiError(null);
    } catch (err) { 
      console.error("History fetch failed", err);
      setApiError("Backend connection issue. Historical data unavailable.");
    }
  }, [token, authFetch]);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE}/analytics`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
      setApiError(null);
    } catch (err) { 
      console.error("Analytics fetch failed", err);
      setApiError("Backend connection issue. Analytics unavailable.");
    }
  }, [token, authFetch]);

  const selectConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await authFetch(`${API_BASE}/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      setConversationId(id);
      setMessages(data.messages || []);
      setActiveTab('chat');
    } catch (err) { 
      console.error("Conversation load failed", err);
      alert("Failed to load conversation history.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !token) return;

    const userMessage: Message = {
      content: input,
      role: "user",
      timestamp: new Date().toISOString(),
      sentiment: "neutral" 
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await authFetch(`${API_BASE}/chat`, {
        method: "POST",
        body: JSON.stringify({ message: input, conversation_id: conversationId }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();
      
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
        fetchConversations();
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        data.user_message,
        data.bot_message
      ]);
      
      fetchAnalytics();
    } catch (err) {
      console.error("Chat message failed", err);
      alert("Message synchronization failed. Check backend status.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setActiveTab('chat');
    addNotification("New session created");
  };

  const handleRefreshAnalytics = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchAnalytics(), fetchConversations()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleClearSession = () => {
    if (confirm("Are you sure you want to clear the current session and reset local metrics?")) {
      setMessages([]);
      setConversationId(null);
      setAnalytics({
  positive: 0,
  negative: 0,
  neutral: 0,
  total: 0,
  csat: 0,
  avg_confidence: 0,
  weekly_trend: []
});
      setActiveTab('chat');
    }
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    const collab: Collaborator = {
      id: Math.random().toString(36).substring(2, 11),
      name: newCollab.name,
      email: newCollab.email,
      role: newCollab.role,
      status: 'Active',
      joinedAt: new Date().toISOString().split('T')[0]
    };
    setCollaborators([...collaborators, collab]);
    setNewCollab({ name: '', email: '', role: 'Viewer' });
    setIsInviteModalOpen(false);
    addNotification("Member invited");
  };

  const handleExportCSV = () => {
    const headers = "Date,Role,Message,Sentiment,Confidence\n";
    const dataToExport = messages.length > 0 ? messages : [{ timestamp: new Date().toISOString(), role: 'system', content: 'No active session data', sentiment: 'neutral', sentiment_score: 0 } as Message];
    const rows = dataToExport.map(m => {
      const date = new Date(m.timestamp).toLocaleString();
      return `"${date}","${m.role}","${m.content.replace(/"/g, '""')}","${m.sentiment || 'N/A'}","${m.sentiment_score || '0.00'}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SentimentSync_Export_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addNotification("Report exported (CSV)");
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11);
    doc.text("SentimentSync AI - Enterprise Workspace Report", 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    const statsData = [
      ["Metric", "Value"],
      ["Total Interactions", analytics.total.toString()],
      ["Positive Sentiment", analytics.positive.toString()],
      ["Negative Sentiment", analytics.negative.toString()],
      ["CSAT Score", `${analytics.csat}%`]
    ];
    
    autoTable(doc, {
      startY: 40,
      head: [statsData[0]],
      body: statsData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }
    });

    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current);
        const imgData = canvas.toDataURL('image/png');
        doc.addPage();
        doc.text("Global Sentiment Trends Snapshot", 14, 22);
        doc.addImage(imgData, 'PNG', 14, 30, 180, 100);
      } catch (err) {
        console.error("PDF Chart capture failed", err);
      }
    }

    doc.save(`SentimentSync_Report_${new Date().getTime()}.pdf`);
  };

  // --- Effects ---
  // Activity Log State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Fetch Activity Logs
  const fetchActivityLogs = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/activity`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const data = await res.json();
      setActivityLogs(data);
    } catch (err) {
      console.error("Activity fetch failed", err);
    }
  }, []);

  // Fetch Team
  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/team`);
      if (!res.ok) throw new Error("Failed to fetch team");
      const data = await res.json();
      setCollaborators(data);
    } catch (err) {
      console.error("Team fetch failed", err);
    }
  }, []);

  // Update effects
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchConversations();
    fetchAnalytics();
    fetchActivityLogs();
    fetchTeam();
  }, [fetchConversations, fetchAnalytics, fetchActivityLogs, fetchTeam]);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeTab]);

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const matchesSearch = msg.content.toLowerCase().includes(chatSearch.toLowerCase());
      const matchesSentiment = chatSentimentFilter === 'all' || msg.sentiment === chatSentimentFilter;
      const msgDate = new Date(msg.timestamp).toISOString().split('T')[0];
      const matchesDate = (!chatDateRange.start || msgDate >= chatDateRange.start) &&
                          (!chatDateRange.end || msgDate <= chatDateRange.end);
      return matchesSearch && matchesSentiment && matchesDate;
    });
  }, [messages, chatSearch, chatSentimentFilter, chatDateRange]);

  // --- Recharts Configuration ---
  
  const pieData: PieEntry[] = useMemo(() => [
    { name: 'Positive', value: analytics.positive, color: '#22C55E' },
    { name: 'Neutral', value: analytics.neutral, color: '#FBBF24' },
    { name: 'Negative', value: analytics.negative, color: '#EF4444' },
  ], [analytics]);

  const trendData: TrendEntry[] = useMemo(() => {
    if (!mounted) return [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const base = Math.floor(analytics.total / 7);
    return days.map(day => ({
      name: day,
      positive: Math.floor((analytics.positive / 7)) + (day === 'Fri' ? 1 : 0),
      negative: Math.floor((analytics.negative / 7)) + (day === 'Mon' ? 1 : 0),
      total: base + (day === 'Wed' ? 2 : 0)
    }));
  }, [analytics, mounted]);

  // --- Render logic ---

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-[#FFFFFF] text-[#1F2937] font-sans overflow-hidden text-[13px]">
      {!mounted ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
           <div className="animate-pulse flex flex-col items-center gap-6">
              <div className="bg-[#F59E0B] p-4 rounded-3xl shadow-lg shadow-orange-500/20">
                <BrainCircuit className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-black text-[#1F2937] tracking-tight">SentimentSync AI</h2>
                <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-[0.2em]">Synchronizing Workspace...</p>
              </div>
           </div>
        </div>
      ) : (
        <>
          {/* Invite Collaborator Modal */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)}></div>
              <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                          <h3 className="text-2xl font-bold text-[#1F2937]">Invite Member</h3>
                          <p className="text-xs text-slate-400 font-medium">Add a collaborator to this workspace</p>
                      </div>
                      <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                    </div>
                    <form onSubmit={handleAddCollaborator} className="space-y-5">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Collaborator Name</label>
                          <input required type="text" value={newCollab.name} onChange={e => setNewCollab({...newCollab, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all text-sm font-medium" placeholder="e.g. Marcus Aurelius" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                          <input required type="email" value={newCollab.email} onChange={e => setNewCollab({...newCollab, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all text-sm font-medium" placeholder="marcus@enterprise.ai" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Assigned Role</label>
                          <div className="relative">
                            <select value={newCollab.role} onChange={e => setNewCollab({...newCollab, role: e.target.value as Role})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all text-sm font-medium appearance-none cursor-pointer">
                              <option value="Viewer">Viewer (Read Only)</option>
                              <option value="Analyst">Analyst (Data Access)</option>
                              <option value="Admin">Admin (Workspace Owner)</option>
                            </select>
                            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                          </div>
                      </div>
                      <button type="submit" className="w-full bg-[#F59E0B] text-white py-5 rounded-[1.5rem] font-bold shadow-lg shadow-orange-500/20 hover:bg-[#F59E0B]/90 active:scale-[0.98] transition-all mt-6 text-sm">
                          Send Workspace Invitation
                      </button>
                    </form>
                </div>
              </div>
            </div>
          )}

          {/* MOBILE SIDEBAR OVERLAY */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* LEFT NAVIGATION SIDEBAR */}
          <aside className={`fixed inset-y-0 left-0 z-[70] md:relative md:z-auto ${sidebarOpen ? 'w-[280px]' : 'w-20'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} bg-[#FFF7ED] border-r border-[#E5E7EB] flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none`}>
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between gap-3 overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="bg-[#F59E0B] p-2 rounded-xl shrink-0 shadow-sm">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                {sidebarOpen && <span className="font-bold text-xl tracking-tight text-[#1F2937] whitespace-nowrap">Sync Enterprise</span>}
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 md:hidden hover:bg-orange-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} sidebarOpen={sidebarOpen} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} />
              <NavItem icon={<MessageSquare />} label="Chat Analysis" active={activeTab === 'chat'} sidebarOpen={sidebarOpen} onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }} />
              <NavItem icon={<BarChart3 />} label="Analytics" active={activeTab === 'analytics'} sidebarOpen={sidebarOpen} onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }} />
              <NavItem icon={<Users />} label="Team Panel" active={activeTab === 'team'} sidebarOpen={sidebarOpen} onClick={() => { setActiveTab('team'); setMobileMenuOpen(false); }} />
              <NavItem icon={<FileText />} label="Reports" active={activeTab === 'reports'} sidebarOpen={sidebarOpen} onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }} />
              <NavItem icon={<FileUp />} label="Dataset Analysis" active={activeTab === 'dataset'} sidebarOpen={sidebarOpen} onClick={() => { setActiveTab('dataset'); setMobileMenuOpen(false); }} />
              
              <div className="my-6 border-t border-[#E5E7EB]/50"></div>
              
              <div className="px-2 mb-6">
                <button onClick={() => { startNewChat(); setMobileMenuOpen(false); }} className={`w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-3 rounded-xl transition-all shadow-sm font-semibold overflow-hidden ${!sidebarOpen && 'px-0'}`}>
                  <Plus className="w-5 h-5 shrink-0" />
                  {sidebarOpen && <span className="whitespace-nowrap">New Session</span>}
                </button>
              </div>

              {sidebarOpen && (
                <div className="px-4 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Recent Sessions</h4>
                  <input 
                    type="text" 
                    placeholder="Search conversations..." 
                    value={conversationSearch} 
                    onChange={(e) => setConversationSearch(e.target.value)}
                    className="w-full text-xs border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                  <div className="space-y-1">
                    {conversations
                      .filter(conv => conv.title.toLowerCase().includes(conversationSearch.toLowerCase()))
                      .slice(0, 5)
                      .map(conv => (
                      <button key={conv.id} onClick={() => selectConversation(conv.id)} className={`w-full text-left text-[12px] p-2 rounded-lg truncate ${conv.id === conversationId ? 'bg-[#FBBF24]/10 text-[#F59E0B] font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        {conv.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            <div className="p-4 border-t border-[#E5E7EB] space-y-1">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center gap-3 px-3 py-2.5 text-[#1F2937]/60 hover:bg-[#FBBF24]/10 rounded-xl transition-colors">
                <PanelLeft className="w-5 h-5" />
                {sidebarOpen && <span className="text-sm font-medium tracking-tight">Collapse Menu</span>}
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT WORKSPACE */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#FFFFFF]">
            <header className="px-4 md:px-8 py-4 border-b border-[#E5E7EB] bg-white z-20 sticky top-0">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4">
                  <button 
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 md:hidden hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Menu className="w-6 h-6 text-[#1F2937]" />
                  </button>
                  <h2 className="text-sm md:text-lg font-bold text-[#1F2937] capitalize truncate max-w-[150px] md:max-w-none">{activeTab} Interface</h2>
                  <div className="px-2 py-0.5 bg-[#FFF7ED] text-[#F59E0B] text-[9px] md:text-[10px] font-bold rounded-md border border-[#FDBA74]/30 uppercase tracking-widest hidden xs:block">Enterprise</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                     <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-slate-100 rounded-full">
                        <Bell className="w-5 h-5 text-slate-500" />
                        {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                     </button>
                     {showNotifications && (
                       <div className="absolute top-full right-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg mt-2 z-50 p-4 space-y-2">
                          <h4 className="font-bold text-sm">Notifications</h4>
                          {notifications.length === 0 && <p className="text-xs text-slate-400">No new notifications</p>}
                          {notifications.map(n => <div key={n.id} className="text-xs border-b pb-1">{n.message} <span className="text-[10px] text-slate-400 block">{n.timestamp}</span></div>)}
                       </div>
                     )}
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                    <ShieldCheck className="w-3.5 h-3.5" /> Workspace: Protected
                  </div>

                  {/* User Profile Section */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center gap-3 p-1.5 pl-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="hidden md:block text-right">
                        <div className="text-xs font-black text-[#1F2937] leading-none">{user?.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Enterprise User</div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#F59E0B] flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
                        {user?.name?.charAt(0)}
                      </div>
                    </button>

                    {showProfileDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setShowProfileDropdown(false)}
                        ></div>
                        <div className="absolute top-full right-0 w-56 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl mt-2 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="text-xs font-black text-[#1F2937] truncate">{user?.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 truncate">{user?.email}</div>
                          </div>
                          <div className="p-2">
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-[#FFF7ED] hover:text-[#F59E0B] rounded-xl transition-all">
                              <User className="w-4 h-4" /> My Profile
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-[#FFF7ED] hover:text-[#F59E0B] rounded-xl transition-all">
                              <Settings className="w-4 h-4" /> Settings
                            </button>
                            <div className="my-1 border-t border-slate-100"></div>
                            <button 
                              onClick={logout}
                              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <LogOut className="w-4 h-4" /> Logout
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {apiError && (
              <div className="bg-rose-50 border-b border-rose-100 px-8 py-2 text-xs font-bold text-rose-500 flex items-center gap-2">
                <X className="w-3 h-3" /> {apiError}
              </div>
            )}

            <div className="flex-1 overflow-hidden relative">
              <div className={`absolute inset-0 ${activeTab === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                  {activeTab === 'dashboard' && (
                    <DashboardView 
                      analytics={analytics} 
                      pieData={pieData} 
                      trendData={trendData} 
                      chartRef={chartRef}
                      onExportCSV={handleExportCSV}
                      onExportPDF={handleExportPDF}
                      onRefresh={handleRefreshAnalytics}
                      isRefreshing={isRefreshing}
                      onInvite={() => setIsInviteModalOpen(true)}
                      onClear={handleClearSession}
                    />
                  )}
                  {activeTab === 'analytics' && (
                    <div className="p-2 md:p-8 space-y-3 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
                      <GlobalActionBar 
                        onExportCSV={handleExportCSV}
                        onExportPDF={handleExportPDF}
                        onRefresh={handleRefreshAnalytics}
                        isRefreshing={isRefreshing}
                        onInvite={() => setIsInviteModalOpen(true)}
                        onClear={handleClearSession}
                      />
                      
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-6">
                        <StatCard label="Total" value={analytics.total} icon={<MessageSquare />} color="orange" trend="up" sub="Total Interactions" />
                        <StatCard label="Positive" value={analytics.positive} icon={<Smile />} color="green" trend="up" sub="Positive Sentiment" />
                        <StatCard label="Neutral" value={analytics.neutral} icon={<MessageSquare />} color="orange" trend="up" sub="Neutral Sentiment" />
                        <StatCard label="Negative" value={analytics.negative} icon={<Zap />} color="red" trend="down" sub="Negative Sentiment" />
                        <StatCard label="CSAT" value={`${analytics.csat}%`} icon={<Target />} color="green" trend="up" sub="Customer Satisfaction" />
                        <StatCard label="Confidence" value={`${analytics.avg_confidence}`} icon={<Target />} color="orange" trend="up" sub="Model Confidence" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-8">
                        <ChartContainer title="Sentiment Distribution" subtitle="Pie chart of sentiment distribution">
                          <div className="h-44 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={pieData} innerRadius={window?.innerWidth < 768 ? 45 : 60} outerRadius={window?.innerWidth < 768 ? 65 : 80} paddingAngle={5} dataKey="value">
                                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </ChartContainer>

                        <ChartContainer title="Weekly Sentiment" subtitle="Weekly sentiment trend">
                          <div className="h-44 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={analytics.weekly_trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="positive" stroke="#22C55E" />
                                <Line type="monotone" dataKey="negative" stroke="#EF4444" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </ChartContainer>

                        <ChartContainer title="Positive vs Negative" subtitle="Bar chart comparing sentiments">
                          <div className="h-44 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analytics.weekly_trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="positive" fill="#22C55E" />
                                <Bar dataKey="negative" fill="#EF4444" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </ChartContainer>
                        
                        <ChartContainer title="Daily Activity" subtitle="Total interactions per day">
                          <div className="h-44 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analytics.weekly_trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <Tooltip />
                                <Bar dataKey="total" fill="#F59E0B" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </ChartContainer>
                      </div>
                    </div>
                  )}
                  {activeTab === 'reports' && (
                    <ReportsView conversations={conversations} onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
                  )}
                  {activeTab === 'dataset' && (
                    <DatasetAnalysisView />
                  )}
                  {activeTab === 'team' && (
                    <TeamView 
                      collaborators={collaborators} 
                      onInvite={() => setIsInviteModalOpen(true)} 
                      activityLogs={activityLogs}
                    />
                  )}
                  {activeTab === 'chat' && (
                    <div className="flex h-full flex-col max-w-4xl mx-auto animate-in fade-in duration-500 overflow-hidden bg-white">
                      {/* Filter Bar - Sticky at top of chat area */}
                      <div className="flex-none p-2 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex flex-col md:flex-row gap-2 items-stretch md:items-center z-20 sticky top-0">
                        <div className="flex-1 flex gap-2">
                          <input type="text" placeholder="Search messages..." value={chatSearch} onChange={e => setChatSearch(e.target.value)} className="text-[11px] md:text-xs border border-[#E5E7EB] rounded-lg px-3 py-1.5 w-full md:flex-1 bg-slate-50/50" />
                        </div>
                        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                          <select value={chatSentimentFilter} onChange={e => setChatSentimentFilter(e.target.value as Message['sentiment'] | 'all')} className="text-[11px] md:text-xs border border-[#E5E7EB] rounded-lg px-2 md:px-3 py-1.5 bg-white flex-1 md:flex-none min-w-[80px]">
                            <option value="all">All</option>
                            <option value="positive">Positive</option>
                            <option value="neutral">Neutral</option>
                            <option value="negative">Negative</option>
                          </select>
                          <div className="flex gap-1 items-center flex-1 md:flex-none">
                            <input type="date" value={chatDateRange.start} onChange={e => setChatDateRange({...chatDateRange, start: e.target.value})} className="text-[10px] md:text-xs border border-[#E5E7EB] rounded-lg px-1 md:px-2 py-1.5 w-full md:w-[100px] bg-white" />
                            <span className="text-slate-300">-</span>
                            <input type="date" value={chatDateRange.end} onChange={e => setChatDateRange({...chatDateRange, end: e.target.value})} className="text-[10px] md:text-xs border border-[#E5E7EB] rounded-lg px-1 md:px-2 py-1.5 w-full md:w-[100px] bg-white" />
                          </div>
                          <button onClick={() => {setChatSearch(""); setChatSentimentFilter('all'); setChatDateRange({start: '', end: ''})}} className="text-[11px] md:text-xs bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg whitespace-nowrap border border-rose-100 hover:bg-rose-100 transition-colors">Reset</button>
                        </div>
                      </div>

                      {/* Scrollable Message Area */}
                      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 md:p-8 space-y-3 md:space-y-8 scroll-smooth pb-6 flex flex-col">
                        {filteredMessages.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 min-h-[300px]">
                            <div className="bg-slate-50 p-6 rounded-full mb-6">
                              <Zap className="w-10 h-10 md:w-16 md:h-16 text-[#F59E0B]" />
                            </div>
                            <h3 className="text-base md:text-2xl font-bold text-[#1F2937]">No Messages Found</h3>
                            <p className="text-[11px] md:text-sm font-medium text-slate-500 mt-2 max-w-[200px] md:max-w-none">Try adjusting your filters or start a new session.</p>
                          </div>
                        ) : (
                          filteredMessages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                              <div className={`max-w-[88%] md:max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1 md:gap-2`}>
                                <div className="flex items-center gap-2 px-1">
                                  {msg.sentiment && (() => {
                                      const getEmotion = () => {
                                        if (msg.sentiment === 'positive') return (msg.sentiment_score && msg.sentiment_score > 0.8) ? { label: 'Satisfied', emoji: '😍' } : { label: 'Happy', emoji: '😊' };
                                        if (msg.sentiment === 'negative') return (msg.sentiment_score && msg.sentiment_score < -0.5) ? { label: 'Frustrated', emoji: '😕' } : { label: 'Angry', emoji: '😡' };
                                        return { label: 'Neutral', emoji: '😐' };
                                      };
                                      const emotion = getEmotion();
                                      return (
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black border tracking-wider transition-all duration-500 ${msg.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : msg.sentiment === 'negative' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                          {emotion.emoji} {emotion.label.toUpperCase()}
                                        </div>
                                      );
                                    })()}
                                  <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{msg.role === 'user' ? 'Operator' : 'AI Engine'}</span>
                                </div>
                                <div className={`text-[12px] md:text-[13px] leading-relaxed p-3 rounded-xl shadow-sm font-medium ${msg.role === 'user' ? 'bg-[#F59E0B] text-white rounded-tr-none' : 'bg-[#FFF7ED] text-[#1F2937] border border-[#FDBA74]/10 rounded-tl-none'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {isLoading && (
                          <div className="flex gap-3 md:gap-4 animate-pulse">
                            <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/50 flex items-center justify-center shrink-0 shadow-inner">
                              <BrainCircuit className="w-5 h-5 text-white" />
                            </div>
                            <div className="space-y-3 pt-2">
                              <div className="flex gap-1.5">
                                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#F59E0B] rounded-full animate-bounce"></div>
                                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#F59E0B] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#F59E0B] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              </div>
                              <span className="text-[8px] md:text-[10px] font-black text-[#F59E0B] uppercase tracking-[0.2em] opacity-60">Synchronizing...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fixed Bottom Input Area */}
                      <div className="flex-none bg-white border-t border-[#E5E7EB] p-3 md:p-6 z-30 sticky bottom-0 pb-safe shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.05)]">
                        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative group">
                          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message SentimentSync..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 md:py-4 pl-4 pr-14 focus:outline-none focus:ring-4 focus:ring-[#F59E0B]/10 focus:border-[#F59E0B] transition-all text-[13px] md:text-sm font-medium placeholder:text-slate-400 shadow-sm" />
                          <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F59E0B] text-white p-2.5 rounded-xl hover:bg-[#F59E0B]/90 transition-all shadow-md active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none">
                            <Send className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="w-[22%] bg-white border-l border-[#E5E7EB] flex flex-col overflow-hidden hidden xl:flex">
            <div className="p-8 space-y-12 flex-1 overflow-y-auto">
                <section className="space-y-5">
                  <h3 className="text-xs font-black text-[#F59E0B] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Engine Insights
                  </h3>
                  <InsightMetric label="Model Confidence" value="96.4%" icon={<Target />} score={95} />
                  <InsightMetric label="Processing Intensity" value="Optimized" icon={<Zap />} score={78} />
                </section>

                <section className="space-y-5">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Workspace Members</h4>
                  <div className="flex -space-x-3 ml-1">
                      {collaborators.map(c => (
                        <div key={c.id} title={`${c.name} (${c.role})`} className="w-10 h-10 rounded-full border-4 border-white bg-[#FBBF24] flex items-center justify-center text-xs font-black text-white shadow-md cursor-help hover:scale-110 transition-transform active:z-10 relative z-[1]">
                          {c.name.charAt(0)}
                        </div>
                      ))}
                      <button onClick={() => setIsInviteModalOpen(true)} className="w-10 h-10 rounded-full border-4 border-white bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-[#FFF7ED] hover:text-[#F59E0B] transition-all shadow-md z-0 relative -translate-x-1">
                        <Plus className="w-5 h-5" />
                      </button>
                  </div>
                  <button onClick={() => setActiveTab('team')} className="text-[10px] font-black text-[#F59E0B] hover:underline flex items-center gap-1.5 ml-1 uppercase tracking-widest">Team Directory <ChevronRight className="w-3 h-3"/></button>
                </section>

                <section className="space-y-5">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Global Context</h4>
                  <div className="p-6 bg-[#FFF7ED] rounded-[1.8rem] border border-[#FDBA74]/10 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B]">Trending Tone</span>
                        <div className="bg-emerald-500 p-1.5 rounded-lg shadow-sm"><Smile className="w-4 h-4 text-white" /></div>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 font-medium italic">
                        &quot;Positive sentiment is trending upward across your enterprise workspace by 14.2%.&quot;
                      </p>
                  </div>
                </section>
            </div>

            <div className="p-6 border-t border-[#E5E7EB] bg-slate-50/50">
                <button className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-300 hover:text-[#F59E0B] transition-all uppercase tracking-[0.15em]">
                  <Share2 className="w-3.5 h-3.5" /> Collaborator Access
                </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

// --- Sub-components (Outside Render to Prevent Remounts) ---

interface GlobalActionBarProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  onInvite: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onClear: () => void;
}

function GlobalActionBar({ onExportCSV, onExportPDF, onInvite, onRefresh, isRefreshing, onClear }: GlobalActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 md:gap-3 bg-[#FFF7ED] p-2 md:p-4 rounded-xl md:rounded-2xl border border-[#FDBA74]/20 mb-3 md:mb-8">
      <button onClick={onExportCSV} className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold text-[#1F2937] hover:bg-[#FBBF24]/10 transition-all shadow-sm">
        <FileDown className="w-3 h-3 md:w-4 md:h-4 text-[#F59E0B]" /> <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">CSV</span>
      </button>
      <button onClick={onExportPDF} className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold text-[#1F2937] hover:bg-[#FBBF24]/10 transition-all shadow-sm">
        <Download className="w-3 h-3 md:w-4 md:h-4 text-[#F59E0B]" /> <span className="hidden sm:inline">Export PDF</span><span className="sm:hidden">PDF</span>
      </button>
      <button onClick={onInvite} className="flex items-center gap-1.5 bg-[#F59E0B] text-white px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold hover:bg-[#F59E0B]/90 transition-all shadow-md">
        <UserPlus className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Invite Collaborator</span><span className="sm:hidden">Invite</span>
      </button>
      <button onClick={onRefresh} disabled={isRefreshing} className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold text-[#1F2937] hover:bg-[#FBBF24]/10 transition-all shadow-sm">
        <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 text-[#F59E0B] ${isRefreshing && 'animate-spin'}`} /> <span className="hidden sm:inline">Refresh</span><span className="sm:hidden">Sync</span>
      </button>
      <button className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold text-[#1F2937] hover:bg-[#FBBF24]/10 transition-all shadow-sm">
        <SlidersHorizontal className="w-3 h-3 md:w-4 md:h-4 text-[#F59E0B]" /> <span className="hidden sm:inline">Filter Data</span><span className="sm:hidden">Filter</span>
      </button>
      <div className="flex-1 min-w-[10px] hidden md:block"></div>
      <button onClick={onClear} className="flex items-center gap-1.5 bg-white border border-red-100 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold text-red-500 hover:bg-red-50 transition-all shadow-sm ml-auto">
        <Trash2 className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Reset</span><span className="sm:hidden">Clear</span>
      </button>
    </div>
  );
}

interface DashboardViewProps {
  analytics: AnalyticsData;
  pieData: PieEntry[];
  trendData: TrendEntry[];
  chartRef: React.RefObject<HTMLDivElement | null>;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onInvite: () => void;
  onClear: () => void;
}

function ExecutiveSummary({ analytics }: { analytics: AnalyticsData }) {
  const getCommonSentiment = () => {
    const { positive, negative, neutral } = analytics;
    if (positive >= negative && positive >= neutral) return { label: 'Positive', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (negative >= positive && negative >= neutral) return { label: 'Negative', color: 'text-rose-500', bg: 'bg-rose-50' };
    return { label: 'Neutral', color: 'text-[#F59E0B]', bg: 'bg-orange-50' };
  };

  const common = getCommonSentiment();
  
  const recommendations = [
    analytics.csat < 70 ? "Increase response rate to negative feedback to boost satisfaction." : "Maintain current service levels; CSAT is within optimal range.",
    analytics.negative > analytics.total * 0.15 ? "High volume of negative sentiment detected; consider a root-cause analysis." : "Negative sentiment is well-controlled.",
    analytics.avg_confidence < 0.8 ? "Model confidence is low; consider uploading more specific training data." : "AI engine is operating with high predictive confidence."
  ];

  const trendText = analytics.weekly_trend.length > 1 
    ? (analytics.weekly_trend[analytics.weekly_trend.length-1].total > analytics.weekly_trend[analytics.weekly_trend.length-2].total 
        ? "Activity is increasing compared to previous days." 
        : "Activity volume is stabilizing.") 
    : "Gathering more data for trend analysis...";

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-[#FFF7ED] p-6 md:p-8 border-b border-[#FDBA74]/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#F59E0B] p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black text-[#1F2937] tracking-tight">AI Executive Summary</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-12">Enterprise Performance Overview</p>
        </div>
        <div className="flex items-center gap-4 ml-12 md:ml-0">
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall CSAT</div>
            <div className="text-3xl font-black text-[#F59E0B] leading-none">{analytics.csat}%</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-[#FDBA74]/20 flex items-center justify-center p-1">
            <div className="w-full h-full bg-[#F59E0B] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Core Insights */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Operational Insights</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs font-bold text-slate-500">Dominant Sentiment</span>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${common.bg} ${common.color}`}>{common.label}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs font-bold text-slate-500">Weekly Trajectory</span>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black text-[#1F2937]">Growth</span>
              </div>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 leading-relaxed px-1">
            {trendText} Overall workspace health is currently <strong>{analytics.csat > 80 ? 'Optimal' : 'Stable'}</strong>.
          </p>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-6 lg:col-span-2">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Strategic Recommendations</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-4 p-5 bg-[#FFF7ED]/30 border border-[#FDBA74]/5 rounded-[1.8rem] hover:bg-[#FFF7ED]/50 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">{rec}</p>
              </div>
            ))}
            <div className="flex gap-4 p-5 bg-emerald-50/30 border border-emerald-100/20 rounded-[1.8rem] hover:bg-emerald-50/50 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">Infrastructure is secure. Compliance protocols are active across all <strong>{analytics.total}</strong> interactions.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 py-4 bg-slate-50 border-t border-slate-100 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center justify-between">
        <span>Engine: SentimentSync v4.2 Pro</span>
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Live
        </span>
      </div>
    </div>
  );
}

function DashboardView({ analytics, pieData, trendData, chartRef, onExportCSV, onExportPDF, onRefresh, isRefreshing, onInvite, onClear }: DashboardViewProps) {
  return (
    <div className="p-2 md:p-8 space-y-3 md:space-y-8 animate-in fade-in duration-500">
      <GlobalActionBar
        onExportCSV={onExportCSV}
        onExportPDF={onExportPDF}
        onInvite={onInvite}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onClear={onClear}
      />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
        <div className="col-span-2 lg:col-span-1">
          <StatCard label="Total Interactions" value={analytics.total} sub="+12% from last week" icon={<MessageSquare />} color="orange" trend="up" />
        </div>
        <StatCard label="CSAT Score" value={`${analytics.csat}%`} sub="Excellent performance" icon={<Target />} color="green" trend="up" />
        <StatCard label="Negative Alerts" value={analytics.negative} sub="Needs attention" icon={<Zap />} color="red" trend="down" />
      </div>
      <ExecutiveSummary analytics={analytics} />
      <div ref={chartRef} className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-8">
        <ChartContainer title="Sentiment Distribution" subtitle="Overall emotional state">
          <div className="h-44 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={window?.innerWidth < 768 ? 45 : 60} outerRadius={window?.innerWidth < 768 ? 65 : 80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        <ChartContainer title="Weekly Activity Trend" subtitle="Daily interaction volume">
          <div className="h-44 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={3} dot={{r: 4, fill: '#F59E0B'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}

function TeamView({ collaborators, onInvite, activityLogs }: { collaborators: Collaborator[], onInvite: () => void, activityLogs: ActivityLog[] }) {
  return (
    <div className="p-2 md:p-8 space-y-3 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 md:px-0">
        <div>
          <h2 className="text-base md:text-2xl font-bold text-[#1F2937]">Workspace Directory</h2>
          <p className="text-[10px] md:text-sm text-slate-500 font-medium">Collaborative access for SentimentSync</p>
        </div>
        <button onClick={onInvite} className="bg-[#F59E0B] text-white px-5 py-2 rounded-lg md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all w-full sm:w-auto text-[11px] md:text-sm">
          <UserPlus className="w-3.5 h-3.5 md:w-5 md:h-5" /> New Member
        </button>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl md:rounded-[2rem] overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead className="bg-slate-50 border-b border-[#E5E7EB]">
            <tr>
              <th className="px-5 md:px-8 py-2.5 md:py-5 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400">Member</th>
              <th className="px-5 md:px-8 py-2.5 md:py-5 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {collaborators.map((collab) => (
              <tr key={collab.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 md:px-8 py-2.5 md:py-5 text-[11px] md:text-sm font-bold text-slate-800">{collab.name}</td>
                <td className="px-5 md:px-8 py-2.5 md:py-5 text-[11px] md:text-sm font-medium">{collab.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-white border border-[#E5E7EB] rounded-xl md:rounded-[2rem] p-4 md:p-8 shadow-sm">
        <h3 className="text-base md:text-lg font-bold mb-3 md:mb-6 text-[#1F2937]">Activity Timeline</h3>
        <div className="space-y-3 md:space-y-6">
            {activityLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
                <div key={log.id} className="relative pl-6 md:pl-8 border-l-2 border-[#FFF7ED] last:border-0 pb-1 md:pb-2">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-[#F59E0B] rounded-full border-4 border-white" />
                    <div className="text-[11px] md:text-sm font-bold text-slate-800">{log.action}</div>
                    <div className="text-[9px] md:text-xs text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function ReportsView({ conversations, onExportCSV, onExportPDF }: { conversations: Conversation[], onExportCSV: () => void, onExportPDF: () => void }) {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const filteredConversations = conversations.filter(c => {
    const date = c.created_at.split('T')[0];
    return (!dateRange.start || date >= dateRange.start) && (!dateRange.end || date <= dateRange.end);
  });

  return (
    <div className="p-2 md:p-8 space-y-3 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 px-1">
        <div className="flex gap-1.5 flex-1">
          <input type="date" onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="border border-[#E5E7EB] p-2 rounded-lg md:rounded-xl text-[10px] md:text-xs flex-1 bg-white outline-none" />
          <input type="date" onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="border border-[#E5E7EB] p-2 rounded-lg md:rounded-xl text-[10px] md:text-xs flex-1 bg-white outline-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={onExportCSV} className="bg-[#FFF7ED] px-4 py-2 rounded-lg md:rounded-xl text-[#F59E0B] text-[10px] md:text-xs font-bold flex-1 sm:flex-none border border-[#FDBA74]/20 shadow-sm">Export CSV</button>
          <button onClick={onExportPDF} className="bg-[#FFF7ED] px-4 py-2 rounded-lg md:rounded-xl text-[#F59E0B] text-[10px] md:text-xs font-bold flex-1 sm:flex-none border border-[#FDBA74]/20 shadow-sm">Export PDF</button>
        </div>
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-xl md:rounded-[2rem] p-3 md:p-6 shadow-sm overflow-x-auto">
        <h3 className="text-base md:text-lg font-bold mb-3 text-[#1F2937] px-1">Download History</h3>
        <table className="w-full min-w-[400px]">
          <thead className="text-left border-b border-[#E5E7EB]">
            <tr>
              <th className="px-2 py-2 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-wider">Session Title</th>
              <th className="px-2 py-2 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-wider">Created Date</th>
            </tr>
          </thead>
          <tbody>
              {filteredConversations.map(conv => (
                <tr key={conv.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-2.5 md:py-4 text-[11px] md:text-sm font-medium text-slate-700">{conv.title}</td>
                    <td className="px-2 py-2.5 md:py-4 text-[11px] md:text-sm text-slate-400 font-medium">{conv.created_at.split('T')[0]}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DatasetAnalysisView() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="bg-white border rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-xl md:text-2xl font-bold">Dataset Analysis</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border p-2 rounded-xl text-xs flex-1" />
          <button onClick={handleUpload} disabled={!file || loading} className="bg-[#F59E0B] text-white px-6 py-2.5 rounded-xl font-bold text-xs">
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>
        </div>
      </div>
      {analysis && (
        <div className="bg-white border rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-bold">Analysis Summary</h3>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{analysis.summary}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{name: 'Pos', value: analysis.positive}, {name: 'Neg', value: analysis.negative}, {name: 'Neu', value: analysis.neutral}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  <Cell fill="#22C55E" />
                  <Cell fill="#EF4444" />
                  <Cell fill="#FBBF24" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
interface NavItemProps {
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  active: boolean;
  sidebarOpen: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, sidebarOpen, onClick }: NavItemProps) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[1.2rem] transition-all group ${active ? 'bg-[#FBBF24]/15 text-[#F59E0B] shadow-sm ring-1 ring-[#FDBA74]/20' : 'text-slate-400 hover:bg-[#FBBF24]/10 hover:text-slate-600'}`}>
      <span className={`${active ? 'text-[#F59E0B]' : 'text-slate-400 group-hover:text-[#F59E0B]'} transition-colors`}>
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </span>
      {sidebarOpen && <span className="text-[13px] font-bold whitespace-nowrap tracking-tight">{label}</span>}
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactElement<{ className?: string }>;
  color: 'orange' | 'green' | 'red';
  trend: 'up' | 'down';
}

function StatCard({ label, value, sub, icon, color, trend }: StatCardProps) {
  const colors = {
    orange: 'text-[#F59E0B] bg-[#FBBF24]/10 border-[#FDBA74]/15 shadow-[#F59E0B]/5',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-500/5',
    red: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-500/5'
  };

  return (
    <div className={`p-5 md:p-7 rounded-[1.8rem] md:rounded-[2.2rem] border shadow-xl transition-all hover:translate-y-[-2px] duration-300 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="p-2.5 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100/50">{React.cloneElement(icon, { className: "w-4 h-4 md:w-5 md:h-5" })}</div>
        <div className={`p-1 md:p-1.5 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ArrowDownRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
        </div>
      </div>
      <div className="text-2xl md:text-3xl font-black tracking-tight mb-1 text-slate-800">{value}</div>
      <div className="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">{label}</div>
      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-current opacity-10 flex items-center gap-2">
         <span className="text-[9px] md:text-[10px] font-bold tracking-tight truncate">{sub}</span>
      </div>
    </div>
  );
}

interface ChartContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function ChartContainer({ title, subtitle, children }: ChartContainerProps) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] border border-[#E5E7EB] shadow-lg shadow-slate-200/20 space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base md:text-lg font-black tracking-tight text-slate-800">{title}</h3>
          <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1">{subtitle}</p>
        </div>
        <button className="p-2 md:p-2.5 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"><Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" /></button>
      </div>
      {children}
    </div>
  );
}

interface InsightMetricProps {
  label: string;
  value: string;
  icon: React.ReactElement<{ className?: string }>;
  score: number;
}

function InsightMetric({ label, value, icon, score }: InsightMetricProps) {
  return (
    <div className="space-y-3 md:space-y-4 p-4 md:p-5 hover:bg-[#FFF7ED] rounded-[1.5rem] md:rounded-[1.8rem] transition-all duration-300 border border-transparent hover:border-[#FDBA74]/20 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
          {React.cloneElement(icon, { className: "w-3.5 h-3.5 md:w-4 md:h-4 text-[#F59E0B]" })}
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{label}</span>
        </div>
        <span className="text-xs md:text-sm font-black text-[#F59E0B] tracking-tight">{value}</span>
      </div>
      <div className="h-1.5 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-1000 shadow-sm shadow-orange-500/30" style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
}
