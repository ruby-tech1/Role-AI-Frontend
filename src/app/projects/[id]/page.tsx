'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api, { ApiError } from '@/lib/api';
import { FiAlertCircle, FiEdit2, FiTrash2, FiPlus, FiUser, FiUserMinus, FiGrid, FiFile, FiCheckCircle, FiClock, FiChevronDown, FiChevronRight, FiUpload, FiSettings } from 'react-icons/fi';
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="flex items-center gap-3 text-white">
                    <FaSpinner className="animate-spin h-8 w-8 text-white/50" />
                    <span className="text-xl">Loading...</span>
                </div>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiAlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <Link href="/projects" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all duration-300">
                        Back to Projects
                    </Link>
                </div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <Link href="/projects" className="hover:text-white transition">Projects</Link>
                    <span>/</span>
                    <span className="text-white">{project.name}</span>
                </div>

                {/* Project Header */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                            <p className="text-gray-300">{project.description || 'No description'}</p>
                            <p className="text-sm text-gray-500 mt-2">Created {new Date(project.created_at).toLocaleDateString()}</p>
                        </div>
                        {isOwner && (
                            <div className="flex gap-2">
                                <Link href={`/projects/${project.id}/edit`} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition flex items-center gap-2">
                                    <FiSettings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <button onClick={() => setDeleteConfirm(true)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg transition flex items-center gap-2">
                                    <FiTrash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Context */}
                {project.context && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-3">Technical Context</h2>
                        <p className="text-gray-300 whitespace-pre-wrap">{project.context}</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Link href={`/chat?project=${project.id}`} className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                            <BsChatDots className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Start Chat</h3>
                            <p className="text-sm text-gray-400">Get AI assistance for this project</p>
                        </div>
                    </Link>
                    <Link href="/projects" className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                            <FiGrid className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">All Projects</h3>
                            <p className="text-sm text-gray-400">View all your projects</p>
                        </div>
                    </Link>
                </div>

                {/* Project Files */}
                {/* Project Files */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Project Files</h2>
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
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {isUploading ? <FaSpinner className="animate-spin" /> : <FiUpload />}
                                Upload
                            </button>
                        </div>
                    </div>
                    {loadingResources ? (
                        <div className="flex items-center gap-2 text-gray-400 py-4">
                            <FaSpinner className="animate-spin" /> Loading files...
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-8 border border-white/5 rounded-xl bg-white/5">
                            <FiFile className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-400">No files uploaded yet.</p>
                            <p className="text-sm text-gray-500 mt-1">Upload files via the Chat interface.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {files.map(file => (
                                <a
                                    key={file.id}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/30 rounded-xl transition group"
                                >
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition">
                                        <FiFile className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate">{file.filename}</p>
                                        <p className="text-xs text-gray-500">{new Date(file.uploaded_at).toLocaleDateString()}</p>
                                    </div>
                                    {(isOwner || (user && file.uploaded_by_id === user.id)) && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDeleteFile(file.id);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-black/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                                            title="Delete file"
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
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Design Decisions</h2>
                        <button
                            onClick={() => setShowDecisionModal(true)}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-sm transition flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            New Decision
                        </button>
                    </div>
                    {loadingResources ? (
                        <div className="flex items-center gap-2 text-gray-400 py-4">
                            <FaSpinner className="animate-spin" /> Loading decisions...
                        </div>
                    ) : decisions.length === 0 ? (
                        <div className="text-center py-8 border border-white/5 rounded-xl bg-white/5">
                            <FiCheckCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-400">No design decisions recorded.</p>
                            <p className="text-sm text-gray-500 mt-1">Propose decisions via the Chat interface.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {decisions.map(decision => {
                                const isExpanded = expandedDecisionId === decision.id;
                                return (
                                    <div key={decision.id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                                            onClick={() => setExpandedDecisionId(isExpanded ? null : decision.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    w-2 h-10 rounded-full 
                                                    ${decision.status === 'approved' ? 'bg-green-500' :
                                                        decision.status === 'rejected' ? 'bg-red-500' :
                                                            decision.status === 'superseded' ? 'bg-gray-500' : 'bg-yellow-500'}
                                                `} />
                                                <div>
                                                    <h3 className="text-white font-medium">{decision.title}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <FiClock className="w-3 h-3" />
                                                            {new Date(decision.created_at).toLocaleDateString()} by {decision.created_by_name || 'Unknown'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide
                                                            ${decision.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                                                decision.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                                                                    decision.status === 'superseded' ? 'bg-gray-500/20 text-gray-300' : 'bg-yellow-500/20 text-yellow-300'}
                                                        `}>
                                                            {decision.status}
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
                                            <div className="px-4 pb-4 pl-10">
                                                <div className="bg-black/20 rounded-lg p-4 text-sm text-gray-300 prose prose-invert max-w-none">
                                                    <p className="whitespace-pre-wrap">{decision.content}</p>
                                                    {decision.rationale && (
                                                        <div className="mt-4 pt-4 border-t border-white/10">
                                                            <strong className="text-gray-400 block mb-1 uppercase text-xs">Rationale</strong>
                                                            <p>{decision.rationale}</p>
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
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Team Members</h2>
                        {isOwner && (
                            <Link href={`/projects/${project.id}/members/add`} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2">
                                <FiPlus className="w-4 h-4" />
                                Add Member
                            </Link>
                        )}
                    </div>

                    {project.members.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">No team members yet</p>
                    ) : (
                        <div className="space-y-3">
                            {project.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                                            <FiUser className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{member.user_full_name || 'Unknown User'}</p>
                                            <p className="text-sm text-gray-400">{member.user_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {editingMember === member.user_id ? (
                                            <>
                                                <select
                                                    value={editRole}
                                                    onChange={(e) => setEditRole(e.target.value as Role)}
                                                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                                >
                                                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                                        <option key={value} value={value} className="bg-slate-800">{label}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleUpdateRole(member.user_id)} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30">Save</button>
                                                <button onClick={() => setEditingMember(null)} className="px-3 py-1 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10">Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                                                    {ROLE_LABELS[member.role as Role]}
                                                </span>
                                                {isOwner && (
                                                    <>
                                                        <button onClick={() => { setEditingMember(member.user_id); setEditRole(member.role as Role); }} className="p-1 text-gray-400 hover:text-white transition" title="Edit role">
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setMemberAction({ type: 'remove', memberId: member.user_id })} className="p-1 text-gray-400 hover:text-red-400 transition" title="Remove member">
                                                            <FiUserMinus className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </>
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
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 rounded-2xl p-6 border border-white/10 max-w-lg w-full mx-4">
                            <h3 className="text-xl font-bold text-white mb-4">Record Design Decision</h3>
                            <form onSubmit={handleCreateDecision}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={newDecision.title}
                                            onChange={e => setNewDecision({ ...newDecision, title: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                            placeholder="e.g. Use PostgreSQL for database"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Content</label>
                                        <textarea
                                            value={newDecision.content}
                                            onChange={e => setNewDecision({ ...newDecision, content: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 h-24"
                                            placeholder="Describe the decision..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Rationale (Optional)</label>
                                        <textarea
                                            value={newDecision.rationale}
                                            onChange={e => setNewDecision({ ...newDecision, rationale: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 h-20"
                                            placeholder="Why was this decision made?"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button type="button" onClick={() => setShowDecisionModal(false)} className="flex-1 px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Cancel</button>
                                    <button type="submit" disabled={isCreatingDecision} className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition disabled:opacity-50">
                                        {isCreatingDecision ? 'Saving...' : 'Save Decision'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Decision Modal */}
            {editingDecision && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl p-6 border border-white/10 max-w-lg w-full mx-4">
                        <h3 className="text-xl font-bold text-white mb-4">Edit Design Decision</h3>
                        <form onSubmit={handleUpdateDecision}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                        placeholder="e.g. Use PostgreSQL for database"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Content</label>
                                    <textarea
                                        value={editForm.content}
                                        onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 h-24"
                                        placeholder="Describe the decision..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Rationale (Optional)</label>
                                    <textarea
                                        value={editForm.rationale}
                                        onChange={e => setEditForm({ ...editForm, rationale: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 h-20"
                                        placeholder="Why was this decision made?"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setEditingDecision(null)} className="flex-1 px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Cancel</button>
                                <button type="submit" disabled={isUpdatingDecision} className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition disabled:opacity-50">
                                    {isUpdatingDecision ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}
