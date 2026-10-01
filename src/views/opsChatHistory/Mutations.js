import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

export const UPLOAD_DOCUMENT = gql`
	mutation UploadDocument($file: Upload!) {
		uploadDocument(file: $file) {
			documentId
			parentCount
			childCount
		}
	}
`;

export const useUploadDocument = () => {
	const [uploadDocument, { loading, error, data }] = useMutation(UPLOAD_DOCUMENT, {
		onError: (err) => {
			console.error("Error uploading document:", err);
		},
	});

	return [uploadDocument, { loading, error, data }];
};

export const UPDATE_DOCUMENT = gql`
	mutation UpdateDocument($id: ID!, $file: Upload!) {
		updateDocument(id: $id, file: $file) {
			documentId
			parentsTotal
			parentsUnchanged
			parentsChangedOrAdded
			parentsRemoved
			childrenReembedded
		}
	}
`;

export const useUpdateDocument = () => {
	const [updateDocument, { loading, error, data }] = useMutation(UPDATE_DOCUMENT);
	return [updateDocument, { loading, error, data }];
};

export const DELETE_DOCUMENT = gql`
	mutation DeleteDocument($id: ID!) {
		deleteDocument(id: $id) {
			id
		}
	}
`;

export const useDeleteDocument = () => {
	const [deleteDocument, { loading, error, data }] = useMutation(DELETE_DOCUMENT);
	return [deleteDocument, { loading, error, data }];
};
