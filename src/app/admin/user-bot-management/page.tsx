'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Bot, 
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  MoreVertical,
  Activity,
  User,
  Cpu,
  Mail,
  Building,
  Calendar,
  Shield,
  Edit,
  X,
  UserPlus
} from 'lucide-react';
import { collection, query, where, onSnapshot, Timestamp, addDoc, updateDoc, doc, getDocs, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { 
  userManagementAlerts, 
  botManagementAlerts, 
  loadingAlerts, 
  closeAlert 
} from '@/utils/alerts';

// Type definitions for Firestore data
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  isActive: boolean;
  organization_id?: string;
  ecoPoints: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by_admin: string;
}

interface BotData {
  id: string;
  bot_id: string;
  name: string;
  organization?: string;
  organization_id?: string;
  assigned_to?: string;
  assigned_at?: Timestamp;
  owner_admin_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  notes: string;
}

interface BotRegistry {
  id: string;
  bot_id: string;
  is_registered: boolean;
  created_at: Timestamp;
}

export default function UserBotManagement() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [bots, setBots] = useState<BotData[]>([]);
  const [organizations, setOrganizations] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<User | BotData | null>(null);
  const [currentUser] = useAuthState(auth);

  // Bot management states
  const [manageTab, setManageTab] = useState('details');
  const [pendingAssignment, setPendingAssignment] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [editBotData, setEditBotData] = useState<Partial<BotData>>({});
  const [hasBotChanges, setHasBotChanges] = useState(false);
  const [isEditingBot, setIsEditingBot] = useState(false);

  // Additional states for user management
  const [userManageTab, setUserManageTab] = useState('profile');
  const [editUserData, setEditUserData] = useState<Partial<User>>({});
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // Quick action modal states
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [quickActionType, setQuickActionType] = useState<'assign' | 'reassign' | 'unassign' | 'unregister' | null>(null);
  const [quickActionSearchUser, setQuickActionSearchUser] = useState('');
  const [quickActionSearchBot, setQuickActionSearchBot] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  // Fetch users created by current admin
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('created_by', '==', currentUser.uid)
        );
        
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
          const usersData: User[] = [];
          snapshot.forEach((doc) => {
            usersData.push({ id: doc.id, ...doc.data() } as User);
          });
          setUsers(usersData);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Fetch bots owned by current admin
  useEffect(() => {
    if (!currentUser) return;

    const fetchBots = async () => {
      try {
        const botsQuery = query(
          collection(db, 'bots'),
          where('owner_admin_id', '==', currentUser.uid)
        );
        
        const unsubscribe = onSnapshot(botsQuery, (snapshot) => {
          const botsData: BotData[] = [];
          snapshot.forEach((doc) => {
            botsData.push({ id: doc.id, ...doc.data() } as BotData);
          });
          setBots(botsData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching bots:', error);
        setLoading(false);
      }
    };

    fetchBots();
  }, [currentUser]);

  // Fetch organizations created by current admin
  useEffect(() => {
    if (!currentUser) return;

    const fetchOrganizations = async () => {
      try {
        const orgsQuery = query(
          collection(db, 'organizations'),
          where('creator_user_id', '==', currentUser.uid)
        );
        
        const unsubscribe = onSnapshot(orgsQuery, (snapshot) => {
          const orgsMap = new Map<string, string>();
          snapshot.forEach((doc) => {
            const data = doc.data();
            orgsMap.set(doc.id, data.name);
          });
          setOrganizations(orgsMap);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    fetchOrganizations();
  }, [currentUser]);

  // Initialize edit data when selectedItem changes
  useEffect(() => {
    if (selectedItem && activeView === 'users') {
      const user = selectedItem as User;
      setEditUserData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      });
      setHasUserChanges(false);
      setIsEditingUser(false);
    } else if (selectedItem && activeView === 'bots') {
      const bot = selectedItem as BotData;
      setEditBotData({
        name: bot.name,
        organization: bot.organization,
        organization_id: bot.organization_id,
        notes: bot.notes
      });
      setHasBotChanges(false);
      setIsEditingBot(false);
    }
  }, [selectedItem, activeView]);

  // Helper function to get user status
  const getUserStatus = (user: User) => {
    return user.isActive ? 'Active' : 'Offline';
  };

  // Helper function to get bot status (changed from Active to Online)
  const getBotStatus = (bot: BotData) => {
    if (bot.assigned_to) {
      return 'Online';
    }
    return 'Offline';
  };

  // Helper function to get user's assigned bots
  const getUserAssignedBots = (userId: string) => {
    return bots.filter(bot => bot.assigned_to === userId);
  };

  // Helper function to find assigned user for bot
  const getBotAssignedUser = (bot: BotData) => {
    if (!bot.assigned_to) return 'Unassigned';
    const user = users.find(u => u.id === bot.assigned_to);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  // Helper function to get organization name
  const getOrganizationName = (organizationId?: string) => {
    if (!organizationId) return 'No Organization';
    return organizations.get(organizationId) || 'Unknown Organization';
  };

  // Handle user profile field changes
  const handleUserFieldChange = (field: string, value: string) => {
    setEditUserData(prev => ({ ...prev, [field]: value }));
    
    // Check if there are changes
    if (selectedItem) {
      const user = selectedItem as User;
      const currentData = { ...editUserData, [field]: value };
      const hasChanges = 
        currentData.first_name !== user.first_name ||
        currentData.last_name !== user.last_name ||
        currentData.email !== user.email ||
        currentData.role !== user.role ||
        currentData.organization_id !== user.organization_id;
      
      setHasUserChanges(hasChanges);
    }
  };


  // Save user profile changes
  const handleSaveUserProfile = async () => {
    if (!selectedItem || !hasUserChanges) return;
    
    loadingAlerts.savingUser();
    
    try {
      await updateDoc(doc(db, 'users', selectedItem.id), {
        ...editUserData,
        updated_at: new Date()
      });
      setHasUserChanges(false);
      setIsEditingUser(false);
      // Refresh the selectedItem with new data
      const updatedUser = { ...selectedItem, ...editUserData } as User;
      setSelectedItem(updatedUser);
      
      closeAlert();
      userManagementAlerts.userUpdated();
    } catch (error) {
      console.error('Error updating user profile:', error);
      closeAlert();
      userManagementAlerts.userUpdateFailed(error instanceof Error ? error.message : undefined);
    }
  };

  // Update item
  const handleUpdateItem = async (updates: Partial<User | BotData>) => {
    if (!selectedItem) return;
    
    // If deactivating user, show confirmation
    if (activeView === 'users' && 'isActive' in updates && !updates.isActive) {
      const user = selectedItem as User;
      const result = await userManagementAlerts.confirmUserDeactivation(`${user.first_name} ${user.last_name}`);
      if (!result.isConfirmed) return;
    }
    
    try {
      await updateDoc(doc(db, activeView === 'users' ? 'users' : 'bots', selectedItem.id), {
        ...updates,
        updated_at: new Date()
      });
      setShowManageModal(false);
      setSelectedItem(null);
      
      // Show appropriate success message
      if (activeView === 'users' && 'isActive' in updates) {
        if (updates.isActive) {
          userManagementAlerts.userActivated();
        } else {
          userManagementAlerts.userDeactivated();
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
      userManagementAlerts.userStatusUpdateFailed(error instanceof Error ? error.message : undefined);
    }
  };

  // Assign bot to operator
  const handleAssignBot = async (botId: string, operatorId: string | null) => {
    loadingAlerts.assigningBot();
    
    try {
      await updateDoc(doc(db, 'bots', botId), {
        assigned_to: operatorId,
        assigned_at: operatorId ? new Date() : null,
        updated_at: new Date()
      });
      
      setPendingAssignment(null);
      setHasChanges(false);
      setShowManageModal(false);
      setSelectedItem(null);
      
      closeAlert();
      
      if (operatorId) {
        const bot = selectedItem as BotData;
        const user = users.find(u => u.id === operatorId);
        if (user && bot) {
          botManagementAlerts.botAssigned(bot.bot_id, `${user.first_name} ${user.last_name}`);
        }
      }
    } catch (error) {
      console.error('Error assigning bot:', error);
      closeAlert();
      botManagementAlerts.botAssignmentFailed(error instanceof Error ? error.message : undefined);
    }
  };


  // Unregister bot
  const handleUnregisterBot = async (botId: string, bot_id: string) => {
    const bot = selectedItem as BotData;
    const result = await botManagementAlerts.confirmBotUnregistration(bot_id, bot.name);
    if (!result.isConfirmed) return;
    
    try {
      // Delete bot document completely
      await deleteDoc(doc(db, 'bots', botId));

      // Update registry to mark as unregistered (document ID is the bot_id)
      await updateDoc(doc(db, 'bot_registry', bot_id), {
        is_registered: false,
        unregistered_at: new Date()
      });

      setShowManageModal(false);
      setSelectedItem(null);
      setManageTab('details');
      
      botManagementAlerts.botUnregistered(bot_id);
    } catch (error) {
      console.error('Error unregistering bot:', error);
      botManagementAlerts.botUnregistrationFailed(error instanceof Error ? error.message : undefined);
    }
  };

  // Unlink bot from user with confirmation
  const handleUnlinkBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;
    
    const result = await userManagementAlerts.confirmBotUnlink(bot.name);
    if (!result.isConfirmed) return;
    
    try {
      await updateDoc(doc(db, 'bots', botId), {
        assigned_to: null,
        assigned_at: null,
        updated_at: new Date()
      });
      
      userManagementAlerts.botUnlinked();
    } catch (error) {
      console.error('Error unlinking bot:', error);
      userManagementAlerts.botUnlinkFailed(error instanceof Error ? error.message : undefined);
    }
  };


  // Cancel editing
  const handleCancelEditUser = () => {
    if (selectedItem) {
      const user = selectedItem as User;
      setEditUserData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      });
      setHasUserChanges(false);
      setIsEditingUser(false);
    }
  };

  // Get pending assignment user
  const getPendingAssignmentUser = () => {
    if (!pendingAssignment) return 'Unassigned';
    const user = users.find(u => u.id === pendingAssignment);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  // Handle assignment change
  const handleAssignmentChange = (operatorId: string) => {
    setPendingAssignment(operatorId || null);
    const currentAssignment = (selectedItem as BotData)?.assigned_to;
    setHasChanges(operatorId !== currentAssignment);
  };
  
  // Quick action handlers
  // const openQuickActionModal = (type: 'assign' | 'reassign' | 'unassign' | 'unregister') => {
  //   setQuickActionType(type);
  //   setShowQuickActionModal(true);
  //   setQuickActionSearchUser('');
  //   setQuickActionSearchBot('');
  //   setSelectedUserId(null);
  //   setSelectedBotId(null);
  // };
  
  const closeQuickActionModal = () => {
    setShowQuickActionModal(false);
    setQuickActionType(null);
    setQuickActionSearchUser('');
    setQuickActionSearchBot('');
    setSelectedUserId(null);
    setSelectedBotId(null);
  };
  
  const handleQuickAssign = async () => {
    if (!selectedUserId || !selectedBotId) return;
    
    loadingAlerts.assigningBot();
    
    try {
      await updateDoc(doc(db, 'bots', selectedBotId), {
        assigned_to: selectedUserId,
        assigned_at: new Date(),
        updated_at: new Date()
      });
      
      closeAlert();
      const bot = bots.find(b => b.id === selectedBotId);
      const user = users.find(u => u.id === selectedUserId);
      if (bot && user) {
        botManagementAlerts.botAssigned(bot.bot_id, `${user.first_name} ${user.last_name}`);
      }
      closeQuickActionModal();
    } catch (error) {
      console.error('Error assigning bot:', error);
      closeAlert();
      botManagementAlerts.botAssignmentFailed(error instanceof Error ? error.message : undefined);
    }
  };
  
  const handleQuickReassign = async () => {
    if (!selectedBotId) return;
    
    const bot = bots.find(b => b.id === selectedBotId);
    if (!bot || !bot.assigned_to) {
      alert('Please select a bot that is currently assigned');
      return;
    }
    
    if (!selectedUserId) {
      alert('Please select a new operator');
      return;
    }
    
    loadingAlerts.assigningBot();
    
    try {
      await updateDoc(doc(db, 'bots', selectedBotId), {
        assigned_to: selectedUserId,
        assigned_at: new Date(),
        updated_at: new Date()
      });
      
      closeAlert();
      const user = users.find(u => u.id === selectedUserId);
      if (bot && user) {
        botManagementAlerts.botAssigned(bot.bot_id, `${user.first_name} ${user.last_name}`);
      }
      closeQuickActionModal();
    } catch (error) {
      console.error('Error reassigning bot:', error);
      closeAlert();
      botManagementAlerts.botAssignmentFailed(error instanceof Error ? error.message : undefined);
    }
  };
  
  const handleQuickUnassign = async () => {
    if (!selectedBotId) return;
    
    const bot = bots.find(b => b.id === selectedBotId);
    if (!bot || !bot.assigned_to) {
      alert('Please select a bot that is currently assigned');
      return;
    }
    
    const result = await userManagementAlerts.confirmBotUnlink(bot.name);
    if (!result.isConfirmed) return;
    
    try {
      await updateDoc(doc(db, 'bots', selectedBotId), {
        assigned_to: null,
        assigned_at: null,
        updated_at: new Date()
      });
      
      userManagementAlerts.botUnlinked();
      closeQuickActionModal();
    } catch (error) {
      console.error('Error unassigning bot:', error);
      userManagementAlerts.botUnlinkFailed(error instanceof Error ? error.message : undefined);
    }
  };

  // const getStatusColor = (status: string) => {
  //   switch (status.toLowerCase()) {
  //     case 'active': return 'text-green-600 bg-green-50';
  //     case 'offline': return 'text-red-600 bg-red-50';
  //     case 'available': return 'text-blue-600 bg-blue-50';
  //     default: return 'text-gray-600 bg-gray-50';
  //   }
  // };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'online': return <CheckCircle className="h-3 w-3" />;
      case 'offline': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'field_operator': return <User className="h-4 w-4 text-blue-600" />;
      case 'supervisor': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'admin': return <Settings className="h-4 w-4 text-blue-600" />;
      default: return <User className="h-4 w-4 text-blue-600" />;
    }
  };

  // Get bot type icon
  const getBotTypeIcon = () => {
    return <Cpu className="h-4 w-4 text-green-600" />;
  };

  // Helper function to format last activity
  const getLastActivity = (user: User) => {
    if (!user.updated_at) return 'No activity';
    const lastActivity = user.updated_at.toDate();
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return lastActivity.toLocaleDateString();
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const userStatus = getUserStatus(user);
    const matchesStatus = statusFilter === 'all' || userStatus.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.bot_id.toLowerCase().includes(searchTerm.toLowerCase());
    const botStatus = getBotStatus(bot);
    const matchesStatus = statusFilter === 'all' || botStatus.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeUsers = users.filter(u => u.isActive).length;
  const activeBots = bots.filter(b => getBotStatus(b) === 'Online').length;
  const totalUsers = users.length;
  const totalBots = bots.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
          <p className="text-slate-700 text-sm">Loading management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-1">Team & Fleet Management</h1>
              <p className="text-slate-600 text-sm">Manage field operators and autonomous systems</p>
            </div>
            
            {/* Removed Add button from header - moved to quick actions */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Enhanced Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Operators</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activeUsers}</p>
                <p className="text-xs text-gray-500 mt-0.5">{totalUsers} total</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Bots</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activeBots}</p>
                <p className="text-xs text-gray-500 mt-0.5">{totalBots} deployed</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <Bot className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignment Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalBots > 0 ? Math.round((activeBots / totalBots) * 100) : 0}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Bots deployed</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* View Selection */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveView('users')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'users'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Operators</span>
                </button>
                <button
                  onClick={() => setActiveView('bots')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'bots'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">Bots</span>
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="lg:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${activeView}...`}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="lg:w-40">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                {activeView === 'bots' && <option value="online">Online</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        {activeView === 'users' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/admin/user-bot-management/add-operator')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Operator
              </button>
            </div>
          </div>
        )}

        {activeView === 'bots' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/admin/user-bot-management/add-bot')}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bot
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {activeView === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const assignedBots = getUserAssignedBots(user.id);
              const userStatus = getUserStatus(user);
              const lastActivity = getLastActivity(user);
              
              return (
                <div key={user.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="p-4">
                    {/* Header with icon and status */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 truncate text-sm">{user.first_name} {user.last_name}</h4>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            userStatus === 'Active' 
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                              : 'text-red-700 bg-red-50 border border-red-200'
                          }`}>
                            {getStatusIcon(userStatus)}
                            {userStatus}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                          <Mail className="h-2.5 w-2.5" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-700 truncate capitalize">{user.role.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <Building className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-700 truncate">{getOrganizationName(user.organization_id)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <Bot className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-700">{assignedBots.length} Bot{assignedBots.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-700 font-medium">{lastActivity}</span>
                      </div>
                    </div>

                    {/* Assigned Bots */}
                    <div className="mb-3 min-h-[1.5rem]">
                      {assignedBots.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedBots.slice(0, 2).map((bot) => (
                            <span key={bot.id} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                              <Cpu className="h-3 w-3 mr-1" />
                              {bot.bot_id}
                            </span>
                          ))}
                          {assignedBots.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-xs border border-gray-200">
                              +{assignedBots.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-200">
                          <Bot className="h-3 w-3" />
                          <span>No bots assigned</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedItem(user);
                          setShowManageModal(true);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit className="h-4 w-4" />
                        Manage
                      </button>
                      <button className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'bots' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBots.map((bot) => {
              const botStatus = getBotStatus(bot);
              const assignedUser = getBotAssignedUser(bot);
              
              return (
                <div key={bot.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        {getBotTypeIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 truncate text-sm">{bot.name}</h4>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            botStatus === 'Online' 
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                              : 'text-gray-700 bg-gray-50 border border-gray-200'
                          }`}>
                            {getStatusIcon(botStatus)}
                            {botStatus}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <span className="truncate font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{bot.bot_id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-700 truncate">{assignedUser}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <Building className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-700 truncate">{bot.organization || 'No organization'}</span>
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div className="mb-3 min-h-[1.5rem] flex items-center">
                      <div className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg p-2 border border-gray-200 w-full">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: botStatus === 'Online' ? '#10b981' : '#6b7280' }}
                        ></div>
                        <span className="text-gray-700">
                          {bot.assigned_to ? 'Currently assigned' : 'Available for assignment'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedItem(bot);
                          setShowManageModal(true);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit className="h-4 w-4" />
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enhanced Manage Modal */}
      {showManageModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Manage {activeView === 'users' ? (selectedItem as User).first_name + ' ' + (selectedItem as User).last_name : (selectedItem as BotData).name}
                </h3>
                <button 
                  onClick={() => {
                    setShowManageModal(false);
                    setPendingAssignment(null);
                    setHasChanges(false);
                    setManageTab('details');
                    setUserManageTab('profile');
                    setHasUserChanges(false);
                    setIsEditingUser(false);
                    setHasBotChanges(false);
                    setIsEditingBot(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {activeView === 'users' ? (
                <div className="space-y-6">
                  {/* Tab Navigation for Users */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setUserManageTab('profile')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        userManageTab === 'profile'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => setUserManageTab('bots')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        userManageTab === 'bots'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Assigned Bots
                    </button>
                  </div>

                  {userManageTab === 'profile' ? (
                    <div className="space-y-4">
                      {/* Profile Edit Form */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            {isEditingUser ? (
                              <input
                                type="text"
                                value={editUserData.first_name || ''}
                                onChange={(e) => handleUserFieldChange('firstname', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                            ) : (
                              <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200">
                                {(selectedItem as User).first_name}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            {isEditingUser ? (
                              <input
                                type="text"
                                value={editUserData.last_name || ''}
                                onChange={(e) => handleUserFieldChange('lastname', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                            ) : (
                              <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200">
                                {(selectedItem as User).last_name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          {isEditingUser ? (
                            <input
                              type="email"
                              value={editUserData.email || ''}
                              onChange={(e) => handleUserFieldChange('email', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          ) : (
                            <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200">
                              {(selectedItem as User).email}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                          {isEditingUser ? (
                            <select
                              value={editUserData.organization_id || ''}
                              onChange={(e) => handleUserFieldChange('organization_id', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="">No Organization</option>
                              {Array.from(organizations.entries()).map(([id, name]) => (
                                <option key={id} value={id}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200">
                              {getOrganizationName((selectedItem as User).organization_id)}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 capitalize">
                            {(selectedItem as User).role.replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      {/* Profile Actions */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        {isEditingUser ? (
                          <>
                            <button
                              onClick={handleSaveUserProfile}
                              disabled={!hasUserChanges}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors shadow-sm"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancelEditUser}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsEditingUser(true)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors shadow-sm"
                            >
                              Edit User
                            </button>
                            <button
                              onClick={() => handleUpdateItem({ isActive: !(selectedItem as User).isActive })}
                              className={`flex-1 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors shadow-sm ${
                                (selectedItem as User).isActive 
                                  ? 'bg-orange-600 hover:bg-orange-700' 
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {(selectedItem as User).isActive ? 'Deactivate User' : 'Activate User'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Assigned Bots Tab */
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Assigned Bots</h4>
                        <p className="text-xs text-gray-600 mb-3">
                          Bots currently assigned to {(selectedItem as User).first_name} {(selectedItem as User).last_name}
                        </p>
                        
                        {(() => {
                          const userBots = getUserAssignedBots(selectedItem.id);
                          
                          if (userBots.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Bot className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-sm font-medium">No bots assigned</p>
                                <p className="text-gray-400 text-xs mt-1">This user doesn&apos;t have any bots assigned yet</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {userBots.map((bot) => (
                                <div key={bot.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                      <Cpu className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{bot.name}</p>
                                      <p className="text-xs text-gray-500 font-mono">{bot.bot_id}</p>
                                      {bot.organization && (
                                        <p className="text-xs text-gray-400">{bot.organization}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <div className="text-right">
                                      <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                                        Active
                                      </div>
                                      {bot.assigned_at && (
                                        <p className="text-xs text-gray-400 mt-1">
                                          Since {bot.assigned_at.toDate().toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <button
                                      onClick={() => handleUnlinkBot(bot.id)}
                                      className="bg-red-100 hover:bg-red-200 text-red-600 rounded-lg p-2 text-xs font-medium transition-colors"
                                      title="Unlink bot"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Bot management section
                <div className="space-y-6">
                  {/* Tab Navigation */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setManageTab('details')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        manageTab === 'details'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setManageTab('assign')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        manageTab === 'assign'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Assignment
                    </button>
                    <button
                      onClick={() => setManageTab('unregister')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        manageTab === 'unregister'
                          ? 'bg-white text-red-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Unregister
                    </button>
                  </div>

                  {manageTab === 'details' ? (
                    /* Bot Details Tab */
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
                          {isEditingBot ? (
                            <input
                              type="text"
                              value={editBotData.name || ''}
                              onChange={(e) => {
                                setEditBotData(prev => ({ ...prev, name: e.target.value }));
                                setHasBotChanges(true);
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            />
                          ) : (
                            <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200">
                              {(selectedItem as BotData).name}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bot ID</label>
                          <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 font-mono">
                            {(selectedItem as BotData).bot_id}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                          {isEditingBot ? (
                            <select
                              value={editBotData.organization_id || ''}
                              onChange={(e) => {
                                const orgId = e.target.value;
                                setEditBotData(prev => ({ 
                                  ...prev, 
                                  organization_id: orgId,
                                  organization: orgId ? organizations.get(orgId) : undefined
                                }));
                                setHasBotChanges(true);
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            >
                              <option value="">No Organization</option>
                              {Array.from(organizations.entries()).map(([id, name]) => (
                                <option key={id} value={id}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200">
                              {(selectedItem as BotData).organization || getOrganizationName((selectedItem as BotData).organization_id)}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          {isEditingBot ? (
                            <textarea
                              value={editBotData.notes || ''}
                              onChange={(e) => {
                                setEditBotData(prev => ({ ...prev, notes: e.target.value }));
                                setHasBotChanges(true);
                              }}
                              rows={3}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                            />
                          ) : (
                            <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px]">
                              {(selectedItem as BotData).notes || 'No notes'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bot Details Actions */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        {isEditingBot ? (
                          <>
                            <button
                              onClick={async () => {
                                if (!selectedItem || !hasBotChanges) return;
                                
                                loadingAlerts.savingUser();
                                
                                try {
                                  // Filter out undefined values
                                  const updateData: any = {
                                    updated_at: new Date()
                                  };
                                  
                                  if (editBotData.name !== undefined) updateData.name = editBotData.name;
                                  if (editBotData.organization !== undefined) updateData.organization = editBotData.organization || null;
                                  if (editBotData.organization_id !== undefined) updateData.organization_id = editBotData.organization_id || null;
                                  if (editBotData.notes !== undefined) updateData.notes = editBotData.notes || '';
                                  
                                  await updateDoc(doc(db, 'bots', selectedItem.id), updateData);
                                  setHasBotChanges(false);
                                  setIsEditingBot(false);
                                  const updatedBot = { ...selectedItem, ...editBotData } as BotData;
                                  setSelectedItem(updatedBot);
                                  
                                  closeAlert();
                                  alert('Bot updated successfully!');
                                } catch (error) {
                                  console.error('Error updating bot:', error);
                                  closeAlert();
                                  alert('Failed to update bot');
                                }
                              }}
                              disabled={!hasBotChanges}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors shadow-sm"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => {
                                if (selectedItem) {
                                  const bot = selectedItem as BotData;
                                  setEditBotData({
                                    name: bot.name,
                                    organization: bot.organization,
                                    organization_id: bot.organization_id,
                                    notes: bot.notes
                                  });
                                  setHasBotChanges(false);
                                  setIsEditingBot(false);
                                }
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsEditingBot(true)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors shadow-sm"
                          >
                            Edit Bot
                          </button>
                        )}
                      </div>
                    </div>
                  ) : manageTab === 'assign' ? (
                    <>
                      {/* Current Assignment Section */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Assignment</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getBotAssignedUser(selectedItem as BotData)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedItem as BotData).assigned_to ? 'Currently assigned' : 'No operator assigned'}
                            </p>
                          </div>
                        </div>
                        
                        {(selectedItem as BotData).assigned_to && (
                          <button 
                            onClick={() => handleAssignmentChange('')}
                            className="mt-3 w-full bg-gray-600 hover:bg-gray-700 text-white rounded-lg py-2 px-3 text-sm font-medium transition-colors shadow-sm"
                          >
                            Remove Current Assignment
                          </button>
                        )}
                      </div>

                      {/* Assignment Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Operator</label>
                        <select 
                          value={pendingAssignment || (selectedItem as BotData).assigned_to || ''}
                          onChange={(e) => handleAssignmentChange(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Select Operator</option>
                          {users.filter(u => u.isActive).map(user => (
                            <option key={user.id} value={user.id}>
                              {user.first_name} {user.last_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Changes Preview */}
                      {hasChanges && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">Preview Changes</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">From:</span>
                              <span className="font-medium text-gray-900">
                                {getBotAssignedUser(selectedItem as BotData)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">To:</span>
                              <span className="font-medium text-blue-800">
                                {getPendingAssignmentUser()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {hasChanges ? (
                          <button 
                            onClick={() => handleAssignBot(selectedItem.id, pendingAssignment)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors shadow-sm"
                          >
                            Save Changes
                          </button>
                        ) : (
                          <button 
                          onClick={() => {
                            setShowManageModal(false);
                            setPendingAssignment(null);
                            setHasChanges(false);
                            setManageTab('details');
                          }}
                            className="flex-1 border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Close
                          </button>
                        )}
                        
                        {hasChanges && (
                          <button 
                            onClick={() => {
                              setPendingAssignment(null);
                              setHasChanges(false);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Unregister Tab */
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-red-800 mb-1">Unregister Bot</h4>
                            <p className="text-sm text-red-700">
                              This will remove the bot from your fleet and make it available for registration by other admins.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Bot Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bot ID:</span>
                            <span className="font-medium">{(selectedItem as BotData).bot_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{(selectedItem as BotData).name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Assignment:</span>
                            <span className="font-medium">{getBotAssignedUser(selectedItem as BotData)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button 
                          onClick={() => handleUnregisterBot(selectedItem.id, (selectedItem as BotData).bot_id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 px-4 text-sm font-medium transition-colors shadow-sm"
                        >
                          Confirm Unregister Bot
                        </button>
                        <button 
                          onClick={() => setManageTab('assign')}
                          className="w-full border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Action Modal */}
      {showQuickActionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {quickActionType === 'assign' && (activeView === 'users' ? 'Assign Bot to Operator' : 'Assign Operator to Bot')}
                  {quickActionType === 'reassign' && (activeView === 'users' ? 'Reassign Bot' : 'Reassign Operator')}
                  {quickActionType === 'unassign' && 'Unassign Bot'}
                  {quickActionType === 'unregister' && 'Unregister Bot'}
                </h3>
                <button 
                  onClick={closeQuickActionModal}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {quickActionType === 'unregister' ? (
                /* Unregister Bot List */
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-1">Unregister Bot</h4>
                        <p className="text-sm text-red-700">
                          Select a bot to unregister. This will remove it from your fleet.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search bots..."
                      value={quickActionSearchBot}
                      onChange={(e) => setQuickActionSearchBot(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {bots
                      .filter(bot => 
                        bot.name.toLowerCase().includes(quickActionSearchBot.toLowerCase()) ||
                        bot.bot_id.toLowerCase().includes(quickActionSearchBot.toLowerCase())
                      )
                      .map(bot => (
                        <div key={bot.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Cpu className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{bot.name}</h4>
                                <p className="text-sm text-gray-600 font-mono">{bot.bot_id}</p>
                                <p className="text-xs text-gray-500">{bot.organization || 'No organization'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnregisterBot(bot.id, bot.bot_id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Unregister
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* Assign/Reassign/Unassign - Two Column Layout */
                <div className="grid grid-cols-2 gap-4">
                  {/* Users Column (or Bots if in bots view) */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{activeView === 'users' ? 'Select Operator' : 'Select Bot'}</h4>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={`Search ${activeView === 'users' ? 'operators' : 'bots'}...`}
                          value={activeView === 'users' ? quickActionSearchUser : quickActionSearchBot}
                          onChange={(e) => activeView === 'users' ? setQuickActionSearchUser(e.target.value) : setQuickActionSearchBot(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {activeView === 'users' ? (
                        /* Show Operators */
                        users
                          .filter(u => u.role === 'field_operator' && u.isActive)
                          .filter(u => 
                            `${u.first_name} ${u.last_name}`.toLowerCase().includes(quickActionSearchUser.toLowerCase()) ||
                            u.email.toLowerCase().includes(quickActionSearchUser.toLowerCase())
                          )
                          .map(user => (
                            <button
                              key={user.id}
                              onClick={() => setSelectedUserId(user.id)}
                              className={`w-full text-left border rounded-lg p-3 transition-colors ${
                                selectedUserId === user.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">{user.first_name} {user.last_name}</p>
                                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                </div>
                                {selectedUserId === user.id && (
                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                            </button>
                          ))
                      ) : (
                        /* Show Bots */
                        bots
                          .filter(bot => {
                            if (quickActionType === 'reassign' || quickActionType === 'unassign') {
                              return bot.assigned_to; // Only show assigned bots
                            }
                            return true;
                          })
                          .filter(bot => 
                            bot.name.toLowerCase().includes(quickActionSearchBot.toLowerCase()) ||
                            bot.bot_id.toLowerCase().includes(quickActionSearchBot.toLowerCase())
                          )
                          .map(bot => (
                            <button
                              key={bot.id}
                              onClick={() => setSelectedBotId(bot.id)}
                              className={`w-full text-left border rounded-lg p-3 transition-colors ${
                                selectedBotId === bot.id
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                  <Cpu className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">{bot.name}</p>
                                  <p className="text-xs text-gray-600 truncate font-mono">{bot.bot_id}</p>
                                </div>
                                {selectedBotId === bot.id && (
                                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                                )}
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                  
                  {/* Bots Column (or Users if in bots view) - Only for assign/reassign */}
                  {quickActionType !== 'unassign' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{activeView === 'users' ? 'Select Bot' : 'Select Operator'}</h4>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder={`Search ${activeView === 'users' ? 'bots' : 'operators'}...`}
                            value={activeView === 'users' ? quickActionSearchBot : quickActionSearchUser}
                            onChange={(e) => activeView === 'users' ? setQuickActionSearchBot(e.target.value) : setQuickActionSearchUser(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {activeView === 'users' ? (
                          /* Show Bots */
                          bots
                            .filter(bot => {
                              if (quickActionType === 'reassign') {
                                return !bot.assigned_to; // Only show unassigned bots for reassign
                              }
                              return !bot.assigned_to; // Only show unassigned bots
                            })
                            .filter(bot => 
                              bot.name.toLowerCase().includes(quickActionSearchBot.toLowerCase()) ||
                              bot.bot_id.toLowerCase().includes(quickActionSearchBot.toLowerCase())
                            )
                            .map(bot => (
                              <button
                                key={bot.id}
                                onClick={() => setSelectedBotId(bot.id)}
                                className={`w-full text-left border rounded-lg p-3 transition-colors ${
                                  selectedBotId === bot.id
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Cpu className="h-4 w-4 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">{bot.name}</p>
                                    <p className="text-xs text-gray-600 truncate font-mono">{bot.bot_id}</p>
                                  </div>
                                  {selectedBotId === bot.id && (
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                  )}
                                </div>
                              </button>
                            ))
                        ) : (
                          /* Show Operators */
                          users
                            .filter(u => u.role === 'field_operator' && u.isActive)
                            .filter(u => 
                              `${u.first_name} ${u.last_name}`.toLowerCase().includes(quickActionSearchUser.toLowerCase()) ||
                              u.email.toLowerCase().includes(quickActionSearchUser.toLowerCase())
                            )
                            .map(user => (
                              <button
                                key={user.id}
                                onClick={() => setSelectedUserId(user.id)}
                                className={`w-full text-left border rounded-lg p-3 transition-colors ${
                                  selectedUserId === user.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">{user.first_name} {user.last_name}</p>
                                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                  </div>
                                  {selectedUserId === user.id && (
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            {quickActionType !== 'unregister' && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (quickActionType === 'assign') {
                        handleQuickAssign();
                      } else if (quickActionType === 'reassign') {
                        handleQuickReassign();
                      } else if (quickActionType === 'unassign') {
                        handleQuickUnassign();
                      }
                    }}
                    disabled={(quickActionType !== 'unassign' && (!selectedUserId || !selectedBotId)) || (quickActionType === 'unassign' && !selectedBotId)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors"
                  >
                    {quickActionType === 'assign' && 'Assign'}
                    {quickActionType === 'reassign' && 'Reassign'}
                    {quickActionType === 'unassign' && 'Unassign'}
                  </button>
                  <button
                    onClick={closeQuickActionModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




