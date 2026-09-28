import { useState } from "react";
import { ToastContainer } from "react-toastify";
import ChatBotWidget from "./views/operationsChatbot";
import AuthView from "./views/auth";
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
    <div className="min-h-screen">
      <ChatBotWidget
        isAuthenticated={isAuthenticated}
        onRequestLogin={handleRequestLogin}
      />
      <ToastContainer position="top-right" autoClose={3500} />
    </div>
  );
}

export default App;