import { useState } from "react";
import Select from "react-select";
import { Alert, Button, Card, CardBody, CardHeader, Form, FormGroup, Input, Label, Spinner } from "reactstrap";
import { UserPlus } from "react-feather";
import { toast } from "react-toastify";
import { useRegister } from "../Mutations";

const departmentOptions = [
  { value: "operations", label: "Operations" },
  { value: "front-office", label: "Front office" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "food-and-beverage", label: "Food and beverage" },
];

function Signup({ onAuthenticated, onLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  const [register, { loading, error }] = useRegister();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const result = await register({
        variables: {
          input: {
            name: form.name,
            email: form.email,
            password: form.password,
            department: form.department || null,
          },
        },
      });

      const authPayload = result.data?.register;

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
      console.error("Registration failed:", err);
      toast.error(err.message || "Registration failed.");
    }
  };

  return (
    <Card className="hosteller-auth__card">
      <CardHeader className="hosteller-auth__header">
        <div className="hosteller-auth__brand">
          <span className="hosteller-auth__brand-icon">AI</span>
          <span className="hosteller-auth__brand-name">Create account</span>
        </div>
      </CardHeader>

      <CardBody className="hosteller-auth__body">
        <Form className="hosteller-auth__form" onSubmit={handleSubmit}>
          <FormGroup className="hosteller-auth__field">
            <Label className="hosteller-auth__label">Name</Label>
            <Input className="hosteller-auth__input"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup className="hosteller-auth__field">
            <Label className="hosteller-auth__label">Email</Label>
            <Input className="hosteller-auth__input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup className="hosteller-auth__field">
            <Label className="hosteller-auth__label">Password</Label>
            <Input className="hosteller-auth__input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup className="hosteller-auth__field">
            <Label className="hosteller-auth__label">Department</Label>
            <Select
              inputId="department"
              options={departmentOptions}
              value={departmentOptions.find((option) => option.value === form.department) || null}
              onChange={(option) => setForm((previous) => ({ ...previous, department: option?.value || "" }))}
              placeholder="Select department"
              isClearable
            />
          </FormGroup>

          {error && (
            <Alert color="danger" className="hosteller-auth__error">
              {error.message || "Registration failed."}
            </Alert>
          )}

          <Button className="hosteller-auth__submit" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : <UserPlus size={16} aria-hidden="true" />}
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </Form>

        <div className="hosteller-auth__switch">
          <Button
            type="button"
            className="hosteller-auth__switch-button"
            onClick={onLogin}
          >
            Already have an account? Login
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default Signup;