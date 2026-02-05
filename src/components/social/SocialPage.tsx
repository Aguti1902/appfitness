import { useEffect, useState } from 'react';
import { 
  Users, 
  Trophy, 
  UserPlus, 
  TrendingUp,
  Flame,
  Medal,
  Crown,
  X,
  Check,
  UserMinus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore } from '../../stores/socialStore';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
// import type { FriendProfile } from '../../types';

type Tab = 'friends' | 'rankings' | 'compare';
type RankingPeriod = 'week' | 'month' | 'all';

export function SocialPage() {
  const { user } = useAuthStore();
  const { 
    friends, 
    pendingRequests,
    rankings,
    fetchFriends, 
    fetchPendingRequests,
    fetchRankings,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  } = useSocialStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('month');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [compareFriends, setCompareFriends] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchFriends(user.id);
      fetchPendingRequests(user.id);
      fetchRankings(user.id, rankingPeriod);
    }
  }, [user?.id, rankingPeriod]);

  const handleAddFriend = async () => {
    if (!user || !friendEmail) return;
    setAddError('');
    
    const result = await sendFriendRequest(user.id, friendEmail);
    
    if (result.error) {
      setAddError(result.error);
    } else {
      setFriendEmail('');
      setShowAddFriend(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    await acceptFriendRequest(requestId);
    if (user) fetchFriends(user.id);
  };

  const toggleCompare = (friendId: string) => {
    setCompareFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : prev.length < 3 
          ? [...prev, friendId]
          : prev
    );
  };

  const tabs = [
    { id: 'friends', label: 'Amigos', icon: Users },
    { id: 'rankings', label: 'Rankings', icon: Trophy },
    { id: 'compare', label: 'Comparar', icon: TrendingUp },
  ] as const;

  // Mock comparison data
  const comparisonData = [
    { week: 'Sem 1', yo: 4, ...friends.slice(0, 2).reduce((a, _f, i) => ({ ...a, [`amigo${i+1}`]: 3 + i }), {}) },
    { week: 'Sem 2', yo: 5, ...friends.slice(0, 2).reduce((a, _f, i) => ({ ...a, [`amigo${i+1}`]: 4 + i }), {}) },
    { week: 'Sem 3', yo: 3, ...friends.slice(0, 2).reduce((a, _f, i) => ({ ...a, [`amigo${i+1}`]: 5 - i }), {}) },
    { week: 'Sem 4', yo: 6, ...friends.slice(0, 2).reduce((a, _f, i) => ({ ...a, [`amigo${i+1}`]: 4 + i }), {}) },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social</h1>
          <p className="text-gray-500">Compite con tus amigos y motívate</p>
        </div>
        <button
          onClick={() => setShowAddFriend(true)}
          className="btn btn-primary"
        >
          <UserPlus className="w-5 h-5" />
          Añadir amigo
        </button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="card mb-6 border-2 border-primary-200 bg-primary-50">
          <h3 className="font-semibold text-gray-900 mb-3">
            Solicitudes pendientes ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-900">Nueva solicitud de amistad</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div>
          {friends.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div key={friend.id} className="card">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{friend.name}</h4>
                      <p className="text-sm text-gray-500">
                        {friend.stats.current_streak > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            {friend.stats.current_streak} días de racha
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{friend.stats.workouts_this_week}</p>
                      <p className="text-xs text-gray-500">Esta semana</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{friend.stats.workouts_this_month}</p>
                      <p className="text-xs text-gray-500">Este mes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{friend.stats.total_workouts}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>

                  {friend.stats.weight_change !== undefined && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className={`text-sm font-medium ${
                        friend.stats.weight_change > 0 ? 'text-green-600' : 
                        friend.stats.weight_change < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {friend.stats.weight_change > 0 ? '+' : ''}{friend.stats.weight_change} kg este mes
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Sin amigos aún"
              description="Añade amigos para competir y motivarte mutuamente"
              action={{
                label: "Añadir amigo",
                onClick: () => setShowAddFriend(true)
              }}
            />
          )}
        </div>
      )}

      {/* Rankings Tab */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setRankingPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  rankingPeriod === period
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period === 'week' && 'Semana'}
                {period === 'month' && 'Mes'}
                {period === 'all' && 'Todo'}
              </button>
            ))}
          </div>

          {/* Podium */}
          {rankings.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-6">
              {/* 2nd place */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {rankings[1]?.user_name?.charAt(0) || '2'}
                </div>
                <div className="bg-gray-200 rounded-t-lg pt-4 pb-2 px-4">
                  <Medal className="w-6 h-6 mx-auto text-gray-500 mb-1" />
                  <p className="font-medium text-gray-900 text-sm truncate max-w-[80px]">
                    {rankings[1]?.user_name || '-'}
                  </p>
                  <p className="text-sm text-gray-500">{rankings[1]?.score || 0}</p>
                </div>
              </div>

              {/* 1st place */}
              <div className="text-center -mb-4">
                <div className="w-20 h-20 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {rankings[0]?.user_name?.charAt(0) || '1'}
                </div>
                <div className="bg-yellow-100 rounded-t-lg pt-6 pb-2 px-6">
                  <Crown className="w-8 h-8 mx-auto text-yellow-500 mb-1" />
                  <p className="font-bold text-gray-900 truncate max-w-[100px]">
                    {rankings[0]?.user_name || '-'}
                  </p>
                  <p className="text-sm text-gray-600">{rankings[0]?.score || 0} entrenos</p>
                </div>
              </div>

              {/* 3rd place */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {rankings[2]?.user_name?.charAt(0) || '3'}
                </div>
                <div className="bg-orange-100 rounded-t-lg pt-4 pb-2 px-4">
                  <Medal className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                  <p className="font-medium text-gray-900 text-sm truncate max-w-[80px]">
                    {rankings[2]?.user_name || '-'}
                  </p>
                  <p className="text-sm text-gray-500">{rankings[2]?.score || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Full ranking list */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Clasificación completa</h3>
            <div className="space-y-2">
              {rankings.map((entry, i) => (
                <div 
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-3 rounded-xl ${
                    entry.user_name === 'Tú' ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-500 text-white' :
                    i === 1 ? 'bg-gray-400 text-white' :
                    i === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {entry.rank}
                  </span>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {entry.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`flex-1 font-medium ${entry.user_name === 'Tú' ? 'text-primary-700' : 'text-gray-900'}`}>
                    {entry.user_name}
                  </span>
                  <span className="font-bold text-gray-900">{entry.score}</span>
                  <span className="text-sm text-gray-500">entrenos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {/* Select friends to compare */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">
              Selecciona amigos para comparar (máx 3)
            </h3>
            <div className="flex flex-wrap gap-2">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => toggleCompare(friend.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    compareFriends.includes(friend.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {friend.name}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Chart */}
          {compareFriends.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Entrenamientos por semana</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="yo" fill="#22c55e" name="Tú" radius={[4, 4, 0, 0]} />
                    {compareFriends.slice(0, 2).map((_, i) => (
                      <Bar 
                        key={i}
                        dataKey={`amigo${i+1}`} 
                        fill={i === 0 ? '#3b82f6' : '#f59e0b'} 
                        name={friends.find(f => f.id === compareFriends[i])?.name || `Amigo ${i+1}`}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Stats comparison */}
          {compareFriends.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card text-center">
                <p className="text-sm text-gray-500 mb-2">Entrenos esta semana</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tú</span>
                    <span className="font-bold text-primary-600">5</span>
                  </div>
                  {compareFriends.map((id) => {
                    const friend = friends.find(f => f.id === id);
                    return friend ? (
                      <div key={id} className="flex items-center justify-between">
                        <span className="font-medium">{friend.name}</span>
                        <span className="font-bold">{friend.stats.workouts_this_week}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="card text-center">
                <p className="text-sm text-gray-500 mb-2">Racha actual</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tú</span>
                    <span className="font-bold text-primary-600">7 días</span>
                  </div>
                  {compareFriends.map((id) => {
                    const friend = friends.find(f => f.id === id);
                    return friend ? (
                      <div key={id} className="flex items-center justify-between">
                        <span className="font-medium">{friend.name}</span>
                        <span className="font-bold">{friend.stats.current_streak} días</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="card text-center">
                <p className="text-sm text-gray-500 mb-2">Total entrenos</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tú</span>
                    <span className="font-bold text-primary-600">156</span>
                  </div>
                  {compareFriends.map((id) => {
                    const friend = friends.find(f => f.id === id);
                    return friend ? (
                      <div key={id} className="flex items-center justify-between">
                        <span className="font-medium">{friend.name}</span>
                        <span className="font-bold">{friend.stats.total_workouts}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}

          {compareFriends.length === 0 && friends.length > 0 && (
            <div className="text-center py-12 text-gray-500">
              Selecciona al menos un amigo para ver la comparativa
            </div>
          )}

          {friends.length === 0 && (
            <EmptyState
              icon={Users}
              title="Sin amigos para comparar"
              description="Añade amigos para ver comparativas de progreso"
              action={{
                label: "Añadir amigo",
                onClick: () => setShowAddFriend(true)
              }}
            />
          )}
        </div>
      )}

      {/* Add Friend Modal */}
      <Modal
        isOpen={showAddFriend}
        onClose={() => {
          setShowAddFriend(false);
          setFriendEmail('');
          setAddError('');
        }}
        title="Añadir amigo"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Introduce el email de tu amigo para enviarle una solicitud de amistad.
          </p>
          
          {addError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
              {addError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email del amigo
            </label>
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              className="input"
              placeholder="amigo@email.com"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAddFriend(false);
                setFriendEmail('');
                setAddError('');
              }}
              className="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddFriend}
              disabled={!friendEmail}
              className="btn btn-primary flex-1"
            >
              Enviar solicitud
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
