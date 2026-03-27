import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { getFriends, getPendingRequests, acceptFriendRequest, removeRequest } from "@features/friends/api/friends";
import { apiFetch } from "@shared/api/apiClient";
import { useAuth } from "@shared/auth/useAuth";
import { PageShell } from "@shared/components/PageShell";
import { Button } from "@shared/components/Button";
import { InfoChip } from "@shared/components/InfoChip";
import { PageHeader } from "@shared/components/PageHeader";
import { SortingChipBar } from "@shared/components/SortingChipBar";
import { UserAvatar } from "@shared/components/UserAvatar";
import { toProfileUrl } from "@shared/utils/usernameValidation";

export default function FriendsPage() {
  const user = useAuth();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [friendsSort, setFriendsSort] = useState("newest");
  const [pendingSort, setPendingSort] = useState("newest");

  const loadData = useCallback(async () => {
    try {
      const profileRes = await apiFetch("/users/me");
      const profileBody = await profileRes.json();
      setProfile(profileBody.user)
      const friendsData = await getFriends();
      setFriends(friendsData.friends || []);
      const pendingData = await getPendingRequests()
      setPending(pendingData.requests || [])
    } catch (err) {
      console.error("Failed to load friend data", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const getOtherUser = (friendDoc) => {
    return friendDoc.user1._id.toString() === profile._id.toString()
      ? friendDoc.user2 : friendDoc.user1;
  }
  const getRequestTime = useCallback(
    (friendDoc) => new Date(friendDoc.createdAt || friendDoc.created_at || friendDoc.updatedAt || friendDoc.updated_at || 0).getTime(),
    []
  );
  const getFriendshipTime = useCallback(
    (friendDoc) => new Date(friendDoc.updatedAt || friendDoc.updated_at || friendDoc.createdAt || friendDoc.created_at || 0).getTime(),
    []
  );
  const isIncoming = useCallback((request) => profile && request.user2?._id === profile._id, [profile]);
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [loadData, user]);

  const handleAccept = async (friendId) => {
    await acceptFriendRequest(friendId)
    await loadData();
  }
  const handleRemove = async (otherId) => {
    await removeRequest(otherId);
    await loadData();
  }

  const opalBackdropStyle = {
    backgroundColor: "var(--opal-bg-color)",
    backgroundImage: "var(--opal-backdrop-image)"
  };

  const dateSortChip = [{ value: "date", label: "Newest", reverseLabel: "Oldest" }];
  const sortedFriends = useMemo(() => {
    const items = [...friends];
    items.sort((a, b) => {
      const aTime = getFriendshipTime(a);
      const bTime = getFriendshipTime(b);
      return friendsSort === "newest" ? bTime - aTime : aTime - bTime;
    });
    return items;
  }, [friends, friendsSort, getFriendshipTime]);
  const sortedPending = useMemo(() => {
    const items = [...pending];
    items.sort((a, b) => {
      const aTime = getRequestTime(a);
      const bTime = getRequestTime(b);
      return pendingSort === "newest" ? bTime - aTime : aTime - bTime;
    });
    return items;
  }, [pending, pendingSort, getRequestTime]);
  const incomingPending = useMemo(
    () => sortedPending.filter((request) => isIncoming(request)),
    [sortedPending, isIncoming]
  );
  const outgoingPending = useMemo(
    () => sortedPending.filter((request) => !isIncoming(request)),
    [sortedPending, isIncoming]
  );

  if (loading) {
    return (
      <div
        className="fixed inset-0 -top-20 flex items-center justify-center"
        style={opalBackdropStyle}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader title="Friends" subtitle="Connect and compete with your friends" />

      <div className="space-y-6 sm:space-y-8">
            <section className="bg-white/70 backdrop-blur-lg rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Pending Requests</h2>
                <SortingChipBar
                  chips={dateSortChip}
                  activeValue="date"
                  direction={pendingSort === "oldest" ? "asc" : "desc"}
                  ariaLabel="Sort pending requests"
                  className="shrink-0"
                  onChipClick={() => {
                    setPendingSort((prev) => prev === "newest" ? "oldest" : "newest");
                  }}
                />
              </div>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800/90 sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-2">
                <div className="pb-5 sm:pb-0 sm:pr-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">
                      {incomingPending.length > 0 ? `${incomingPending.length} received` : "received"}
                    </h3>
                  </div>
                  {incomingPending.length === 0 ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No received requests</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {incomingPending.map((r) => {
                        const other = getOtherUser(r);
                        return (
                          <Link
                            key={r._id}
                            to={toProfileUrl(other.user_data?.username)}
                            className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:scale-[1.01] hover:shadow-[0_0_16px_-6px_rgba(148,163,184,0.4)] hover:border-slate-300/80 dark:hover:border-slate-700 block"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 text-left">
                                <UserAvatar
                                  userId={other?._id || other?.id || other?.user_id}
                                  name={other.user_data?.username}
                                  src={other.user_data?.profile_pic}
                                  shape="rounded"
                                  className="w-11 h-11 shrink-0 text-lg sm:w-12 sm:h-12"
                                  textClassName="text-lg"
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-base sm:text-lg truncate">{other.user_data?.username}</p>
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Sent you a request</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAccept(r._id);
                                  }}
                                  variant="primary"
                                  color="green"
                                  className="px-3 sm:px-4 text-xs sm:text-sm"
                                >
                                  Accept
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemove(other._id);
                                  }}
                                  variant="primary"
                                  color="red"
                                  className="px-3 sm:px-4 text-xs sm:text-sm"
                                >
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-5 sm:pt-0 sm:pl-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">
                      {outgoingPending.length > 0 ? `${outgoingPending.length} sent` : "sent"}
                    </h3>
                  </div>
                  {outgoingPending.length === 0 ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No sent requests</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {outgoingPending.map((r) => {
                        const other = getOtherUser(r);
                        return (
                          <Link
                            key={r._id}
                            to={toProfileUrl(other.user_data?.username)}
                            className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:scale-[1.01] hover:shadow-[0_0_16px_-6px_rgba(148,163,184,0.4)] hover:border-slate-300/80 dark:hover:border-slate-700 block"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 text-left">
                                <UserAvatar
                                  userId={other?._id || other?.id || other?.user_id}
                                  name={other.user_data?.username}
                                  src={other.user_data?.profile_pic}
                                  shape="rounded"
                                  className="w-11 h-11 shrink-0 text-lg sm:w-12 sm:h-12"
                                  textClassName="text-lg"
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-base sm:text-lg truncate">{other.user_data?.username}</p>
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Request sent</p>
                                </div>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemove(other._id);
                                }}
                                variant="primary"
                                color="amber"
                                className="px-3 sm:px-4 text-xs sm:text-sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white/70 backdrop-blur-lg rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Your Friends</h2>
                <div className="flex items-center gap-2">
                  <InfoChip
                    variant="subtle"
                    size="md"
                    color="slate"
                    className="shrink-0"
                  >
                    {friends.length} total
                  </InfoChip>
                  <SortingChipBar
                    chips={dateSortChip}
                    activeValue="date"
                    direction={friendsSort === "oldest" ? "asc" : "desc"}
                    ariaLabel="Sort friends"
                    className="shrink-0"
                    onChipClick={() => {
                      setFriendsSort((prev) => prev === "newest" ? "oldest" : "newest");
                    }}
                  />
                </div>
              </div>
              {friends.length === 0 ? (
                <div className="text-center py-8 sm:py-10 max-w-md mx-auto">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 to-rose-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">No friends yet</h3>
                  <p className="text-slate-600 text-sm sm:text-base">
                    Start connecting with others to build your network
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {sortedFriends.map((f) => {
                    const other = getOtherUser(f);
                    const friendshipTime = getFriendshipTime(f);
                    return (
                      <Link
                        key={f._id}
                        to={toProfileUrl(other.user_data?.username)}
                        className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:scale-[1.01] hover:shadow-[0_0_16px_-6px_rgba(148,163,184,0.4)] hover:border-slate-300/80 dark:hover:border-slate-700 block"
                      >
                        {confirmRemoveId === f._id ? (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                            <div className="min-w-0 text-left">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 text-base sm:text-lg">
                                Remove {other.user_data?.username}?
                              </p>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                This will remove them from your friends list.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    await handleRemove(other._id);
                                  } finally {
                                    setConfirmRemoveId(null);
                                  }
                                }}
                                variant="secondary"
                                color="red"
                                className="px-3 sm:px-4 text-xs sm:text-sm"
                              >
                                Confirm
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConfirmRemoveId(null);
                                }}
                                variant="secondary"
                                color="standard"
                                className="px-3 sm:px-4 text-xs sm:text-sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-3 min-w-0 text-left">
                              <UserAvatar
                                userId={other?._id || other?.id || other?.user_id}
                                name={other.user_data?.username}
                                src={other.user_data?.profile_pic}
                                shape="rounded"
                                className="w-11 h-11 shrink-0 text-lg sm:w-12 sm:h-12"
                                textClassName="text-lg"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-base sm:text-lg truncate">{other.user_data?.username}</p>
                                {friendshipTime > 0 && (
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    Since {new Date(friendshipTime).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric"
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmRemoveId(f._id);
                              }}
                              variant="secondary"
                              color="standard"
                              className="px-3 sm:px-4 text-xs sm:text-sm"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
      </div>
    </PageShell>
  );
}
