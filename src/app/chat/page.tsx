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
import { Spinner, PageLoader, LoadingDots, LoadingText } from '@/components/common/Loading';
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
    files?: { id: string; filename: string; url: string }[];
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
    const [globalRole, setGlobalRole] = useState<Role>('developer');
    const [isRoleLocked, setIsRoleLocked] = useState(false);
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
    const [pendingAttachments, setPendingAttachments] = useState<{ id: string; filename: string; url: string }[]>([]);

    // Conversation files (files linked to the current chat)
    const [conversationFiles, setConversationFiles] = useState<{ id: string; filename: string; url: string }[]>([]);

    // Collapsible sidebar sections
    const [isContextCollapsed, setIsContextCollapsed] = useState(false);
    const [isConversationFilesCollapsed, setIsConversationFilesCollapsed] = useState(false);
    const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
    const [isDecisionsOpen, setIsDecisionsOpen] = useState(false);
    const [suggestedDecision, setSuggestedDecision] = useState<CreateDecisionRequest | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

    // PERSISTENCE: Load globalRole on mount
    useEffect(() => {
        const savedGlobalRole = localStorage.getItem('globalRole') as Role;
        if (savedGlobalRole && Object.keys(ROLE_LABELS).includes(savedGlobalRole)) {
            setGlobalRole(savedGlobalRole);
            if (!queryProjectId && !queryChatId) {
                setSelectedRole(savedGlobalRole);
            }
        }
    }, []);

    // ROLE ENFORCEMENT: Sync with project context
    useEffect(() => {
        const determineActiveRole = async () => {
            if (!isAuthenticated) return;

            let effectiveProjectId = currentProjectId;
            if (!effectiveProjectId && selectedChatId) {
                const activeChat = chats.find(c => c.id === selectedChatId);
                effectiveProjectId = activeChat?.project_id || null;
            }

            if (effectiveProjectId) {
                try {
                    const response = await api.get<any>(`/projects/${effectiveProjectId}`);
                    if (response.success && response.data) {
                        // Check if owner
                        if (response.data.owner_id === user?.id) {
                            setIsRoleLocked(false);
                            return;
                        }

                        // Check if user is a member with a specific role
                        const members = response.data.members || [];
                        const member = members.find((m: any) => m.user_id === user?.id);
                        if (member) {
                            setSelectedRole(member.role as Role);
                            setIsRoleLocked(true);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch project role:', error);
                }
            }

            // Fallback for non-project context: use global role and unlock
            setSelectedRole(globalRole);
            setIsRoleLocked(false);
        };

        determineActiveRole();
    }, [currentProjectId, selectedChatId, user?.id, globalRole, isAuthenticated, chats]);

    const handleRoleChange = (newRole: Role) => {
        if (isRoleLocked) return;

        setSelectedRole(newRole);
        setGlobalRole(newRole);
        localStorage.setItem('globalRole', newRole);
    };

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Sync currentProjectId with URL param
    useEffect(() => {
        if (queryProjectId !== currentProjectId) {
            setCurrentProjectId(queryProjectId);
        }
    }, [queryProjectId]);

    // RESET State when Project Context Changes
    useEffect(() => {
        if (currentProjectId && !queryChatId) {
            setSelectedChatId(null);
            setMessages([]);
            setPendingAttachments([]);
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
            selectChat(queryChatId, false);
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

    const fetchSuggestions = async () => {
        setIsSuggestionsLoading(true);
        try {
            const response = await api.post<{ data: string[] }>('/chat/suggestions', {
                role: selectedRole,
                project_id: currentProjectId || undefined
            });
            if (response.success && Array.isArray(response.data)) {
                setSuggestions(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        } finally {
            setIsSuggestionsLoading(false);
        }
    };

    // Trigger suggestions when empty chat (no ID, no messages)
    useEffect(() => {
        if (!selectedChatId && messages.length === 0 && isAuthenticated) {
            fetchSuggestions();
        } else if (selectedChatId) {
            // Clear suggestions if we are in a chat
            setSuggestions([]);
        }
    }, [selectedChatId, messages.length, isAuthenticated, currentProjectId, selectedRole]);

    const selectChat = async (chatId: string, updateUrl: boolean = true) => {
        setSelectedChatId(chatId);
        setSuggestions([]); // Clear suggestions immediately on selection

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
                    files: msg.files ? msg.files.map((f: any) => ({ id: f.id, filename: f.filename, url: f.file_url })) : []
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

    const sendMessage = async (text: string) => {
        if ((!text.trim() && pendingAttachments.length === 0) || isLoading) return;

        const uiId = Date.now().toString();
        const messageContent = text.trim();

        const userMessage: Message = {
            id: uiId,
            role: 'user',
            content: messageContent,
            timestamp: new Date(),
            files: [...pendingAttachments]
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        const attachmentsToSend = [...pendingAttachments.map(f => f.id)];
        setPendingAttachments([]); // Clear immediately
        setIsLoading(true);

        try {
            // Determine Project ID:
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
                chat_id: selectedChatId || undefined,
                file_ids: attachmentsToSend
            });

            if (response.success && response.data) {
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

                if (!selectedChatId && response.data.chat_id) {
                    setSelectedChatId(response.data.chat_id);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('chat', response.data.chat_id);
                    const newUrl = `/chat?${params.toString()}`;
                    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
                    fetchChats();
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        sendMessage(input);
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
                const response = await api.uploadWithProgress<{ id: string; filename: string; url: string }>(
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
        const successfulUploads = results.filter((r): r is { id: string; filename: string; url: string } => r !== null);

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
        return <PageLoader message="Authenticating..." />;
    }

    if (!isAuthenticated) return null;

    return (
        <div className="h-screen flex bg-black overflow-hidden font-sans antialiased text-foreground">
            {/* Sidebar */}
            <div
                className={`glass-panel border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'
                    }`}
            >
                {/* Sidebar Header (Static) */}
                <div className="p-4 border-b border-white/5 shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="w-full py-2.5 px-4 bg-primary text-black hover:bg-white/90 rounded-lg transition-all duration-300 font-bold flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-white/5"
                    >
                        <FiPlus className="w-5 h-5 flex-shrink-0" />
                        New Chat
                    </button>
                </div>

                {/* Sidebar Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-[20rem] scrollbar-hide">
                    {/* Collapsible Project Context Section */}
                    {currentProjectId && (
                        <div className="mb-6">
                            <button
                                onClick={() => setIsContextCollapsed(!isContextCollapsed)}
                                className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3 hover:text-white transition"
                            >
                                <span>PROJECT FILES</span>
                                <FiChevronDown className={`w-4 h-4 transition-transform ${isContextCollapsed ? '-rotate-90' : ''}`} />
                            </button>
                            {!isContextCollapsed && (
                                <div className="space-y-4">
                                    <FileUploader
                                        projectId={currentProjectId!}
                                        onUploadComplete={(file) => {
                                            setRefreshFiles(prev => prev + 1);
                                            if (file) {
                                                setPendingAttachments(prev => [...prev, file]);
                                            }
                                        }}
                                    />
                                    <FileList projectId={currentProjectId!} refreshTrigger={refreshFiles} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collapsible Conversation Files Section */}
                    {selectedChatId && conversationFiles.length > 0 && (
                        <div className="mb-6">
                            <button
                                onClick={() => setIsConversationFilesCollapsed(!isConversationFilesCollapsed)}
                                className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3 hover:text-white transition"
                            >
                                <span>CONVERSATION FILES</span>
                                <FiChevronDown className={`w-4 h-4 transition-transform ${isConversationFilesCollapsed ? '-rotate-90' : ''}`} />
                            </button>
                            {!isConversationFilesCollapsed && (
                                <div className="space-y-1.5">
                                    {conversationFiles.map(file => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2.5 rounded-lg glass-card border-white/5 hover:border-white/20 text-muted-foreground hover:text-white transition-all text-sm group"
                                        >
                                            <FaPaperclip className="w-3 h-3 text-white/40 group-hover:text-white transition" />
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
                        className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2 hover:text-white transition"
                    >
                        <span>HISTORY</span>
                        <FiChevronDown className={`w-4 h-4 transition-transform ${isHistoryCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                    {!isHistoryCollapsed && (
                        <div className="space-y-2">
                            {isHistoryLoading ? (
                                <LoadingText text="Loading history" />
                            ) : chats.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4 text-xs">No chat history found.</div>
                            ) : (
                                chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => selectChat(chat.id)}
                                        className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 border ${selectedChatId === chat.id
                                            ? 'bg-white/10 border-white/20 text-white'
                                            : 'bg-transparent border-transparent text-muted-foreground hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <div className="font-semibold truncate flex items-center justify-between gap-2">
                                            <span className="truncate text-sm tracking-tight">{chat.title || 'Untitled Chat'}</span>
                                            {chat.project_id && (
                                                <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-black bg-white/10 text-white/60 border border-white/10 shrink-0 tracking-widest uppercase">
                                                    EXT
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] opacity-40 mt-1 font-medium italic">
                                            {new Date(chat.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Footer (Static) */}
                <div className="p-4 border-t border-white/5 shrink-0 bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-black text-sm flex-shrink-0 shadow-inner">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate tracking-tight">{user?.full_name}</div>
                            <div className="text-[10px] text-muted-foreground truncate font-medium">{user?.email}</div>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            title="Logout"
                        >
                            <FiLogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header (Static) */}
                <header className="glass-panel border-b border-white/5 h-16 flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-all duration-300"
                            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            <FiMenu className="w-5 h-5" />
                        </button>
                        <Link href="/dashboard" className="text-xl font-bold text-white hover:text-white/80 transition tracking-tighter">
                            AI Project Manager
                        </Link>
                        {selectedRole && (
                            <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-black rounded border border-white/10 uppercase tracking-widest">
                                {ROLE_LABELS[selectedRole]}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <select
                                value={selectedRole}
                                onChange={(e) => handleRoleChange(e.target.value as Role)}
                                disabled={isRoleLocked}
                                className={`px-3 py-1.5 bg-black/40 border rounded-lg text-white text-xs font-semibold focus:outline-none focus:ring-1 transition-all cursor-pointer appearance-none pr-8 ${isRoleLocked ? 'border-primary/40 opacity-80 cursor-not-allowed' : 'border-white/10 focus:ring-white/20'
                                    }`}
                            >
                                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value} className="bg-black text-white">
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-white/40">
                                <FiChevronDown className="w-4 h-4" />
                            </div>
                            {isRoleLocked && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-black text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl z-50 uppercase tracking-widest border border-black/10">
                                    Project Restricted Role
                                </div>
                            )}
                        </div>

                        {currentProjectId && (
                            <button
                                onClick={() => setIsDecisionsOpen(!isDecisionsOpen)}
                                className={`p-2 rounded-lg transition-all border ${isDecisionsOpen
                                    ? 'bg-white text-black border-white'
                                    : 'text-muted-foreground hover:text-white hover:bg-white/5 border-transparent'
                                    }`}
                                title={isDecisionsOpen ? "Hide Decisions" : "Show Decisions"}
                            >
                                <FiBook className="w-4 h-4" />
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
                                <div className="max-w-3xl mx-auto mb-6 p-4 glass-card border-white/5">
                                    <div className="text-[10px] font-black text-muted-foreground mb-3 uppercase tracking-[0.2em]">
                                        CONTEXTUAL FILES ({conversationFiles.length})
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {conversationFiles.map(file => (
                                            <a
                                                key={file.id}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white text-xs transition-all border border-white/5"
                                            >
                                                <FaPaperclip className="w-3 h-3 text-white/40" />
                                                <span className="truncate max-w-[150px] font-medium">{file.filename}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.length === 0 ? (
                                    <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                        <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mx-auto mb-8 border-white/10">
                                            <BsChatDots className="w-8 h-8 text-white/40 font-light" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white mb-3 tracking-tighter">Start a conversation</h2>
                                        <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed mb-8">
                                            Ask questions as a <strong className="text-primary">{ROLE_LABELS[selectedRole]}</strong>. Start a new session or choose an existing chat.
                                        </p>

                                        {/* Suggestions */}
                                        {isSuggestionsLoading ? (
                                            <LoadingDots className="justify-center mt-4" />
                                        ) : (
                                            <div className="flex flex-col gap-3 max-w-md mx-auto">
                                                {suggestions.map((suggestion, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setInput(suggestion);
                                                            // Optional: Auto-submit?
                                                            // const syntheticEvent = { preventDefault: () => {} } as FormEvent;
                                                            // handleSubmit(syntheticEvent);
                                                            // No, better to let user review/edit first, but populate input.
                                                        }}
                                                        className="p-3 text-sm text-center glass-card hover:bg-white/10 border-white/5 hover:border-white/20 rounded-xl transition-all duration-300 text-muted-foreground hover:text-white"
                                                    >
                                                        "{suggestion}"
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl p-5 ${message.role === 'user'
                                                    ? 'bg-white text-black shadow-xl shadow-white/5 font-medium'
                                                    : 'glass-card text-white border-white/5'
                                                    }`}
                                            >

                                                <div className={`prose ${message.role === 'user' ? 'prose-black' : 'prose-invert'} max-w-none break-words text-[15px] leading-relaxed`}>
                                                    {message.files && message.files.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {message.files.map(file => (
                                                                <a
                                                                    key={file.id}
                                                                    href={file.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all group no-underline ${message.role === 'user'
                                                                        ? 'bg-black/5 hover:bg-black/10 text-black border border-black/5'
                                                                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
                                                                        }`}
                                                                >
                                                                    <FaPaperclip className={`w-3 h-3 ${message.role === 'user' ? 'text-black/40' : 'text-white/40'}`} />
                                                                    <span className="truncate max-w-[150px]">{file.filename}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
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
                                                                    <div className="rounded-xl overflow-hidden my-4 border border-white/10">
                                                                        <div className="bg-white/5 px-4 py-1.5 text-[10px] text-muted-foreground flex justify-between items-center font-bold tracking-widest uppercase">
                                                                            <span>{match[1]}</span>
                                                                        </div>
                                                                        <code className={`block bg-black/60 p-5 overflow-x-auto text-sm font-mono ${className}`} {...rest}>
                                                                            {children}
                                                                        </code>
                                                                    </div>
                                                                ) : (
                                                                    <code className={`${message.role === 'user' ? 'bg-black/10 text-black' : 'bg-white/10 text-white'} px-1.5 py-0.5 rounded text-[13px] font-mono`} {...rest}>
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
                                                    <div className="mt-5 mb-1 glass-card border-white/10 overflow-hidden bg-white/5">
                                                        <div className="bg-white/10 px-4 py-2 border-b border-white/5 flex items-center gap-2">
                                                            <FiBook className="w-3 h-3 text-white/60" />
                                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Design Recommendation</span>
                                                        </div>
                                                        <div className="p-4">
                                                            <h4 className="text-white text-[15px] font-bold mb-2 tracking-tight">{message.decision_proposal.title}</h4>
                                                            <button
                                                                onClick={() => {
                                                                    setSuggestedDecision(message.decision_proposal || null);
                                                                    setIsDecisionsOpen(true);
                                                                }}
                                                                className="w-full mt-2 py-2 bg-primary text-black hover:bg-white/90 rounded-lg text-xs font-black transition-all duration-300 uppercase tracking-widest"
                                                            >
                                                                Review Recommendation
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <span className={`text-[10px] font-bold uppercase tracking-widest opacity-30 mt-3 block ${message.role === 'user' ? 'text-black' : 'text-white'}`}>
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isLoading && (
                                    <div className="flex justify-start animate-in fade-in duration-300">
                                        <div className="glass-card rounded-2xl px-6 py-4 border-white/5">
                                            <LoadingDots />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Suggestion Banner */}
                        {suggestedDecision && (
                            <div className="absolute bottom-full left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent flex justify-center z-20 pb-4">
                                <button
                                    onClick={() => {
                                        setIsDecisionsOpen(true);
                                    }}
                                    className="flex items-center gap-4 px-5 py-3.5 glass-card backdrop-blur-2xl rounded-2xl shadow-2xl border-white/10 text-white animate-in slide-in-from-bottom-4 transition-all group scale-100 hover:scale-[1.02] active:scale-95"
                                >
                                    <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-white/20 transition">
                                        <FiBook className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">AI Suggestion</div>
                                        <div className="font-bold text-sm tracking-tight">Review "{suggestedDecision?.title}"</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-full ml-4 hover:bg-white/10 transition-colors" onClick={(e) => {
                                        e.stopPropagation();
                                        setSuggestedDecision(null);
                                    }}>
                                        <FiX className="w-4 h-4 text-white/60" />
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Input (Static) */}
                        <div className="border-t border-white/5 bg-black/40 backdrop-blur-2xl p-4 shrink-0 z-10 relative">
                            {pendingAttachments.length > 0 && (
                                <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
                                    {pendingAttachments.map((file) => (
                                        <div key={file.id} className="flex items-center gap-2 glass-card bg-white/5 border-white/10 rounded-lg px-3 py-2 text-xs text-muted-foreground font-medium">
                                            <FaPaperclip className="w-3 h-3 text-white/40" />
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
                                                <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${progress === -1 ? 'bg-red-500' : 'bg-primary'}`}
                                                        style={{ width: `${progress === -1 ? 100 : progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-bold">{progress === -1 ? 'ERROR' : `${progress}%`}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!isUploading && (
                                    <button
                                        type="button"
                                        onClick={triggerFileUpload}
                                        disabled={!currentProjectId && !selectedChatId}
                                        className={`p-3.5 rounded-2xl border transition-all duration-300 flex-shrink-0
                                            ${(!currentProjectId && !selectedChatId)
                                                ? 'bg-white/5 border-white/5 text-muted-foreground/30 cursor-not-allowed'
                                                : 'bg-white/5 border-white/5 text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20'
                                            }
                                        `}
                                        title={(!currentProjectId && !selectedChatId) ? "Select a project or start a chat to upload files" : "Attach file"}
                                    >
                                        <FaPaperclip className="w-5 h-5 font-light" />
                                    </button>
                                )}

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Inquire for architectural insights..."
                                    className="flex-1 px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || (!input.trim() && pendingAttachments.length === 0)}
                                    className="p-4 bg-accent hover:opacity-90 text-white font-black rounded-2xl shadow-2xl shadow-accent/20 transition-all duration-300 disabled:opacity-20 disabled:grayscale active:scale-95 flex items-center justify-center min-w-[3.5rem]"
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
                            initialProposal={suggestedDecision || undefined}
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
        <Suspense fallback={<PageLoader message="Initializing Environment..." />}>
            <ChatContent />
        </Suspense>
    );
}
