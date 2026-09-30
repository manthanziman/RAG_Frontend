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
