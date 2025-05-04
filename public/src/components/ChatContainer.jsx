import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();

  // Load messages when currentChat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;

      try {
        const userData = JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        );

        const response = await axios.post(recieveMessageRoute, {
          from: userData._id,
          to: currentChat._id,
        });

        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentChat]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket.current) return;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, { fromSelf: false, message: msg }]);
    };

    socket.current.on("msg-receive", handleReceiveMessage);

    return () => {
      socket.current.off("msg-receive", handleReceiveMessage);
    };
  }, [socket]);

  const handleSendMsg = async (msg) => {
    if (!msg.trim() || !currentChat) return;

    let newMessage = { fromSelf: true, message: msg };
    try {
      const userData = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );

      // Optimistic UI update
      setMessages((prev) => [...prev, newMessage]);

      // Emit socket message
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: userData._id,
        msg,
      });

      // Save to database
      await axios.post(sendMessageRoute, {
        from: userData._id,
        to: currentChat._id,
        message: msg,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m !== newMessage));
    }
  };

  // Auto-scroll to newest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`../assets/user-svgrepo-com.svg `}
              alt={currentChat.username}
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message) => (
          <div ref={scrollRef} key={uuidv4()}>
            <div
              className={`message ${message.fromSelf ? "sended" : "received"}`}
            >
              <div className="content">
                <p>{message.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;

  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    background-color: #080420;

    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;

      .avatar img {
        height: 3rem;
        border-radius: 50%;
      }

      .username h3 {
        color: white;
        margin: 0;
      }
    }
  }

  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;

    &::-webkit-scrollbar {
      width: 0.2rem;

      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }

    .message {
      display: flex;
      align-items: center;

      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;

        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }

      &.sended {
        justify-content: flex-end;

        .content {
          background-color: #4f04ff21;
        }
      }

      &.received {
        justify-content: flex-start;

        .content {
          background-color: #9900ff20;
        }
      }
    }
  }
`;
