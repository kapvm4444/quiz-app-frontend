class SocketService {
  constructor() {
    this.io = null;
    this.chatData = [
      {
        id: "Server_id_1234",
        text: "Hello Fellas",
        user: "Server",
        timeStamp: new Date(),
      },
    ];
    this.currentActiveUsers = [];
  }

  initializeServer(server) {
    this.io = require("socket.io")(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false,
      },
    });
    this.setupHandlers();
  }

  setupHandlers() {
    this.io.on("connect", (socket) => {
      console.log(`connected User = ${socket.id}`);

      //=> Join Room
      socket.on("join-room", (data) => {
        this.currentActiveUsers.push({
          socketId: socket.id,
          user: data.name,
        });
        socket.join("chat-room");
        this.io
          .to("chat-room")
          .emit("update-user-count", this.currentActiveUsers.length);
        this.io.to("chat-room").emit("update-data", this.chatData);
      });

      //=> Send Message
      socket.on("send-message", (data) => {
        this.chatData = [...this.chatData, data];
        this.io.to("chat-room").emit("update-data", this.chatData);
      });

      //=> Leave
      socket.on("leave", () => {
        this.io.to("chat-room").emit("update-data", this.chatData);

        const index = this.currentActiveUsers.findIndex(
          (user) => user.socketId === socket.id,
        );

        if (index !== -1) {
          this.currentActiveUsers.splice(index, 1);
          socket.leave("chat-room");
          this.io
            .to("chat-room")
            .emit("update-user-count", this.currentActiveUsers.length);
        }
      });

      //=> disconnect
      socket.on("disconnect", () => {
        this.io.to("chat-room").emit("update-data", this.chatData);

        const index = this.currentActiveUsers.findIndex(
          (user) => user.socketId === socket.id,
        );

        if (index !== -1) {
          this.currentActiveUsers.splice(index, 1);
          socket.leave("chat-room");
          this.io
            .to("chat-room")
            .emit("update-user-count", this.currentActiveUsers.length);
        }
      });
    });
  }
}

module.exports = new SocketService();
