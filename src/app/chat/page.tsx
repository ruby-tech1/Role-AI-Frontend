'use client';

import { useState, useEffect, FormEvent, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { Role, ChatResponse, ChatSession, ChatMessage, CreateDecisionRequest } from '@/types';
import { ROLE_LABELS } from '@/types';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUploader from '@/components/chat/FileUploader';
import FileList from '@/components/chat/FileList';
import MermaidRenderer from '@/components/artifacts/MermaidRenderer';
import { FaSpinner } from 'react-icons/fa';
import { FiPlus, FiLogOut, FiMenu, FiX, FiChevronDown, FiAlertCircle } from 'react-icons/fi';
import { BsChatDots } from 'react-icons/bs';
import { IoSend } from "react-icons/io5";
import { FaPaperclip } from "react-icons/fa";
import { FiBook } from "react-icons/fi";
import DecisionSidebar from '@/components/decisions/DecisionSidebar';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    decision_proposal?: CreateDecisionRequest;
}

function ChatContent() {
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryProjectId = searchParams.get('project');
    const queryChatId = searchParams.get('chat');

    const [currentProjectId, setCurrentProjectId] = useState<string | null>(queryProjectId);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role>('developer');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // History State
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [refreshFiles, setRefreshFiles] = useState(0);

    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [filename: string]: number }>({});

    // Attachments State
    const [pendingAttachments, setPendingAttachments] = useState<{ id: string; filename: string }[]>([]);

    // Conversation files (files linked to the current chat)
    const [conversationFiles, setConversationFiles] = useState<{ id: string; filename: string; url: string }[]>([]);

    // Collapsible sidebar sections
    const [isContextCollapsed, setIsContextCollapsed] = useState(false);
    const [isConversationFilesCollapsed, setIsConversationFilesCollapsed] = useState(false);
    const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
    const [isDecisionsOpen, setIsDecisionsOpen] = useState(false);
    const [suggestedDecision, setSuggestedDecision] = useState<CreateDecisionRequest | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Sync currentProjectId with URL param
    useEffect(() => {
        // Only set if query param exists (or if we want to clear it when navigating away? No, typically one-way)
        // If queryProjectId changes (e.g. navigation), we update.
        // Also valid to allow manual clearing.
        if (queryProjectId !== currentProjectId) {
            setCurrentProjectId(queryProjectId);
        }
    }, [queryProjectId]);

    // RESET State when Project Context Changes
    useEffect(() => {
        // When switching projects (or entering one), we must clear the previous chat view
        // to avoid showing "Project A" messages while in "Project B" context.
        // BUT only if there's no chat in URL
        if (currentProjectId && !queryChatId) {
            setSelectedChatId(null);
            setMessages([]);
            setPendingAttachments([]); // Clear attachments from other context
        }
    }, [currentProjectId]);

    // Fetch Chat History on Load
    useEffect(() => {
        if (isAuthenticated) {
            fetchChats();
        }
    }, [isAuthenticated, currentProjectId]);

    // Load chat from URL on mount
    useEffect(() => {
        if (isAuthenticated && queryChatId && !selectedChatId) {
            selectChat(queryChatId, false); // false = don't update URL since it's already there
        }
    }, [isAuthenticated, queryChatId]);


    const fetchChats = async () => {
        setIsHistoryLoading(true);
        try {
            const response = await api.get<ChatSession[]>('/chat' + (currentProjectId ? `?project_id=${currentProjectId}` : ''));
            if (response.success && response.data) {
                setChats(response.data);
                // Don't auto-select - show blank chat when navigating from project
            }

        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const selectChat = async (chatId: string, updateUrl: boolean = true) => {
        setSelectedChatId(chatId);

        // Update URL with chat ID
        if (updateUrl) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('chat', chatId);
            router.replace(`/chat?${params.toString()}`, { scroll: false });
        }

        // DO NOT change currentProjectId. 
        // We want to allow viewing a chat without forcing the filter to that project.
        // The user might be in "All Projects" mode and just checking a specific chat.
        // Changing currentProjectId would trigger the sidebar to filter only that project's chats, 
        // which can be disorienting.

        setIsLoading(true); // Loading messages
        try {
            const response = await api.get<ChatMessage[]>(`/chat/${chatId}/messages`);
            if (response.success && response.data) {
                // Convert backend messages to UI format
                const uiMessages: Message[] = response.data.map(msg => ({
                    id: msg.id,
                    role: msg.role === 'model' ? 'assistant' : 'user', // Map 'model' to 'assistant'
                    content: msg.content,
                    timestamp: new Date(msg.created_at),
                }));
                setMessages(uiMessages);
            }

            // Fetch conversation files for this chat
            const filesResponse = await api.get<{ id: string; filename: string; url: string }[]>(`/chat/${chatId}/files`);
            if (filesResponse.success && filesResponse.data) {
                setConversationFiles(filesResponse.data);
            } else {
                setConversationFiles([]);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;

        const uiId = Date.now().toString();

        let messageContent = input.trim();
        if (pendingAttachments.length > 0) {
            // Optimistically show attachment in message? Or separate UI?
            // Usually separate, but for chat history it's text.
            // Backend appends text, so front-end just shows text.
            // We can just send the text input, and backend injects context.
            // But we might want to locally show "Attached: foo.pdf" in the user message bubble?
            // For now, simpler to just let backend do its thing.
            // But user might want to see they sent a file.
            const fileNames = pendingAttachments.map(f => f.filename).join(', ');
            // We won't append to content here to avoid duplication if backend appends.
            // But we want to reflect it in the UI immediately.
            // maybe we can prepend a small indicator locally?
        }

        const userMessage: Message = {
            id: uiId,
            role: 'user',
            content: messageContent,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        const attachmentsToSend = [...pendingAttachments.map(f => f.id)];
        setPendingAttachments([]); // Clear immediately
        setIsLoading(true);

        try {
            // Determine Project ID:
            // 1. If we have an active selected chat, use ITS project_id (regardless of filter).
            // 2. If no chat selected (New Chat), use the current project filter/context.
            let effectiveProjectId = currentProjectId;

            if (selectedChatId) {
                const activeChat = chats.find(c => c.id === selectedChatId);
                if (activeChat) {
                    effectiveProjectId = activeChat.project_id || null;
                }
            }

            const response = await api.post<ChatResponse>('/chat', {
                message: userMessage.content,
                role: selectedRole,
                project_id: effectiveProjectId || undefined,
                chat_id: selectedChatId || undefined, // If we had a specific chat endpoint, but here we just pass ID if needed? 
                // Wait, the backend logic:
                // "1. Get or Create Chat Session" -> "query = select(Chat).where(Chat.user_id == ... AND Chat.project_id == ...)"
                // This logic implies ONE chat per project. That's a backend limitation we might be fighting.
                // If we want multiple chats per project, the backend needs to accept `chat_id` in the request.
                // Looking at backend `chat.py`:
                // It CHECKS for existing session by project_id. 
                // It does NOT seem to accept a `chat_id` to continue a specific conversation if multiple exist for a project?
                // Actually, the backend logic at line 117 is:
                // query = select(Chat).where(Chat.user_id == ..., Chat.project_id == request.project_id)
                // This forces SINGLE chat per project!
                // FIX: We need to pass the explicit chat_id if we have one.
                // However, the `ChatRequest` schema doesn't have `chat_id`?
                // Left as is for now, but `effectiveProjectId` ensures we at least target the correct project bucket.

                file_ids: attachmentsToSend
            });

            if (response.success && response.data) {
                // Check for structured decision proposal from backend
                if (response.data.decision_proposal) {
                    setSuggestedDecision(response.data.decision_proposal);
                }

                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: response.data.response,
                    timestamp: new Date(),
                    decision_proposal: response.data.decision_proposal,
                };
                setMessages((prev) => [...prev, aiMessage]);

                // Update URL with new chat ID if this was a new chat
                if (!selectedChatId && response.data.chat_id) {
                    setSelectedChatId(response.data.chat_id);

                    // Silent URL update to avoid component remount/state reset
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('chat', response.data.chat_id);
                    const newUrl = `/chat?${params.toString()}`;
                    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

                    fetchChats(); // Refresh chat list
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setSelectedChatId(null);
        setMessages([]);
        setPendingAttachments([]);
        setConversationFiles([]);

        // Clear chat from URL but keep project
        const params = new URLSearchParams(searchParams.toString());
        params.delete('chat');
        router.replace(`/chat?${params.toString()}`, { scroll: false });

        // If we are in a project context, we STAY in it to create a new chat FOR that project.
        if (!currentProjectId) {
            // Only if we were GLOBAL do we remain GLOBAL (null project)
            setCurrentProjectId(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Validate max 5 files
        if (files.length > 5) {
            alert("Maximum 5 files allowed per upload.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Validate total size (100MB limit)
        const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalSize += files[i].size;
        }
        if (totalSize > MAX_TOTAL_SIZE) {
            alert(`Total file size exceeds 100MB limit. Selected: ${(totalSize / (1024 * 1024)).toFixed(1)}MB`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        setUploadProgress({});

        // Upload all files simultaneously
        const uploadPromises = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            // Chat attachments are NOT linked to project - they will be linked to chat/message when sent


            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

            try {
                const response = await api.uploadWithProgress<{ id: string; filename: string }>(
                    '/files/upload',
                    formData,
                    (percent) => setUploadProgress(prev => ({ ...prev, [file.name]: percent }))
                );
                if (response.success && response.data) {
                    setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                    return response.data;
                }
            } catch (error) {
                console.error(`Upload failed for ${file.name}:`, error);
                setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 indicates error
            }
            return null;
        });

        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter((r): r is { id: string; filename: string } => r !== null);

        if (successfulUploads.length > 0) {
            setPendingAttachments(prev => [...prev, ...successfulUploads]);
            setRefreshFiles(prev => prev + 1);
        }

        setIsUploading(false);
        setUploadProgress({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Delete a pending attachment
    const removePendingAttachment = async (fileId: string) => {
        try {
            await api.delete(`/files/${fileId}`);
            setPendingAttachments(prev => prev.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
    };

    const triggerFileUpload = () => {
        if (!currentProjectId && !selectedChatId) {
            alert("Please select a project or start a chat to upload files.");
            return;
        }
        fileInputRef.current?.click();
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="flex items-center gap-3 text-white">
                    <FaSpinner className="animate-spin h-8 w-8 text-white/50" />
                    <span className="text-xl">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            {/* Sidebar */}
            <div
                className={`bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'
                    }`}
            >
                {/* Sidebar Header (Static) */}
                <div className="p-4 border-b border-white/10 shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <FiPlus className="w-5 h-5 flex-shrink-0" />
                        New Chat
                    </button>
                </div>

                {/* Sidebar Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-[20rem]">
                    {/* Collapsible Project Context Section */}
                    {currentProjectId && (
                        <div className="mb-6">
                            <button
                                onClick={() => setIsContextCollapsed(!isContextCollapsed)}
                                className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 hover:text-white transition"
                            >
                                <span>PROJECT FILES</span>
                                <FiChevronDown className={`w-4 h-4 transition-transform ${isContextCollapsed ? '-rotate-90' : ''}`} />
                            </button>
                            {!isContextCollapsed && (
                                <>
                                    <FileUploader
                                        projectId={currentProjectId}
                                        onUploadComplete={(file) => {
                                            setRefreshFiles(prev => prev + 1);
                                            if (file) {
                                                setPendingAttachments(prev => [...prev, file]);
                                            }
                                        }}
                                    />
                                    <FileList projectId={currentProjectId} refreshTrigger={refreshFiles} />
                                </>
                            )}
                        </div>
                    )}

                    {/* Collapsible Conversation Files Section */}
                    {selectedChatId && conversationFiles.length > 0 && (
                        <div className="mb-6">
                            <button
                                onClick={() => setIsConversationFilesCollapsed(!isConversationFilesCollapsed)}
                                className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 hover:text-white transition"
                            >
                                <span>CONVERSATION FILES</span>
                                <FiChevronDown className={`w-4 h-4 transition-transform ${isConversationFilesCollapsed ? '-rotate-90' : ''}`} />
                            </button>
                            {!isConversationFilesCollapsed && (
                                <div className="space-y-1">
                                    {conversationFiles.map(file => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition text-sm"
                                        >
                                            <FaPaperclip className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                            <span className="truncate">{file.filename}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collapsible History Section */}
                    <button
                        onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                        className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 hover:text-white transition"
                    >
                        <span>HISTORY</span>
                        <FiChevronDown className={`w-4 h-4 transition-transform ${isHistoryCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                    {!isHistoryCollapsed && (
                        <>
                            {isHistoryLoading ? (
                                <div className="text-center text-gray-500 py-4">Loading history...</div>
                            ) : chats.length === 0 ? (
                                <div className="text-center text-gray-500 py-4 text-sm">No chat history found.</div>
                            ) : (
                                chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => selectChat(chat.id)}
                                        className={`w-full text-left p-3 rounded-xl transition border ${selectedChatId === chat.id
                                            ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                            : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="font-medium truncate flex items-center gap-2">
                                            <span className="truncate">{chat.title || 'Untitled Chat'}</span>
                                            {chat.project_id && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-300 border border-purple-500/30 shrink-0">
                                                    PROJECT
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs opacity-60 mt-1">
                                            {new Date(chat.updated_at).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar Footer (Static) */}
                <div className="p-4 border-t border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{user?.full_name}</div>
                            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                        </div>
                        <button
                            onClick={logout}
                            className="text-gray-400 hover:text-white transition flex-shrink-0"
                            title="Logout"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header (Static) */}
                <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 h-16 flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>
                        <Link href="/dashboard" className="text-xl font-bold text-white hover:text-purple-400 transition">
                            Role-Aware AI
                        </Link>
                        {selectedRole && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                                {ROLE_LABELS[selectedRole]}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as Role)}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                <option key={value} value={value} className="bg-slate-800">
                                    {label}
                                </option>
                            ))}
                        </select>

                        {currentProjectId && (
                            <button
                                onClick={() => setIsDecisionsOpen(!isDecisionsOpen)}
                                className={`p-2 rounded-lg transition border ${isDecisionsOpen
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                                    }`}
                                title={isDecisionsOpen ? "Hide Decisions" : "Show Decisions"}
                            >
                                <FiBook className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Messages (Scrollable) */}
                        <div className="flex-1 overflow-y-auto px-4 py-6">
                            {/* Conversation Files Bar at Top */}
                            {conversationFiles.length > 0 && (
                                <div className="max-w-3xl mx-auto mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                    <div className="text-xs font-semibold text-purple-300 mb-2">
                                        Files in this conversation ({conversationFiles.length})
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {conversationFiles.map(file => (
                                            <a
                                                key={file.id}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-200 hover:text-white text-xs transition"
                                            >
                                                <FaPaperclip className="w-3 h-3" />
                                                <span className="truncate max-w-[120px]">{file.filename}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <BsChatDots className="w-10 h-10 text-purple-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Start a Conversation</h2>
                                        <p className="text-gray-400 max-w-md mx-auto">
                                            Ask questions and get responses tailored to your role as a <strong className="text-purple-400">{ROLE_LABELS[selectedRole]}</strong>.
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl p-4 ${message.role === 'user'
                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                    : 'bg-white/10 text-white border border-white/10'
                                                    }`}
                                            >
                                                <div className={`prose ${message.role === 'user' ? 'prose-invert' : 'prose-invert'} max-w-none break-words text-sm`}>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            code(props) {
                                                                const { children, className, node, ...rest } = props;
                                                                const match = /language-(\w+)/.exec(className || '');
                                                                const isMermaid = match && match[1] === 'mermaid';

                                                                if (isMermaid) {
                                                                    return <MermaidRenderer chart={String(children).replace(/\n$/, '')} />;
                                                                }

                                                                return match ? (
                                                                    <div className="rounded-md overflow-hidden my-2">
                                                                        <div className="bg-gray-800 px-4 py-1 text-xs text-gray-400 flex justify-between items-center">
                                                                            <span>{match[1]}</span>
                                                                        </div>
                                                                        <code className={`block bg-black/50 p-4 overflow-x-auto text-sm ${className}`} {...rest}>
                                                                            {children}
                                                                        </code>
                                                                    </div>
                                                                ) : (
                                                                    <code className="bg-black/20 px-1 py-0.5 rounded text-sm font-mono text-purple-200" {...rest}>
                                                                        {children}
                                                                    </code>
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                                {message.decision_proposal && (
                                                    <div className="mt-3 mb-1 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                                                        <div className="bg-purple-600/20 px-3 py-2 border-b border-white/10 flex items-center gap-2">
                                                            <FiBook className="w-3 h-3 text-purple-200" />
                                                            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wide">Suggested Decision</span>
                                                        </div>
                                                        <div className="p-3">
                                                            <h4 className="text-white text-sm font-medium mb-1">{message.decision_proposal.title}</h4>
                                                            <button
                                                                onClick={() => {
                                                                    setSuggestedDecision(message.decision_proposal || null);
                                                                    setIsDecisionsOpen(true);
                                                                }}
                                                                className="w-full mt-2 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-white text-xs font-medium transition"
                                                            >
                                                                Review
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <span className="text-xs opacity-60 mt-2 block">
                                                    {message.timestamp.toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Suggestion Banner */}
                        {suggestedDecision && (
                            <div className="absolute bottom-full left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent flex justify-center z-20 pb-2">
                                <button
                                    onClick={() => {
                                        setIsDecisionsOpen(true);
                                        // Wait for sidebar to mount/open? logic in sidebar checks prop.
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 bg-purple-600/90 hover:bg-purple-500 backdrop-blur-md rounded-xl shadow-lg border border-purple-400/50 text-white animate-fade-in-up transition-all group"
                                >
                                    <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition">
                                        <FiBook className="w-5 h-5 text-purple-100" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-purple-200 uppercase tracking-wide">Design Decision Detected</div>
                                        <div className="font-medium text-sm">Click to review "{suggestedDecision.title}"</div>
                                    </div>
                                    <div className="bg-white/10 p-1.5 rounded-full ml-2 hover:bg-white/20" onClick={(e) => {
                                        e.stopPropagation();
                                        setSuggestedDecision(null);
                                    }}>
                                        <FiX className="w-4 h-4" />
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Input (Static) */}
                        <div className="border-t border-white/10 bg-white/5 backdrop-blur-lg p-4 shrink-0 z-10 relative">
                            {pendingAttachments.length > 0 && (
                                <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
                                    {pendingAttachments.map((file) => (
                                        <div key={file.id} className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-purple-200">
                                            <FaPaperclip className="w-3 h-3" />
                                            <span className="truncate max-w-[150px]" title={file.filename}>{file.filename}</span>
                                            <button
                                                onClick={() => removePendingAttachment(file.id)}
                                                className="hover:text-white transition"
                                            >
                                                <FiX className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-4 items-center">
                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".pdf,.txt,.md,.docx"
                                    disabled={isUploading}
                                    multiple
                                />

                                {/* Upload Progress Per File */}
                                {isUploading && Object.keys(uploadProgress).length > 0 && (
                                    <div className="flex flex-col gap-1">
                                        {Object.entries(uploadProgress).map(([filename, progress]) => (
                                            <div key={filename} className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 truncate max-w-[100px]" title={filename}>{filename}</span>
                                                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-200 ${progress === -1 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                                                        style={{ width: `${progress === -1 ? 100 : progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-400">{progress === -1 ? 'Error' : `${progress}%`}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!isUploading && (
                                    <button
                                        type="button"
                                        onClick={triggerFileUpload}
                                        disabled={!currentProjectId && !selectedChatId}
                                        className={`p-3 rounded-xl border transition-all duration-300 flex-shrink-0
                                            ${(!currentProjectId && !selectedChatId)
                                                ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-purple-500/50'
                                            }
                                        `}
                                        title={(!currentProjectId && !selectedChatId) ? "Select a project or start a chat to upload files" : "Attach file"}
                                    >
                                        <FaPaperclip className="w-5 h-5" />
                                    </button>
                                )}

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || (!input.trim() && pendingAttachments.length === 0)}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoSend className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Sidebar: Design Decisions */}
                    {isDecisionsOpen && currentProjectId && (
                        <DecisionSidebar
                            projectId={currentProjectId}
                            initialProposal={suggestedDecision}
                            onClearProposal={() => setSuggestedDecision(null)}
                        />
                    )}
                </div>
            </div>
        </div >
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-white text-xl">Loading chat...</div>
            </div>
        }>
            <ChatContent />
        </Suspense>
    );
}
