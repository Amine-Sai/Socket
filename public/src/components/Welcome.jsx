import React, { useState, useEffect } from "react";
import styled from "styled-components";

export default function Welcome() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const userData = JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        );
        if (userData && userData.username) {
          setUserName(userData.username);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, []);

  return (
    <Container>
      <h1>
        Welcome, <span>{userName}!</span>
      </h1>
      <h3 style={{ paddingLeft: 40 }}>
        Please select a chat to Start messaging.
      </h3>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  flex-direction: column;
  height: 100%;
  width: 100%;
  span {
    color: #4e0eff;
  }
`;