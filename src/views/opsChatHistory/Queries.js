import { gql } from "@apollo/client";
import { useLazyQuery, useQuery } from "@apollo/client/react";

const CHAT_SESSION_FIELDS = gql`
	fragment ChatSessionFields on ChatSession {
		id
		sessionId
		hostelId
		title
		messages {
			id
			role
			content
		}
	}
`;

export const GET_ALL_CHAT_SESSIONS = gql`
	${CHAT_SESSION_FIELDS}
	query GetAllChatSessions {
		getAllChatSessions {
			...ChatSessionFields
		}
	}
`;

export const GET_ALL_HOSTELS = gql`
	query GetAllHostels {
		getAllHostels {
			id
			name
			location
		}
	}
`;

export const GET_ALL_DOCUMENTS = gql`
	query GetAllDocuments {
		getAllDocuments {
			id
			name
			mimeType
			size
			createdAt
			updatedAt
			parentCount
		}
	}
`;

export const GET_CHAT_SESSIONS_BY_DATE_RANGE = gql`
	${CHAT_SESSION_FIELDS}
	query GetChatSessionsByDateRange($startDate: String!, $endDate: String!) {
		getChatSessionsByDateRange(startDate: $startDate, endDate: $endDate) {
			...ChatSessionFields
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

export const useGetAllHostels = () => {
	const { loading, error, data } = useQuery(GET_ALL_HOSTELS, {
		fetchPolicy: "network-only",
		errorPolicy: "all",
	});

	return {
		loading,
		error,
		hostels: data?.getAllHostels || [],
	};
};

export const useGetAllDocuments = () => {
	const { loading, error, data, refetch } = useQuery(GET_ALL_DOCUMENTS, {
		fetchPolicy: "network-only",
		errorPolicy: "all",
	});

	return {
		loading,
		error,
		documents: data?.getAllDocuments || [],
		refetch,
	};
};

export const useGetChatSessionsByDateRange = () => {
	const [fetchSessions, { loading, error, data }] = useLazyQuery(
		GET_CHAT_SESSIONS_BY_DATE_RANGE,
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
		sessions: data?.getChatSessionsByDateRange || [],
	};
};
