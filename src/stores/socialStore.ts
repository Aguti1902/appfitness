import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Friendship, FriendProfile, RankingEntry } from '../types';

interface SocialState {
  friends: FriendProfile[];
  pendingRequests: Friendship[];
  rankings: RankingEntry[];
  isLoading: boolean;
  
  // Actions
  fetchFriends: (userId: string) => Promise<void>;
  fetchPendingRequests: (userId: string) => Promise<void>;
  sendFriendRequest: (userId: string, friendEmail: string) => Promise<{ error?: string }>;
  acceptFriendRequest: (requestId: string) => Promise<{ error?: string }>;
  rejectFriendRequest: (requestId: string) => Promise<{ error?: string }>;
  removeFriend: (friendId: string) => Promise<{ error?: string }>;
  fetchRankings: (userId: string, period: 'week' | 'month' | 'all') => Promise<void>;
  searchUsers: (query: string) => Promise<FriendProfile[]>;
}

// Demo data
const DEMO_FRIENDS: FriendProfile[] = [
  {
    id: 'friend-1',
    name: 'Carlos García',
    avatar_url: '',
    stats: {
      workouts_this_week: 5,
      workouts_this_month: 18,
      total_workouts: 156,
      current_streak: 12,
      weight_change: -2.5
    }
  },
  {
    id: 'friend-2',
    name: 'María López',
    avatar_url: '',
    stats: {
      workouts_this_week: 4,
      workouts_this_month: 15,
      total_workouts: 89,
      current_streak: 8,
      weight_change: -4.0
    }
  },
  {
    id: 'friend-3',
    name: 'Pedro Martínez',
    avatar_url: '',
    stats: {
      workouts_this_week: 6,
      workouts_this_month: 22,
      total_workouts: 234,
      current_streak: 21,
      weight_change: 3.2
    }
  },
  {
    id: 'friend-4',
    name: 'Ana Ruiz',
    avatar_url: '',
    stats: {
      workouts_this_week: 3,
      workouts_this_month: 12,
      total_workouts: 67,
      current_streak: 5,
      weight_change: -1.8
    }
  }
];

const DEMO_RANKINGS: RankingEntry[] = [
  { user_id: 'friend-3', user_name: 'Pedro Martínez', score: 22, rank: 1 },
  { user_id: 'friend-1', user_name: 'Carlos García', score: 18, rank: 2 },
  { user_id: 'demo-user-id', user_name: 'Tú', score: 15, rank: 3 },
  { user_id: 'friend-2', user_name: 'María López', score: 15, rank: 4 },
  { user_id: 'friend-4', user_name: 'Ana Ruiz', score: 12, rank: 5 }
];

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  rankings: [],
  isLoading: false,

  fetchFriends: async (userId) => {
    set({ isLoading: true });

    // Demo mode
    if (userId === 'demo-user-id') {
      set({ friends: DEMO_FRIENDS, isLoading: false });
      return;
    }

    try {
      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          id,
          friend_id,
          profiles!friendships_friend_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;

      // Get friend stats
      const friends: FriendProfile[] = await Promise.all(
        (friendships || []).map(async (f: any) => {
          const stats = await getFriendStats(f.friend_id);
          return {
            id: f.friend_id,
            name: f.profiles?.name || 'Usuario',
            avatar_url: f.profiles?.avatar_url,
            stats
          };
        })
      );

      set({ friends, isLoading: false });
    } catch (error) {
      console.error('Error fetching friends:', error);
      set({ friends: DEMO_FRIENDS, isLoading: false });
    }
  },

  fetchPendingRequests: async (userId) => {
    // Demo mode
    if (userId === 'demo-user-id') {
      set({ pendingRequests: [] });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      set({ pendingRequests: data || [] });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  },

  sendFriendRequest: async (userId, friendEmail) => {
    // Demo mode
    if (userId === 'demo-user-id') {
      return { error: 'No disponible en modo demo' };
    }

    try {
      // Find user by email
      const { data: friendData, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', friendEmail)
        .single();

      if (findError || !friendData) {
        return { error: 'Usuario no encontrado' };
      }

      // Check if already friends
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', userId)
        .eq('friend_id', friendData.id)
        .single();

      if (existing) {
        return { error: 'Ya tienes una solicitud pendiente o son amigos' };
      }

      // Create friend request
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendData.id,
          status: 'pending'
        });

      if (error) return { error: error.message };
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) return { error: error.message };

      set(state => ({
        pendingRequests: state.pendingRequests.filter(r => r.id !== requestId)
      }));

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) return { error: error.message };

      set(state => ({
        pendingRequests: state.pendingRequests.filter(r => r.id !== requestId)
      }));

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  removeFriend: async (friendId) => {
    // Demo mode
    const { friends } = get();
    const friend = friends.find(f => f.id === friendId);
    if (friend && friendId.startsWith('friend-')) {
      set(state => ({
        friends: state.friends.filter(f => f.id !== friendId)
      }));
      return {};
    }

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('friend_id', friendId);

      if (error) return { error: error.message };

      set(state => ({
        friends: state.friends.filter(f => f.id !== friendId)
      }));

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  fetchRankings: async (userId, period) => {
    // Demo mode
    if (userId === 'demo-user-id') {
      const rankings = DEMO_RANKINGS.map(r => ({
        ...r,
        score: period === 'week' ? Math.floor(r.score / 4) : 
               period === 'all' ? r.score * 10 : r.score
      })).sort((a, b) => b.score - a.score)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      
      set({ rankings });
      return;
    }

    try {
      const { friends } = get();
      
      // Get workout counts for the period
      let startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate = new Date(0); // All time
      }

      const rankings: RankingEntry[] = [];

      // Add current user
      const { count: userCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('workout_date', startDate.toISOString().split('T')[0]);

      rankings.push({
        user_id: userId,
        user_name: 'Tú',
        score: userCount || 0,
        rank: 0
      });

      // Add friends
      for (const friend of friends) {
        const { count } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', friend.id)
          .gte('workout_date', startDate.toISOString().split('T')[0]);

        rankings.push({
          user_id: friend.id,
          user_name: friend.name,
          avatar_url: friend.avatar_url,
          score: count || 0,
          rank: 0
        });
      }

      // Sort and assign ranks
      rankings.sort((a, b) => b.score - a.score);
      rankings.forEach((r, i) => { r.rank = i + 1; });

      set({ rankings });
    } catch (error) {
      console.error('Error fetching rankings:', error);
      set({ rankings: DEMO_RANKINGS });
    }
  },

  searchUsers: async (query) => {
    if (query.length < 3) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      return (data || []).map(u => ({
        id: u.id,
        name: u.name,
        avatar_url: u.avatar_url,
        stats: { workouts_this_week: 0, workouts_this_month: 0, total_workouts: 0, current_streak: 0 }
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}));

async function getFriendStats(friendId: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const [weekResult, monthResult, totalResult] = await Promise.all([
      supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', friendId)
        .gte('workout_date', startOfWeek.toISOString().split('T')[0]),
      supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', friendId)
        .gte('workout_date', startOfMonth.toISOString().split('T')[0]),
      supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', friendId)
    ]);

    return {
      workouts_this_week: weekResult.count || 0,
      workouts_this_month: monthResult.count || 0,
      total_workouts: totalResult.count || 0,
      current_streak: 0 // Would need more complex calculation
    };
  } catch (error) {
    return {
      workouts_this_week: 0,
      workouts_this_month: 0,
      total_workouts: 0,
      current_streak: 0
    };
  }
}
