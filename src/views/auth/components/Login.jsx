import { useState } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Form, FormGroup, Input, Label, Spinner } from "reactstrap";
import { LogIn } from "react-feather";
import { toast } from "react-toastify";
import { useLogin } from "../Mutations";

function Login({ onAuthenticated, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [login, { loading, error }] = useLogin();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const result = await login({
        variables: {
          email,
          password,
        },
      });

      const authPayload = result.data?.login;

      if (!authPayload?.token) {
        return;
      }

      localStorage.setItem(
        "rag_auth_token",
        authPayload.token,
      );

      localStorage.setItem(
        "rag_auth_user",
        JSON.stringify(authPayload.user),
      );

      onAuthenticated(authPayload.user);
    } catch (err) {
      console.error("Login failed:", err);
      toast.error(err.message || "Login failed.");
    }
  };

  return (
    <Card className="hosteller-auth__card">
      <CardHeader className="hosteller-auth__header">
        <div className="hosteller-auth__brand">
          <span className="hosteller-auth__brand-icon">AI</span>
          <span className="hosteller-auth__brand-name">Login</span>
        </div>
      </CardHeader>

      <CardBody className="hosteller-auth__body">
        <Form className="hosteller-auth__form" onSubmit={handleSubmit}>
          <FormGroup className="hosteller-auth__field">
            <Label className="hosteller-auth__label">Email</Label>
            <Input className="hosteller-auth__input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </FormGroup>

          <FormGroup className="hosteller-auth__field">
            <Label className="hosteller-auth__label">Password</Label>
            <Input className="hosteller-auth__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </FormGroup>

          {error && (
            <Alert color="danger" className="hosteller-auth__error">
              {error.message || "Login failed."}
            </Alert>
          )}

          <Button className="hosteller-auth__submit" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : <LogIn size={16} aria-hidden="true" />}
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Form>

        <div className="hosteller-auth__switch">
          <Button
            type="button"
            className="hosteller-auth__switch-button"
            onClick={onSignup}
          >
            Don't have an account? Sign up
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default Login;