import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import ChatBotWidget from "./views/operationsChatbot";
import AuthView from "./views/auth";
import OpsChatHistory from "./views/opsChatHistory";
// import { useSkin } from "@hooks/useSkin";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("rag_auth_token")),
  );

  const [showAuth, setShowAuth] = useState(() => !isAuthenticated);

  const handleRequestLogin = () => {
    setShowAuth(true);
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  if (showAuth && !isAuthenticated) {
    return (
      <>
        <AuthView onAuthenticated={handleAuthenticated} />
        <ToastContainer position="top-right" autoClose={3500} />
      </>
    );
  }

  return (
    <div className="ops-app-shell">
      <header className="ops-app-nav">
        <span className="ops-app-nav__brand">Operations</span>
        <nav aria-label="Main navigation">
          <NavLink to="/ops-chat-history">Chat history</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Navigate replace to="/ops-chat-history" />} />
        <Route path="/ops-chat-history" element={<OpsChatHistory />} />
        <Route path="*" element={<Navigate replace to="/ops-chat-history" />} />
      </Routes>
      <ChatBotWidget
        isAuthenticated={isAuthenticated}
        onRequestLogin={handleRequestLogin}
      />
      <ToastContainer position="top-right" autoClose={3500} />
    </div>
  );
}

export default App;