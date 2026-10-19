import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        department
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        name
        email
        department
      }
    }
  }
`;

export const useLogin = () => {
  const [login, { loading, error, data }] = useMutation(LOGIN, {
    errorPolicy: "all",
    onError: (err) => {
      console.error("Login error:", err);
    },
  });

  return [login, { loading, error, data }];
};

export const useRegister = () => {
  const [register, { loading, error, data }] = useMutation(
    REGISTER,
    {
      errorPolicy: "all",
      onError: (err) => {
        console.error("Registration error:", err);
      },
    },
  );

  return [register, { loading, error, data }];
};