import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

export const CREATE_CHAT_SESSION = gql`
  mutation CreateChatSession($hostelId: ID) {
    createChatSession(hostelId: $hostelId) {
      id
      sessionId
      title
      messages {
        id
        role
        content
      }
    }
  }
`;

export const CHAT = gql`
  mutation Chat($sessionId: ID, $message: String) {
    chat(sessionId: $sessionId, message: $message) {
      sessionId
      title
      messages {
        id
        role
        content
      }
    }
  }
`;

export const useCreateChatSession = () => {
  const [createChatSession, { loading, error, data }] = useMutation(
    CREATE_CHAT_SESSION,
    {
      errorPolicy: "all",
      onError: (err) => {
        console.error("Error creating chat session:", err);
      },
    },
  );

  return [createChatSession, { loading, error, data }];
};

export const useChat = () => {
  const [chat, { loading, error, data }] = useMutation(CHAT, {
    errorPolicy: "all",
    onError: (err) => {
      console.error("Error sending chat message:", err);
    },
  });

  return [chat, { loading, error, data }];
};

export const DELETE_CHAT_SESSION = gql`
  mutation DeleteChatSession($sessionId: ID!) {
    deleteChatSession(sessionId: $sessionId)
  }
`;

export const useDeleteChatSession = () => {
  const [deleteChatSession, { loading, error, data }] =
    useMutation(DELETE_CHAT_SESSION, {
      errorPolicy: "all",
      onError: (err) => {
        console.error("Error deleting chat session:", err);
      },
    });

  return [deleteChatSession, { loading, error, data }];
};