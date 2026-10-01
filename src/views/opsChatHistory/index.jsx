import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	FileUp,
	FileText,
	LoaderCircle,
	Pencil,
	Search,
	Trash2,
} from "lucide-react";
import { Alert, Button, Input } from "reactstrap";
import { Check, Lock, MessageCircle, RotateCcw } from "react-feather";
import { toast } from "react-toastify";
import ChatMessageBubble from "../operationsChatbot/components/Chatmessagebubble";
import {
	useDeleteDocument,
	useUpdateDocument,
	useUploadDocument,
} from "./Mutations";
import {
	useGetAllDocuments,
	useGetAllChatSessions,
	useGetAllHostels,
	useGetChatSessionsByDateRange,
} from "./Queries";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import "./style.css";
import { useSkin } from "@hooks/useSkin";


const EMPTY_FILTERS = { sessionId: "", hostelId: "", text: "" };

const getSessionCreatedAt = (session) => {
	if (session.createdAt || session.lastMessageAt) {
		const date = new Date(session.lastMessageAt || session.createdAt);
		return Number.isNaN(date.getTime()) ? 0 : date.getTime();
	}

	const objectId = String(session.id || "");
	return /^[a-f\d]{24}$/i.test(objectId)
		? Number.parseInt(objectId.slice(0, 8), 16) * 1000
		: 0;
};

const formatDate = (timestamp) => {
	if (!timestamp) return "Date unavailable";

	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(timestamp));
};

const formatTime = (timestamp) => {
	if (!timestamp) return "";

	return new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(timestamp));
};

const getInitial = (title) => title?.trim()?.charAt(0)?.toUpperCase() || "C";

