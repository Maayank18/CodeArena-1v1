import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getStoredAuthToken, resolveBackendOrigin } from '../api.js';
import { useAuthSession } from './AuthSessionContext.jsx';

const ROUTE_ACTIVITY_MAP = {
  '/dashboard': 'IDLE_LOBBY',
  '/history': 'IDLE_LOBBY',
  '/leaderboard': 'IDLE_LOBBY',
  '/resources': 'IDLE_LOBBY',
  '/pricing': 'IDLE_LOBBY',
  '/visualizer': 'ALGO_VISUALIZER',
  '/campaign': 'CAMPAIGN_MAP',
  '/admin': 'ADMIN_PANEL',
};

const resolveActivity = (pathname) => {
  if (ROUTE_ACTIVITY_MAP[pathname]) {
    return ROUTE_ACTIVITY_MAP[pathname];
  }

  if (pathname.startsWith('/editor/')) return 'IN_MATCH';
  if (pathname.startsWith('/campaign/')) return 'CAMPAIGN_MAP';

  return 'IDLE_LOBBY';
};

const AppSocketContext = createContext({
  connected: false,
  socket: null,
  stats: { live: 0, total: 0 },
  liveUsers: [],
  joinAdminRoom: () => {},
  leaveAdminRoom: () => {},
});

export const AppSocketProvider = ({ children }) => {
  const location = useLocation();
  const { user } = useAuthSession();
  const socketRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const joinedAdminRoomRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ live: 0, total: 0 });
  const [liveUsers, setLiveUsers] = useState([]);

  const disconnectSocket = useCallback(() => {
    if (activityTimeoutRef.current) {
      window.clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnected(false);
    setLiveUsers([]);
  }, []);

  useEffect(() => {
    const token = getStoredAuthToken();
    const username = typeof user?.username === 'string' ? user.username.trim() : '';

    if (!token || !username) {
      disconnectSocket();
      return undefined;
    }

    const socketUrl = resolveBackendOrigin();
    const socket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 5000,
      auth: { token },
    });

    socketRef.current = socket;

    const emitPresence = () => {
      socket.emit('user_connected', {
        userId: user?._id || user?.id || null,
        username: user?.username || '',
        avatar: user?.avatar || '',
        customization: user?.customization || {},
        activity: resolveActivity(location.pathname),
      });

      if (joinedAdminRoomRef.current) {
        socket.emit('join_admin_room');
      }
    };

    socket.on('connect', () => {
      setConnected(true);
      emitPresence();
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('site_stats', (nextStats) => {
      if (!nextStats) return;

      setStats((prev) => ({
        live: typeof nextStats.live === 'number' ? nextStats.live : prev.live,
        total: typeof nextStats.total === 'number' ? nextStats.total : prev.total,
      }));
    });

    socket.on('live_users_update', (payload) => {
      if (Array.isArray(payload)) {
        setLiveUsers(payload);
      }
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket, location.pathname, user?._id, user?.avatar, user?.customization, user?.id, user?.username]);

  useEffect(() => {
    if (!socketRef.current?.connected) {
      return undefined;
    }

    if (activityTimeoutRef.current) {
      window.clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit('update_activity', {
        activity: resolveActivity(location.pathname),
      });
    }, 250);

    return () => {
      if (activityTimeoutRef.current) {
        window.clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }
    };
  }, [location.pathname]);

  const joinAdminRoom = useCallback(() => {
    joinedAdminRoomRef.current = true;
    socketRef.current?.emit('join_admin_room');
  }, []);

  const leaveAdminRoom = useCallback(() => {
    joinedAdminRoomRef.current = false;
    socketRef.current?.emit('leave_admin_room');
  }, []);

  const value = useMemo(() => ({
    connected,
    socket: socketRef.current,
    stats,
    liveUsers,
    joinAdminRoom,
    leaveAdminRoom,
  }), [connected, joinAdminRoom, leaveAdminRoom, liveUsers, stats]);

  return (
    <AppSocketContext.Provider value={value}>
      {children}
    </AppSocketContext.Provider>
  );
};

export const useAppSocket = () => useContext(AppSocketContext);
