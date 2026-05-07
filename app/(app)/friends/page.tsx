import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getInitials, avatarColor } from '@/lib/utils'
import FriendSearch from '@/components/friends/FriendSearch'
import FriendRequestButtons from '@/components/friends/FriendRequestButtons'
import { Users, UserCheck, Clock } from 'lucide-react'

export default async function FriendsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Accepted friends
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  // Incoming pending requests
  const { data: incoming } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(*)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  // Outgoing pending requests
  const { data: outgoing } = await supabase
    .from('friendships')
    .select('*, addressee:profiles!friendships_addressee_id_fkey(*)')
    .eq('requester_id', user.id)
    .eq('status', 'pending')

  const friends = (friendships ?? []).map(f => {
    const friend = f.requester_id === user.id ? f.addressee : f.requester
    return { ...friend, friendshipId: f.id }
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Friends</h1>
        <p className="text-sm text-gray-500">Add friends to quickly invite them to groups</p>
      </div>

      <FriendSearch currentUserId={user.id} existingFriendIds={friends.map((f: any) => f.id)} />

      {/* Incoming requests */}
      {(incoming ?? []).length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-medium text-gray-900">Friend requests</h2>
            <span className="badge bg-amber-50 text-amber-700">{incoming!.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {incoming!.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${avatarColor(f.requester.id)}`}>
                  {getInitials(f.requester.full_name || f.requester.email)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{f.requester.full_name || f.requester.email}</p>
                  <p className="text-xs text-gray-400">{f.requester.email}</p>
                </div>
                <FriendRequestButtons friendshipId={f.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <UserCheck className="w-4 h-4 text-brand-500" />
          <h2 className="font-medium text-gray-900">My friends</h2>
          <span className="badge bg-brand-50 text-brand-700">{friends.length}</span>
        </div>
        {friends.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            No friends yet — search above to add some!
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {friends.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${avatarColor(f.id)}`}>
                  {getInitials(f.full_name || f.email)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{f.full_name || f.email}</p>
                  <p className="text-xs text-gray-400">{f.email}</p>
                </div>
                <span className="text-xs text-brand-600 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Friends
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing requests */}
      {(outgoing ?? []).length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-medium text-gray-900">Pending sent requests</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {outgoing!.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${avatarColor(f.addressee.id)}`}>
                  {getInitials(f.addressee.full_name || f.addressee.email)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{f.addressee.full_name || f.addressee.email}</p>
                  <p className="text-xs text-gray-400">{f.addressee.email}</p>
                </div>
                <span className="text-xs text-gray-400">Pending…</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}