import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

export const GET_ALL_CHAT_SESSIONS = gql`
  query GetAllChatSessions {
    getAllChatSessions {
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

export const GET_CHAT_SESSION_BY_SESSION_ID = gql`
  query GetChatSessionBySessionId($sessionId: ID) {
    getChatSessionBySessionId(sessionId: $sessionId) {
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

export const useGetAllChatSessions = () => {
  const [fetchSessions, { loading, error, data }] = useLazyQuery(
    GET_ALL_CHAT_SESSIONS,
    {
      fetchPolicy: "network-only",
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    },
  );

  return {
    fetchSessions,
    loading,
    error,
    sessions: data?.getAllChatSessions || [],
  };
};

export const useGetChatSessionBySessionId = () => {
  const [fetchSession, { loading, error, data }] = useLazyQuery(
    GET_CHAT_SESSION_BY_SESSION_ID,
    {
      fetchPolicy: "network-only",
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    },
  );

  return {
    fetchSession,
    loading,
    error,
    session: data?.getChatSessionBySessionId || null,
  };
};