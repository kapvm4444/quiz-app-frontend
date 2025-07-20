// src/app/socket/page.js

"use client";

import { useState, useEffect } from "react";
import io from "socket.io-client";

// IMPORTANT: Replace with the actual URL of your Socket.IO server
const SOCKET_URL = "http://192.168.104.75:8000";

const SocketTesterPage = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState([]);

  // State for emitting events
  const [emitEventName, setEmitEventName] = useState("");
  const [emitEventBody, setEmitEventBody] = useState("{}");

  // State for listening to events
  const [listenEventName, setListenEventName] = useState("");
  const [activeListeners, setActiveListeners] = useState(new Set());

  useEffect(() => {
    // Disconnect the socket when the component unmounts
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [
      `[${timestamp}] [${type.toUpperCase()}] ${message}`,
      ...prevLogs,
    ]);
  };

  const handleConnect = () => {
    if (socket?.connected) return;

    const newSocket = io(SOCKET_URL);

    newSocket.on("connect", () => {
      setIsConnected(true);
      setSocket(newSocket);
      addLog(`Connected to server! ID: ${newSocket.id}`, "success");
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      setSocket(null);
      addLog(`Disconnected from server: ${reason}`, "error");
      setActiveListeners(new Set());
    });

    newSocket.on("connect_error", (err) => {
      addLog(`Connection Error: ${err.message}`, "error");
    });
  };

  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  const handleEmitEvent = (e) => {
    e.preventDefault();
    if (!socket || !emitEventName) {
      addLog("Error: Not connected or no event name provided.", "error");
      return;
    }

    try {
      const body = JSON.parse(emitEventBody);
      socket.emit(emitEventName, body);
      addLog(
        `Sent Event '${emitEventName}' with body: ${emitEventBody}`,
        "sent",
      );
    } catch (error) {
      addLog(`Error: Invalid JSON in event body. ${error.message}`, "error");
    }
  };

  const handleAddListener = () => {
    if (!socket || !listenEventName || activeListeners.has(listenEventName)) {
      addLog(
        `Listener for '${listenEventName}' already active or input is empty.`,
        "warning",
      );
      return;
    }

    socket.on(listenEventName, (data) => {
      const message =
        typeof data === "object" ? JSON.stringify(data, null, 2) : data;
      addLog(`Received Event '${listenEventName}':\n${message}`, "received");
    });

    setActiveListeners((prev) => new Set(prev).add(listenEventName));
    addLog(`Now listening for event: '${listenEventName}'`, "info");
    setListenEventName("");
  };

  // Style definitions for reusability
  const cardClasses =
    "bg-white border border-slate-200 rounded-lg p-6 shadow-sm";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1";
  const inputClasses =
    "block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500";
  const buttonClasses =
    "px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-black">
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">
          Socket.IO Tester
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {/* Connection */}
            <div className={cardClasses}>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Connection
              </h2>
              <p className="mb-4">
                Status:{" "}
                {isConnected ? (
                  <span className="font-bold text-green-600">Connected</span>
                ) : (
                  <span className="font-bold text-red-600">Disconnected</span>
                )}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleConnect}
                  disabled={isConnected}
                  className={buttonClasses}
                >
                  Connect
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={!isConnected}
                  className="px-4 py-2 bg-slate-600 font-semibold rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Event Emitter */}
            <div className={cardClasses}>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Emit Event
              </h2>
              <form onSubmit={handleEmitEvent} className="space-y-4">
                <div>
                  <label htmlFor="emit-event-name" className={labelClasses}>
                    Event Name
                  </label>
                  <input
                    id="emit-event-name"
                    type="text"
                    value={emitEventName}
                    onChange={(e) => setEmitEventName(e.target.value)}
                    placeholder="e.g., 'sendMessage'"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="emit-event-body" className={labelClasses}>
                    Event Body (JSON)
                  </label>
                  <textarea
                    id="emit-event-body"
                    value={emitEventBody}
                    onChange={(e) => setEmitEventBody(e.target.value)}
                    rows="5"
                    placeholder='{ "key": "value" }'
                    className={`${inputClasses} font-mono`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isConnected}
                  className={buttonClasses}
                >
                  Emit Event
                </button>
              </form>
            </div>

            {/* Event Listener */}
            <div className={cardClasses}>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Listen for Event
              </h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={listenEventName}
                  onChange={(e) => setListenEventName(e.target.value)}
                  placeholder="e.g., 'receiveMessage'"
                  className={inputClasses}
                />
                <button
                  onClick={handleAddListener}
                  disabled={!isConnected}
                  className={buttonClasses}
                >
                  Add
                </button>
              </div>
              <p className="text-sm text-slate-600">
                Active Listeners:{" "}
                <span className="font-medium text-slate-800">
                  {Array.from(activeListeners).join(", ") || "None"}
                </span>
              </p>
            </div>
          </div>

          {/* Right Column - Logs */}
          <div className={cardClasses}>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Logs</h2>
            <pre className="h-[600px] bg-slate-100 rounded-md p-4 overflow-y-auto text-xs text-slate-800 whitespace-pre-wrap break-words">
              {logs.length > 0 ? logs.join("\n") : "No messages yet..."}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SocketTesterPage;
