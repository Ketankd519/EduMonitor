import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const token = auth?.token || localStorage.getItem('token');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) {
      const serverHost = window.location.hostname || 'localhost';
      const socketUrl = `http://${serverHost}:5000`;

      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        auth: { token }
      });

      const registerUser = () => {
        if (auth?.user?._id) {
          newSocket.emit('register-user', { userId: auth.user._id, token });
        }
      };

      newSocket.on('connect', registerUser);
      newSocket.on('reconnect', registerUser);

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) socket.close();
      setSocket(null);
    }
  }, [token]);

  useEffect(() => {
    if (socket && auth?.user?._id && token) {
      socket.emit('register-user', { userId: auth.user._id, token });
    }
  }, [socket, auth?.user?._id, token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};