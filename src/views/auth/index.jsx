import { useState } from "react";
import { Col, Container, Row } from "reactstrap";

import Login from "./components/Login";
import Signup from "./components/Signup";

import "./style.css";

function AuthView({ onAuthenticated }) {
  const [isSignup, setIsSignup] = useState(false);

  if (isSignup) {
    return (
      <Container fluid className="hosteller-auth">
        <Row className="w-100 justify-content-center">
          <Col xs="12" sm="10" md="7" lg="5" xl="4">
            <Signup
              onAuthenticated={onAuthenticated}
              onLogin={() => setIsSignup(false)}
            />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="hosteller-auth">
      <Row className="w-100 justify-content-center">
        <Col xs="12" sm="10" md="7" lg="5" xl="4">
          <Login
            onAuthenticated={onAuthenticated}
            onSignup={() => setIsSignup(true)}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default AuthView;