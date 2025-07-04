import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import Logout from "../components/Logout";
import axios from "axios";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [messages, setMessages] = useState([]); // Added for message state

  useEffect(() => {
    const checkUser = async () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        const userData = await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        );
        setCurrentUser(userData);

        if (userData) {
          const { data } = await axios.get(`${allUsersRoute}/${userData._id}`);
          setContacts(data);
        }
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);

      // Set up message listener
      socket.current.on("msg-receive", (msg) => {
        setMessages((prev) => [...prev, { fromSelf: false, message: msg }]);
      });

      // Cleanup function
      return () => {
        if (socket.current) {
          socket.current.off("msg-receive");
          socket.current.disconnect();
        }
      };
    }
  }, [currentUser]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    // Load messages when chat changes
    if (chat) {
      loadMessages(chat);
    }
  };

  const loadMessages = async (chat) => {
    if (currentUser) {
      const userData = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );
      setCurrentUser(userData);
      const { data } = await axios.post(`${allUsersRoute}/${userData._id}`, {
        from: currentUser._id,
        to: chat._id,
      });
      setMessages(data);
    }
  };

  const handleSendMsg = async (msg) => {
    if (currentChat && currentUser) {
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: currentUser._id,
        msg,
      });
      setMessages((prev) => [...prev, { fromSelf: true, message: msg }]);
    }
  };

  return (
    <Container>
      <div className="logout-container">
        <Logout />
      </div>
      <div className="container">
        <Contacts contacts={contacts} changeChat={handleChatChange} />
        {currentChat === undefined ? (
          <Welcome />
        ) : (
          <ChatContainer
            currentChat={currentChat}
            socket={socket}
            messages={messages}
            handleSendMsg={handleSendMsg}
          />
        )}
      </div>
    </Container>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
  .logout-container {
    position: absolute;
    top: 2rem;
    right: 2rem;
  }
`;
