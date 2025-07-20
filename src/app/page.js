"use client";

import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketUrl = "http://10.20.51.115:8000";
const socket = io(SocketUrl, {
  closeOnBeforeunload: true,
  autoConnect: false,
});

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState("join");
  const [userCount, setUserCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log(`socket connected using socketID = ${socket.id}`);
    });

    socket.on("update-user-count", (data) => {
      setUserCount(data);
    });

    socket.on("update-data", (data) => {
      setMessages(data);
    });

    // Handle tab close/refresh
    const handleBeforeUnload = (e) => {
      socket.emit("leave-room");
      socket.disconnect();
    };

    const handleUnload = () => {
      socket.disconnect();
    };

    // Handle browser back/forward buttons
    const handlePopState = (e) => {
      socket.emit("leave-room");
      socket.disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("popstate", handlePopState);

      socket.off("connect");
      socket.off("update-user-count");
      socket.off("update-data");

      socket.emit("leave");
      socket.disconnect();
    };
  }, []);

  const joinRoom = () => {
    socket.emit("join-room", { name: username });

    if (username.trim()) {
      setCurrentScreen("chat");
      const message = {
        id: Math.random().toString(36).substr(2, 9),
        user: "System",
        text: `${username} joined the room`,
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit("send-message", message);
    }
  };

  const leaveRoom = () => {
    socket.emit("leave");
    setCurrentScreen("join");
    setUserCount(0);
    setMessages([]);
    setNewMessage("");
    setUsername("");
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Math.random().toString(36).substr(2, 9),
        user: username,
        text: newMessage,
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit("send-message", message);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {currentScreen === "join" ? (
        <JoinScreen
          username={username}
          setUsername={setUsername}
          onJoinRoom={joinRoom}
        />
      ) : (
        <ChatScreen
          userCount={userCount}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendMessage}
          onLeaveRoom={leaveRoom}
          onKeyPress={handleKeyPress}
          currentUser={username}
        />
      )}
    </div>
  );
}

// Join Room Screen Component
const JoinScreen = ({ username, setUsername, onJoinRoom }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Chat Room
          </h1>
          <p className="text-gray-300">Enter your username to get started</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-400"
            onKeyPress={(e) => e.key === "Enter" && onJoinRoom()}
          />

          <button
            onClick={onJoinRoom}
            disabled={!username.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat Room Screen Component
const ChatScreen = ({
  userCount,
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  onLeaveRoom,
  onKeyPress,
  currentUser,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-sm border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Chat Room</h2>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-900 text-green-300 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Online: {userCount}</span>
            </div>

            <button
              onClick={onLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.user === currentUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.user === currentUser
                  ? "bg-blue-600 text-white"
                  : message.user === "System"
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-800 text-gray-200 shadow-sm border border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium ${
                    message.user === currentUser
                      ? "text-blue-200"
                      : "text-gray-400"
                  }`}
                >
                  {message.user}
                </span>
                &nbsp;
                <span
                  className={`text-xs ${
                    message.user === currentUser
                      ? "text-blue-200"
                      : "text-gray-500"
                  }`}
                >
                  {message.timestamp}
                </span>
              </div>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={onKeyPress}
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-400"
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
