const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Add/modify these socket handlers:
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Store user's socket ID when they connect
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  socket.on("send-msg", (data) => {
    console.log("Message received from:", data.from, "to:", data.to);
    const recipientSocket = onlineUsers.get(data.to);

    if (recipientSocket) {
      io.to(recipientSocket).emit("msg-receive", {
        from: data.from,
        msg: data.msg,
        timestamp: new Date(),
      });
      console.log("Message forwarded to:", recipientSocket);
    } else {
      console.log("Recipient not online:", data.to);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});
