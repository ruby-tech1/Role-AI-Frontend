'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api, { ApiError } from '@/lib/api';
import { FiAlertCircle, FiEdit2, FiTrash2, FiPlus, FiUser, FiUserMinus, FiGrid, FiFile, FiCheckCircle, FiClock, FiChevronDown, FiChevronRight, FiUpload, FiSettings, FiRefreshCcw } from 'react-icons/fi';
import { BsChatDots } from 'react-icons/bs';
import { FaSpinner } from 'react-icons/fa';
import type { ProjectWithMembers, Role, ProjectFile, DesignDecision } from '@/types';
import { ROLE_LABELS } from '@/types';
import Header from '@/components/common/Header';

export default function ProjectDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params);
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [project, setProject] = useState<ProjectWithMembers | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingMember, setEditingMember] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<Role>('developer');
    const [memberAction, setMemberAction] = useState<{ type: 'remove', memberId: string } | null>(null);

    // Increment 9: New State
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [decisions, setDecisions] = useState<DesignDecision[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Increment 11: Decision State
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [newDecision, setNewDecision] = useState({ title: '', content: '', rationale: '' });
    const [isCreatingDecision, setIsCreatingDecision] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Increment 12: Edit Decision State
    const [editingDecision, setEditingDecision] = useState<DesignDecision | null>(null);
    const [editForm, setEditForm] = useState({ title: '', content: '', rationale: '' });
    const [isUpdatingDecision, setIsUpdatingDecision] = useState(false);

    // Helper to check management permissions
    const canManageDecision = (decision: DesignDecision) => {
        if (!project || !user) return false;
        // Project Owner always has access
        if (project.owner_id === user.id) return true;

        // Creator can manage if Proposed/Rejected
        if (['proposed', 'rejected'].includes(decision.status)) {
            return decision.created_by_id === user.id;
        }

        // PM can manage Approved/Superseded if allowed
        if (['approved', 'superseded'].includes(decision.status)) {
            const member = project.members.find(m => m.user_id === user.id);
            return member?.role === 'product_manager' && project.allow_pm_manage;
        }

        return false;
    };

    const fetchProject = async () => {
        if (!isAuthenticated || !id) return;

        try {
            const response = await api.get<ProjectWithMembers>(`/projects/${id}`);
            if (response.success && response.data) {
                setProject(response.data);
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to load project');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProjectResources = async () => {
        if (!isAuthenticated || !id) return;
        setLoadingResources(true);
        try {
            const [filesRes, decisionsRes] = await Promise.all([
                api.get<ProjectFile[]>(`/files/project/${id}`),
                api.get<DesignDecision[]>(`/projects/${id}/decisions`)
            ]);

            if (filesRes.success && filesRes.data) setFiles(filesRes.data);
            if (decisionsRes.success && decisionsRes.data) setDecisions(decisionsRes.data);
        } catch (error) {
            console.error("Failed to load project resources", error);
        } finally {
            setLoadingResources(false);
        }
    };

    useEffect(() => {
        fetchProject();
        fetchProjectResources();
    }, [isAuthenticated, id]);

    const handleDelete = async () => {
        if (!project) return;
        setIsDeleting(true);

        try {
            await api.delete(`/projects/${project.id}`);
            router.push('/projects');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            }
            setIsDeleting(false);
            setDeleteConfirm(false);
        }
    };

    const handleUpdateRole = async (memberId: string) => {
        try {
            await api.patch(`/projects/${id}/members/${memberId}`, { role: editRole });
            setEditingMember(null);
            fetchProject();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0 || !id) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', fileList[0]);
        formData.append('project_id', id);

        try {
            await api.upload('/files/upload', formData);
            // Refresh files list
            const filesRes = await api.get<ProjectFile[]>(`/files/project/${id}`);
            if (filesRes.success && filesRes.data) setFiles(filesRes.data);
        } catch (err) {
            console.error('Upload failed:', err);
            // Optional: Set strict error state
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await api.delete(`/files/${fileId}`);
            setFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleCreateDecision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !newDecision.title || !newDecision.content) return;

        setIsCreatingDecision(true);
        try {
            await api.post(`/projects/${id}/decisions`, newDecision);
            setShowDecisionModal(false);
            setNewDecision({ title: '', content: '', rationale: '' });
            // Refresh decisions
            const decisionsRes = await api.get<DesignDecision[]>(`/projects/${id}/decisions`);
            if (decisionsRes.success && decisionsRes.data) setDecisions(decisionsRes.data);
        } catch (err) {
            console.error('Failed to create decision:', err);
            // Optional: set error state
        } finally {
            setIsCreatingDecision(false);
        }
    };

    const handleUpdateDecision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !editingDecision || !editForm.title || !editForm.content) return;

        setIsUpdatingDecision(true);
        try {
            await api.patch(`/projects/${id}/decisions/${editingDecision.id}`, editForm);
            setEditingDecision(null);
            setEditForm({ title: '', content: '', rationale: '' });
            // Refresh decisions
            const decisionsRes = await api.get<DesignDecision[]>(`/projects/${id}/decisions`);
            if (decisionsRes.success && decisionsRes.data) setDecisions(decisionsRes.data);
        } catch (err) {
            console.error('Failed to update decision:', err);
        } finally {
            setIsUpdatingDecision(false);
        }
    };

    const handleDeleteDecision = async (decisionId: string) => {
        if (!confirm('Are you sure you want to delete this decision?')) return;

        try {
            await api.delete(`/projects/${id}/decisions/${decisionId}`);
            setDecisions(prev => prev.filter(d => d.id !== decisionId));
        } catch (err) {
            console.error('Delete decision failed:', err);
            alert('Failed to delete decision: Permission denied');
        }
    };

    const openEditModal = (decision: DesignDecision) => {
        setEditingDecision(decision);
        setEditForm({
            title: decision.title,
            content: decision.content,
            rationale: decision.rationale || ''
        });
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await api.delete(`/projects/${id}/members/${memberId}`);
            setMemberAction(null);
            fetchProject();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            }
        }
    };

    const isOwner = project?.owner_id === user?.id;

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-white/40 text-sm font-black tracking-widest uppercase animate-pulse">Loading Project...</div>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-foreground font-sans">
                <div className="glass-panel border-white/5 rounded-3xl p-12 text-center max-w-md animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-destructive/10 border border-destructive/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <FiAlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Initialization Failed</h1>
                    <p className="text-muted-foreground mb-10 font-medium leading-relaxed">{error}</p>
                    <Link href="/projects" className="inline-block px-8 py-4 bg-white text-black hover:bg-white/90 font-black rounded-2xl shadow-2xl transition-all duration-300 uppercase text-xs tracking-widest active:scale-95">
                        Back to Registry
                    </Link>
                </div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-black text-foreground antialiased font-sans">
            <Header />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Error Toast */}
                {error && project && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
                        <p className="text-red-200 text-sm">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-200 hover:text-white">×</button>
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-muted-foreground">
                    <Link href="/projects" className="hover:text-white transition-colors duration-300">Registry</Link>
                    <span className="opacity-20">/</span>
                    <span className="text-white/40">{project.name}</span>
                </div>

                {/* Project Header */}
                <div className="glass-panel border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/[0.04] transition-all duration-700" />
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">{project.name}</h1>
                            <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl text-[15px]">{project.description || 'No specialized cluster description provided.'}</p>
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                    <FiClock className="w-3.5 h-3.5 text-white/40" />
                                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Constructed {new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        {isOwner && (
                            <div className="flex gap-3 shrink-0">
                                <Link href={`/projects/${project.id}/edit`} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-black text-white rounded-xl transition-all duration-300 flex items-center gap-2 uppercase tracking-widest shadow-xl shadow-white/5">
                                    <FiSettings className="w-4 h-4 opacity-40" />
                                    Settings
                                </Link>
                                <button onClick={() => setDeleteConfirm(true)} className="px-5 py-2.5 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-xs font-black text-destructive rounded-xl transition-all duration-300 flex items-center gap-2 uppercase tracking-widest">
                                    <FiTrash2 className="w-4 h-4" />
                                    Terminate
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Context */}
                {project.context && (
                    <div className="glass-panel border-white/5 rounded-3xl p-8 mb-8">
                        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">Project Context</h2>
                        <p className="text-white/80 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">{project.context}</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Link href={`/chat?project=${project.id}`} className="p-8 glass-card border-white/5 hover:border-white/20 rounded-3xl transition-all duration-500 group flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-2xl">
                            <BsChatDots className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">AI Chat</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ask questions/get AI insights</p>
                        </div>
                    </Link>
                    <Link href="/projects" className="p-8 glass-card border-white/5 hover:border-white/20 rounded-3xl transition-all duration-500 group flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:bg-white/20 transition-all duration-500">
                            <FiGrid className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Project Files</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Back to Projects</p>
                        </div>
                    </Link>
                </div>

                {/* Project Files */}
                <div className="glass-panel border-white/5 rounded-3xl p-8 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Project Files</h2>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Attached Resources</p>
                        </div>
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="px-6 py-2.5 bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isUploading ? <FiRefreshCcw className="animate-spin w-3.5 h-3.5" /> : <FiUpload className="w-3.5 h-3.5" />}
                                Upload File
                            </button>
                        </div>
                    </div>
                    {loadingResources ? (
                        <div className="flex items-center gap-3 text-white/20 py-12 justify-center italic text-xs font-bold uppercase tracking-widest animate-pulse">
                            Loading Files...
                        </div>
                    ) : files.length === 0 ? (
                        <div className="p-16 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] text-center">
                            <FiFile className="w-10 h-10 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest">No Files Uploaded</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-tight">Any files uploaded to this project will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {files.map(file => (
                                <a
                                    key={file.id}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-4 glass-card border-white/5 hover:border-white/20 rounded-2xl transition-all duration-500 group"
                                >
                                    <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black transition-all duration-500">
                                        <FiFile className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-bold text-white truncate group-hover:translate-x-1 transition-transform duration-300">{file.filename}</p>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                            {new Date(file.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    {(isOwner || (user && file.uploaded_by_id === user.id)) && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDeleteFile(file.id);
                                            }}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                                            title="Purge Asset"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Design Decisions */}
                <div className="glass-panel border-white/5 rounded-3xl p-8 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Design Decisions</h2>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">History</p>
                        </div>
                        <button
                            onClick={() => setShowDecisionModal(true)}
                            className="px-6 py-2.5 bg-white text-black hover:bg-white/90 font-black rounded-xl text-[10px] transition-all duration-300 flex items-center gap-2 uppercase tracking-widest active:scale-95 shadow-xl shadow-white/5"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Decision
                        </button>
                    </div>
                    {loadingResources ? (
                        <div className="flex items-center gap-3 text-white/20 py-12 justify-center italic text-xs font-bold uppercase tracking-widest animate-pulse">
                            Loading Decisions...
                        </div>
                    ) : decisions.length === 0 ? (
                        <div className="p-16 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] text-center">
                            <FiCheckCircle className="w-10 h-10 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest">No Decisions Recorded</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-tight">Design decisions will appear here once recorded.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {decisions.map(decision => {
                                const isExpanded = expandedDecisionId === decision.id;
                                return (
                                    <div key={decision.id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                                        <div
                                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-all duration-300"
                                            onClick={() => setExpandedDecisionId(isExpanded ? null : decision.id)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`
                                                    w-1.5 h-10 rounded-full shadow-lg
                                                    ${decision.status === 'approved' ? 'bg-white shadow-white/20' :
                                                        decision.status === 'rejected' ? 'bg-destructive/60' :
                                                            decision.status === 'superseded' ? 'bg-white/10' : 'bg-white/40'}
                                                `} />
                                                <div>
                                                    <h3 className="text-white font-bold text-[15px] tracking-tight">{decision.title}</h3>
                                                    <div className="flex items-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">
                                                        <span className="flex items-center gap-1.5 group-hover:text-white/40 transition-colors">
                                                            <FiClock className="w-3 h-3" />
                                                            {new Date(decision.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="opacity-40">•</span>
                                                        <span>BY: {decision.created_by_name?.split(' ')[0] || 'Unknown'}</span>
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest border
                                                            ${decision.status === 'approved' ? 'bg-white text-black border-white' :
                                                                decision.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                                    decision.status === 'superseded' ? 'bg-white/5 text-muted-foreground border-white/10' : 'bg-white/10 text-white/60 border-white/10'}
                                                        `}>
                                                            {decision.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? <FiChevronDown className="text-gray-400" /> : <FiChevronRight className="text-gray-400" />}
                                                {canManageDecision(decision) && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditModal(decision);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-black/20 rounded-lg transition"
                                                            title="Edit decision"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteDecision(decision.id);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-black/20 rounded-lg transition"
                                                            title="Delete decision"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div className="px-5 pb-5 pl-12 animate-in slide-in-from-top-2 duration-300">
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-[14px] text-white/80 leading-relaxed font-medium">
                                                    <p className="whitespace-pre-wrap">{decision.content}</p>
                                                    {decision.rationale && (
                                                        <div className="mt-6 pt-6 border-t border-white/5">
                                                            <strong className="text-[10px] font-black text-white/20 block mb-3 uppercase tracking-[0.2em]">Rationale</strong>
                                                            <p className="text-[13px] text-white/60">{decision.rationale}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Members */}
                <div className="glass-panel border-white/5 rounded-3xl p-8 mb-24">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Project Members</h2>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Roles & Permissions</p>
                        </div>
                        {isOwner && (
                            <Link href={`/projects/${project.id}/members/add`} className="px-6 py-2.5 bg-white text-black hover:bg-white/90 font-black rounded-xl text-[10px] transition-all duration-300 flex items-center gap-2 uppercase tracking-widest shadow-xl shadow-white/5">
                                <FiPlus className="w-4 h-4" />
                                Add Member
                            </Link>
                        )}
                    </div>

                    {project.members.length === 0 ? (
                        <div className="py-12 text-center text-white/20 italic text-xs font-bold uppercase tracking-widest">
                            No Members Added
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 glass-card border-white/5 rounded-2xl group transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black transition-all duration-500">
                                            <FiUser className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-white tracking-tight">{member.user_full_name || 'Anonymous'}</p>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{member.user_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {editingMember === member.user_id ? (
                                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                                <select
                                                    value={editRole}
                                                    onChange={(e) => setEditRole(e.target.value as Role)}
                                                    className="px-3 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest outline-none focus:ring-1 focus:ring-white/20"
                                                >
                                                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                                        <option key={value} value={value} className="bg-black">{label.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleUpdateRole(member.user_id)} className="px-3 py-1.5 bg-white text-black text-[10px] font-black rounded-lg hover:bg-white/90 transition-all">SAVE</button>
                                                <button onClick={() => setEditingMember(null)} className="px-3 py-1.5 bg-white/5 text-white/60 text-[10px] font-black rounded-lg hover:bg-white/10 transition-all">EXIT</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <span className="px-3 py-1 bg-white/5 border border-white/5 text-[9px] font-black text-white/60 rounded-lg uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all duration-500">
                                                    {ROLE_LABELS[member.role as Role].toUpperCase()}
                                                </span>
                                                {isOwner && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <button onClick={() => { setEditingMember(member.user_id); setEditRole(member.role as Role); }} className="p-2 text-muted-foreground hover:text-white transition-colors" title="Edit Authorization">
                                                            <FiEdit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => setMemberAction({ type: 'remove', memberId: member.user_id })} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Purge Agent">
                                                            <FiUserMinus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


            </main >

            {/* Delete Project Modal */}
            {
                deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 rounded-2xl p-6 border border-white/10 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-white mb-2">Delete Project</h3>
                            <p className="text-gray-300 mb-6">Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(false)} className="flex-1 px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Cancel</button>
                                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition disabled:opacity-50">
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Remove Member Modal */}
            {
                memberAction?.type === 'remove' && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 rounded-2xl p-6 border border-white/10 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-white mb-2">Remove Member</h3>
                            <p className="text-gray-300 mb-6">Are you sure you want to remove this member from the project?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setMemberAction(null)} className="flex-1 px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Cancel</button>
                                <button onClick={() => handleRemoveMember(memberAction.memberId)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition">Remove</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* New Decision Modal */}
            {
                showDecisionModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-300">
                        <div className="glass-panel border-white/5 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in duration-300">
                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Add Decision</h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-[0.2em] mt-1">Add a new design decision to the project history.</p>
                            </div>
                            <form onSubmit={handleCreateDecision} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Title</label>
                                        <input
                                            type="text"
                                            value={newDecision.title}
                                            onChange={e => setNewDecision({ ...newDecision, title: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium placeholder:text-white/5"
                                            placeholder="System Component / Objective"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Decision Details</label>
                                        <textarea
                                            value={newDecision.content}
                                            onChange={e => setNewDecision({ ...newDecision, content: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium placeholder:text-white/5 h-32 resize-none"
                                            placeholder="Define the primary decision parameters..."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Rationale</label>
                                        <textarea
                                            value={newDecision.rationale}
                                            onChange={e => setNewDecision({ ...newDecision, rationale: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium placeholder:text-white/5 h-24 resize-none"
                                            placeholder="Engineering tradeoffs and justification..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowDecisionModal(false)} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest">
                                        Abort
                                    </button>
                                    <button type="submit" disabled={isCreatingDecision} className="flex-1 px-6 py-4 bg-white text-black hover:bg-white/90 font-black rounded-2xl transition-all duration-300 disabled:opacity-50 uppercase text-[10px] tracking-widest shadow-2xl shadow-white/5">
                                        {isCreatingDecision ? 'SAVING...' : 'ADD DECISION'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Decision Modal */}
            {editingDecision && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="glass-panel border-white/5 rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Edit Decision</h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-[0.2em] mt-1">Refining Architectural Context</p>
                        </div>
                        <form onSubmit={handleUpdateDecision} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Specification</label>
                                    <textarea
                                        value={editForm.content}
                                        onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium h-32 resize-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Rationale</label>
                                    <textarea
                                        value={editForm.rationale}
                                        onChange={e => setEditForm({ ...editForm, rationale: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium h-24 resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setEditingDecision(null)} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isUpdatingDecision} className="flex-1 px-6 py-4 bg-white text-black hover:bg-white/90 font-black rounded-2xl transition-all duration-300 disabled:opacity-50 uppercase text-[10px] tracking-widest shadow-xl shadow-white/5">
                                    {isUpdatingDecision ? 'SYNCING...' : 'COMMIT CHANGES'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}