const formatFileSize = (size) => {
	if (!Number.isFinite(size)) return "Size unavailable";
	if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDocumentDate = (value) => {
	const date = new Date(value);
	if (!value || Number.isNaN(date.getTime())) return "Date unavailable";
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
};

function OpsChatHistory() {
	const {
		fetchSessions: fetchAllSessions,
		loading: allSessionsLoading,
		error: allSessionsError,
		sessions: allSessionsData,
	} = useGetAllChatSessions();
	const { hostels } = useGetAllHostels();
	const dateSessions = useGetChatSessionsByDateRange();
	const {
		documents,
		loading: documentsLoading,
		error: documentsError,
		refetch: refetchDocuments,
	} = useGetAllDocuments();

	// ---------- State ----------
	const [selectedSession, setSelectedSession] = useState(null);
	const [sessionIdInput, setSessionIdInput] = useState("");
	const [hostelIdInput, setHostelIdInput] = useState("");
	const [messageInput, setMessageInput] = useState("");
	const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [activeDateRange, setActiveDateRange] = useState(false);
	const [mutateUploadDocument, { loading: uploading }] = useUploadDocument();
	const [mutateUpdateDocument, { loading: updating }] = useUpdateDocument();
	const [mutateDeleteDocument, { loading: deleting }] = useDeleteDocument();
	const [busyDocumentId, setBusyDocumentId] = useState(null);

	// ---------- Refs ----------
	// Gives us access to the flatpickr instance so Reset can clear it
	const pickerRef = useRef(null);

	// ---------- Initial load ----------
	useEffect(() => {
		fetchAllSessions();
	}, [fetchAllSessions]);

	// ---------- Flatpickr ----------
	// Options must keep a stable identity. A new object on every render makes
	// react-flatpickr re-apply options mid-selection, which closes the popup.
	const pickerOptions = useMemo(
		() => ({
			mode: "range",
			dateFormat: "Y-m-d",
			rangeSeparator: " to ",
			onReady: (_dates, _str, instance) => {
				instance.calendarContainer.classList.add("ops-history-calendar");
			},
		}),
		[],
	);

	const handleDateChange = useCallback((dates, _str, instance) => {
		setStartDate(dates[0] ? instance.formatDate(dates[0], "Y-m-d") : "");
		setEndDate(dates[1] ? instance.formatDate(dates[1], "Y-m-d") : "");
	}, []);

	// ---------- Derived data ----------
	const sessions = activeDateRange ? dateSessions.sessions : allSessionsData;
	const loading = activeDateRange ? dateSessions.loading : allSessionsLoading;
	const error = activeDateRange ? dateSessions.error : allSessionsError;

	const sortedSessions = useMemo(
		() =>
			[...sessions].sort(
				(left, right) => getSessionCreatedAt(right) - getSessionCreatedAt(left),
			),
		[sessions],
	);

	// Scans every message of every session, so it is worth memoizing
	const filteredSessions = useMemo(() => {
		const sessionIdQuery = appliedFilters.sessionId.toLowerCase();
		const textQuery = appliedFilters.text.toLowerCase();

		return sortedSessions.filter((session) => {
			const idMatches = String(session.sessionId || "")
				.toLowerCase()
				.includes(sessionIdQuery);
			const hostelMatches =
				!appliedFilters.hostelId ||
				String(session.hostelId || "") === appliedFilters.hostelId;
			if (!idMatches || !hostelMatches) return false;
			if (!textQuery) return true;

			const searchableText = [
				session.title,
				...(session.messages || []).map((message) => message.content),
			]
				.join(" ")
				.toLowerCase();

			return searchableText.includes(textQuery);
		});
	}, [sortedSessions, appliedFilters]);

	const activeSession = useMemo(
		() =>
			selectedSession
				? sessions.find((session) => session.sessionId === selectedSession.sessionId) ||
					selectedSession
				: null,
		[sessions, selectedSession],
	);
	const messages = activeSession?.messages || [];
	const activeSessionDate = activeSession ? getSessionCreatedAt(activeSession) : 0;

	// ---------- Handlers ----------
	const handleSearch = useCallback(
		async (event) => {
			event.preventDefault();
			setAppliedFilters({
				sessionId: sessionIdInput.trim(),
				hostelId: hostelIdInput,
				text: messageInput.trim(),
			});

			if (startDate || endDate) {
				// "YYYY-MM-DD" strings compare correctly; same-day ranges are allowed
				if (!startDate || !endDate || startDate > endDate) {
					toast.error("Choose a valid start and end date.");
					return;
				}

				try {
					await dateSessions.fetchSessions({
						variables: { startDate, endDate },
					});
					setActiveDateRange(true);
				} catch (fetchError) {
					toast.error(fetchError.message || "Unable to load chats for that range.");
				}
				return;
			}

			setActiveDateRange(false);
			if (!allSessionsData.length) {
				fetchAllSessions();
			}
		},
		[
			sessionIdInput,
			hostelIdInput,
			messageInput,
			startDate,
			endDate,
			dateSessions,
			allSessionsData.length,
			fetchAllSessions,
		],
	);

	const handleReset = useCallback(() => {
		setSessionIdInput("");
		setHostelIdInput("");
		setMessageInput("");
		setStartDate("");
		setEndDate("");
		pickerRef.current?.flatpickr?.clear();
		setAppliedFilters(EMPTY_FILTERS);
		setActiveDateRange(false);
		setSelectedSession(null);
		fetchAllSessions();
	}, [fetchAllSessions]);

	const handleUpload = useCallback(async (event) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		try {
			const result = await mutateUploadDocument({ variables: { file } });
			const uploaded = result.data?.uploadDocument;
			if (!uploaded) throw result.error || new Error("Unable to upload document.");
			await refetchDocuments();
			toast.success(
				`Uploaded ${file.name}${uploaded?.parentCount != null ? ` (${uploaded.parentCount} sections)` : ""}.`,
			);
		} catch (uploadError) {
			toast.error(uploadError.message || "Unable to upload document.");
		}
	}, [mutateUploadDocument, refetchDocuments]);

	const handleReplaceDocument = useCallback(async (event, documentId) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		setBusyDocumentId(documentId);
		try {
			const result = await mutateUpdateDocument({
				variables: { id: documentId, file },
			});
			if (!result.data?.updateDocument) {
				throw result.error || new Error("Unable to update document.");
			}
			await refetchDocuments();
			toast.success(`Updated ${file.name}.`);
		} catch (updateError) {
			toast.error(updateError.message || "Unable to update document.");
		} finally {
			setBusyDocumentId(null);
		}
	}, [mutateUpdateDocument, refetchDocuments]);

	const handleDeleteDocument = useCallback(async (document) => {
		if (!window.confirm(`Delete ${document.name || "this document"} from Bot Context?`)) {
			return;
		}

		setBusyDocumentId(document.id);
		try {
			await mutateDeleteDocument({ variables: { id: document.id } });
			await refetchDocuments();
			toast.success(`Deleted ${document.name || "document"}.`);
		} catch (deleteError) {
			toast.error(deleteError.message || "Unable to delete document.");
		} finally {
			setBusyDocumentId(null);
		}
	}, [mutateDeleteDocument, refetchDocuments]);

	return (
		<main className="ops-history">
			<div className="ops-history__form-container">
				<form onSubmit={handleSearch}>
					<div className="ops-history__filters">
						<label className="ops-history__field">
							<span>Session ID</span>
							<Input
								value={sessionIdInput}
								onChange={(event) => setSessionIdInput(event.target.value)}
								placeholder="Search by session ID"
							/>
						</label>
						<label className="ops-history__field">
							<span>Search messages</span>
							<Input
								value={messageInput}
								onChange={(event) => setMessageInput(event.target.value)}
								placeholder="Find text in a conversation"
							/>
						</label>
						<label className="ops-history__field">
							<span>Hostel</span>
							<Input
								type="select"
								value={hostelIdInput}
								onChange={(event) => setHostelIdInput(event.target.value)}
							>
								<option value="">All hostels</option>
								{hostels.map((hostel) => (
									<option key={hostel.id} value={hostel.id}>
										{hostel.name || hostel.id}
									</option>
								))}
							</Input>
						</label>

						<label className="ops-history__field">
							<span>Chat date range</span>
							{/* Uncontrolled on purpose: no `value` prop, so React never
							    pushes dates back in while the user is mid-selection */}
							<Flatpickr
								ref={pickerRef}
								options={pickerOptions}
								onChange={handleDateChange}
								placeholder="Select date range"
							/>
						</label>
					</div>
					<div className="ops-history__filter-actions">
						<Button className="ops-history__button ops-history__button--search" type="submit">
							<Search size={16} aria-hidden="true" />
							Search
						</Button>
						<Button
							className="ops-history__button ops-history__button--reset"
							type="button"
							onClick={handleReset}
						>
							<RotateCcw size={15} aria-hidden="true" />
							Reset
						</Button>
					</div>
				</form>
				<div className="ops-history__context">
					<h3 className="ops-history__context-header">Bot Context</h3>
					<form>
						<label className={`ops-history__upload ${uploading ? "is-uploading" : ""}`}>
							<Input
								type="file"
								accept="application/pdf,.pdf"
								onChange={handleUpload}
								disabled={uploading || updating || deleting}
							/>
							{uploading ? (
								<LoaderCircle size={19} className="ops-history__spinner" aria-hidden="true" />
							) : (
								<FileUp size={20} aria-hidden="true" />
							)}
							<span>{uploading ? "Uploading document" : "Upload document"}</span>
							<small>{uploading ? "Please wait" : "Choose a file"}</small>
						</label>
					</form>
					<div className="ops-history__documents" aria-label="Uploaded documents">
						<div className="ops-history__documents-heading">
							<span>Uploaded documents</span>
							<strong>{documents.length}</strong>
						</div>
						{documentsLoading && (
							<div className="ops-history__documents-state">Loading documents...</div>
						)}
						{!documentsLoading && documentsError && (
							<div className="ops-history__documents-state is-error">
								Unable to load documents.
							</div>
						)}
						{!documentsLoading && !documentsError && documents.length === 0 && (
							<div className="ops-history__documents-state">No documents uploaded yet.</div>
						)}
						{!documentsLoading && !documentsError && documents.map((document) => {
							const isBusy = busyDocumentId === document.id && (updating || deleting);
							return (
								<div className="ops-history__document" key={document.id}>
									<FileText size={17} aria-hidden="true" />
									<div className="ops-history__document-copy">
										<span className="ops-history__document-name" title={document.name}>
											{document.name || "Untitled document"}
										</span>
										<small>
											{formatFileSize(document.size)} | {document.parentCount ?? 0} sections | Added {formatDocumentDate(document.createdAt)}
										</small>
									</div>
									<div className="ops-history__document-actions">
										<label
											className="ops-history__document-action"
											title="Replace document"
											aria-label={`Replace ${document.name || "document"}`}
										>
											<Pencil size={15} aria-hidden="true" />
											<Input
												type="file"
												accept="application/pdf,.pdf"
												onChange={(event) => handleReplaceDocument(event, document.id)}
												disabled={uploading || updating || deleting}
											/>
										</label>
										<Button
											type="button"
											className="ops-history__document-action is-delete"
											title="Delete document"
											aria-label={`Delete ${document.name || "document"}`}
											onClick={() => handleDeleteDocument(document)}
											disabled={uploading || updating || deleting}
										>
											{isBusy && deleting ? (
												<LoaderCircle size={15} className="ops-history__spinner" aria-hidden="true" />
											) : (
												<Trash2 size={15} aria-hidden="true" />
											)}
										</Button>
									</div>
									{isBusy && updating && (
										<span className="ops-history__document-status">Updating...</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<section className="ops-history__workspace" aria-label="Chat history">
				<aside className="ops-history__list-panel" aria-label="Chat sessions">
					<div className="ops-history__list-heading">
						<span><MessageCircle size={15} aria-hidden="true" /> Chat sessions</span>
						<strong>{filteredSessions.length.toLocaleString()}</strong>
					</div>
					<div className="ops-history__session-list">
						{loading && <div className="ops-history__state">Loading chat sessions...</div>}
						{!loading && error && (
							<Alert color="danger" className="ops-history__state ops-history__state--error">
								Unable to load chat sessions.
							</Alert>
						)}
						{!loading && !error && filteredSessions.length === 0 && (
							<div className="ops-history__state">No chat sessions match these filters.</div>
						)}
						{filteredSessions.map((session) => {
							const sessionDate = getSessionCreatedAt(session);
							const isSelected = activeSession?.sessionId === session.sessionId;
							const preview = session.messages?.at(-1)?.content || "No messages";
							const title = session.title || "Untitled chat";

							return (
								<button
									className={`ops-history__session ${isSelected ? "is-selected" : ""}`}
									key={session.id || session.sessionId}
									type="button"
									onClick={() => setSelectedSession(session)}
								>
									<span className="ops-history__avatar">{getInitial(title)}</span>
									<span className="ops-history__session-copy">
										<span className="ops-history__session-title">{title}</span>
										<span className="ops-history__session-preview">{preview}</span>
									</span>
									<span className="ops-history__session-time">
										<span>{formatDate(sessionDate)}</span>
										<span>{formatTime(sessionDate)}</span>
										{isSelected && <Check size={14} aria-label="Selected chat" />}
									</span>
								</button>
							);
						})}
					</div>
				</aside>

				<section className="ops-history__conversation" aria-label="Selected conversation">
					{activeSession ? (
						<>
							<header className="ops-history__conversation-header">
								<span className="ops-history__conversation-avatar">{getInitial(activeSession.title)}</span>
								<div>
									<h1>{activeSession.title || "Untitled chat"}</h1>
									<p>{activeSession.sessionId}</p>
								</div>
								<span className="ops-history__readonly"><Lock size={13} aria-hidden="true" /> Read only</span>
							</header>
							<div className="ops-history__messages">
								{messages.length ? (
									messages.map((message, index) => (
										<ChatMessageBubble
											key={message.id || `${message.role}-${index}`}
											message={{
												sender: message.role?.toLowerCase() === "user" ? "user" : "bot",
												text: message.content || "",
											}}
										/>
									))
								) : (
									<div className="ops-history__state">This chat has no messages.</div>
								)}
							</div>
						</>
					) : null}
				</section>

				<aside className="ops-history__details" aria-label="Chat details">
					{activeSession ? (
						<>
							<div className="ops-history__details-profile">
								<span className="ops-history__details-avatar">{getInitial(activeSession.title)}</span>
								<div>
									<h2>{activeSession.title || "Untitled chat"}</h2>
									<p>Chat session</p>
								</div>
							</div>
							<dl className="ops-history__metadata">
								<div>
									<dt>Session ID</dt>
									<dd>{activeSession.sessionId}</dd>
								</div>
								<div>
									<dt>Created</dt>
									<dd>{activeSessionDate ? formatDate(activeSessionDate) : "Date unavailable"}</dd>
								</div>
								<div>
									<dt>Messages</dt>
									<dd>{messages.length}</dd>
								</div>
							</dl>
						</>
					) : (
						<p className="ops-history__details-empty">Select a chat to see details</p>
					)}
				</aside>
			</section>
		</main>
	);
}

export default OpsChatHistory;