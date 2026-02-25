import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiRefreshCcw, FiPlus, FiChevronDown, FiAlertCircle } from 'react-icons/fi';
import { Spinner } from '@/components/common/Loading';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DesignDecision, CreateDecisionRequest, DecisionStatus } from '@/types';

interface DecisionSidebarProps {
    projectId: string;
    initialProposal?: CreateDecisionRequest | null;
    onClearProposal?: () => void;
}

export default function DecisionSidebar({ projectId, initialProposal, onClearProposal }: DecisionSidebarProps) {
    const { user } = useAuth();
    const [decisions, setDecisions] = useState<DesignDecision[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'all'>('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<{ id: string, type: 'approve' | 'reject' } | null>(null);
    const [newDecision, setNewDecision] = useState<CreateDecisionRequest>({
        title: '',
        content: '',
        rationale: '',
    });
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (initialProposal) {
            setNewDecision(initialProposal);
            setIsCreateOpen(true);
        }
    }, [initialProposal]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projectDetails, setProjectDetails] = useState<any>(null); // For permissions check
    const [currentUserMember, setCurrentUserMember] = useState<any>(null); // For permissions check

    useEffect(() => {
        if (projectId) {
            fetchDecisions();
            fetchProjectDetails();
        }
    }, [projectId]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = document.body.clientWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= 800) {
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => setIsResizing(false);

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    const fetchProjectDetails = async () => {
        try {
            // Fetch project details to know owner_id and allow_pm_manage
            const projectResponse = await api.get<any>(`/projects/${projectId}`);
            if (projectResponse.success) {
                setProjectDetails(projectResponse.data);
            }

            // Fetch current user's membership in this project
            // We might need an endpoint for retrieving membership, or list members and find self
            // Backend endpoint: /projects/{project_id}/members
            // But checking self membership is easier if we iterate or have a specific endpoint.
            // Let's assume we can get it from the list for now or if we have a "me" endpoint.
            // Actually, the backend `check_project_access` does this but doesn't expose it directly.
            // We'll fetch all members and find current user.
            const membersResponse = await api.get<any[]>(`/projects/${projectId}/members`);
            if (membersResponse.success && membersResponse.data) {
                const member = membersResponse.data.find((m: any) => m.user_id === user?.id);
                setCurrentUserMember(member);
            }
        } catch (error) {
            console.error('Failed to fetch project details:', error);
        }
    };

    const fetchDecisions = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<DesignDecision[]>(`/projects/${projectId}/decisions`);
            if (response.success && response.data) {
                setDecisions(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch decisions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDecision.title || !newDecision.content) return;

        setIsSubmitting(true);
        try {
            const response = await api.post<DesignDecision>(`/projects/${projectId}/decisions`, newDecision);
            if (response.success) {
                setNewDecision({ title: '', content: '', rationale: '' });
                setIsCreateOpen(false);
                fetchDecisions();
                if (onClearProposal) onClearProposal();
            }
        } catch (error) {
            console.error('Failed to create decision:', error);
            alert('Failed to create decision. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (decisionId: string) => {
        if (!confirm('Are you sure you want to approve this decision? It will be appended to the project context.')) return;

        setActionLoading({ id: decisionId, type: 'approve' });
        try {
            const response = await api.patch<DesignDecision>(`/projects/${projectId}/decisions/${decisionId}/approve`, {});
            if (response.success) {
                await fetchDecisions();
            }
        } catch (error) {
            console.error('Failed to approve decision:', error);
            alert('Failed to approve decision. Ensure you have permission.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (decisionId: string) => {
        if (!confirm('Are you sure you want to reject this decision?')) return;

        setActionLoading({ id: decisionId, type: 'reject' });
        try {
            const response = await api.patch<DesignDecision>(`/projects/${projectId}/decisions/${decisionId}/reject`, {});
            if (response.success) {
                await fetchDecisions();
            }
        } catch (error) {
            console.error('Failed to reject decision:', error);
            alert('Failed to reject decision. Ensure you have permission.');
        } finally {
            setActionLoading(null);
        }
    };

    const canApprove = (decision: DesignDecision) => {
        if (!projectDetails || !user) return false;
        if (decision.status !== 'proposed') return false;

        // Owner can always approve
        if (projectDetails.owner_id === user.id) return true;

        // PM can approve if allowed
        if (projectDetails.allow_pm_manage && currentUserMember?.role === 'product_manager') return true;

        return false;
    };

    const filteredDecisions = statusFilter === 'all'
        ? decisions
        : decisions.filter(d => d.status === statusFilter);

    const getStatusColor = (status: DecisionStatus) => {
        switch (status) {
            case 'approved': return 'bg-white text-black border-white';
            case 'rejected': return 'bg-white/5 text-destructive border-destructive/20';
            case 'superseded': return 'bg-white/5 text-muted-foreground border-white/10';
            default: return 'bg-white/10 text-white/70 border-white/20'; // proposed
        }
    };

    return (
        <div
            style={{ width: sidebarWidth, gridTemplateRows: 'auto auto auto minmax(0, 1fr)' }}
            className={`grid h-full glass-panel border-l border-white/5 shrink-0 relative ${isResizing ? '' : 'transition-all duration-300'}`}
        >
            {/* Custom Left Border Resizer */}
            <div
                className="absolute left-0 top-0 bottom-0 w-[5px] cursor-col-resize hover:bg-white/20 transition-colors z-50"
                onMouseDown={() => setIsResizing(true)}
            />

            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20 relative z-10">
                <h2 className="text-sm font-black text-white uppercase tracking-widest">History</h2>
                <button
                    onClick={fetchDecisions}
                    className="p-1.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300"
                    title="Refresh History"
                >
                    <Spinner size={14} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Create New Decision Button */}
            <div className="p-4 border-b border-white/5 shrink-0 relative z-10">
                <button
                    onClick={() => setIsCreateOpen(!isCreateOpen)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg ${isCreateOpen
                        ? 'bg-white text-black'
                        : 'bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/5'
                        }`}
                >
                    <FiPlus className="w-4 h-4" />
                    Add Decision
                </button>
                {/* Create Form */}
                {isCreateOpen && (
                    <div className="p-5 border-b border-white/5 bg-white/[0.02] shrink-0 animate-in slide-in-from-top duration-300">
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter title..."
                                    value={newDecision.title}
                                    onChange={e => setNewDecision({ ...newDecision, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium placeholder:text-white/10"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Content</label>
                                <textarea
                                    placeholder="Enter details..."
                                    value={newDecision.content}
                                    onChange={e => setNewDecision({ ...newDecision, content: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium placeholder:text-white/10 min-h-[100px] resize-none"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Rationale</label>
                                <textarea
                                    placeholder="Enter rationale..."
                                    value={newDecision.rationale}
                                    onChange={e => setNewDecision({ ...newDecision, rationale: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-[13px] text-white/70 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium placeholder:text-white/10 min-h-[60px] resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 text-[10px] font-black text-muted-foreground hover:text-white uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-white text-black hover:bg-white/90 text-[10px] font-black rounded-lg transition-all duration-300 flex items-center gap-2 uppercase tracking-widest shadow-xl shadow-white/5"
                                >
                                    {isSubmitting && <Spinner size={12} />}
                                    Add Decision
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-white/5 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide bg-black/10">
                {(['all', 'proposed', 'approved', 'rejected'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 text-[9px] font-black rounded-lg border whitespace-nowrap transition-all duration-300 uppercase tracking-widest
                        ${statusFilter === status
                                ? 'bg-white text-black border-white shadow-lg'
                                : 'bg-transparent text-muted-foreground border-white/5 hover:border-white/20 hover:text-white'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Decision List */}
            <div className="overflow-y-auto min-h-0 p-4 space-y-4 pr-2">
                {isLoading && decisions.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Spinner size={24} className="text-muted-foreground/50" />
                    </div>
                ) : decisions.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        No decisions recorded yet.
                    </div>
                ) : (
                    filteredDecisions.map(decision => (
                        <div key={decision.id} className="glass-card border-white/5 rounded-2xl p-4 hover:border-white/20 transition-all duration-500 group animate-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center mb-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black border tracking-[0.15em] ${getStatusColor(decision.status)}`}>
                                    {decision.status.toUpperCase()}
                                </span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {new Date(decision.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>

                            <h3 className="font-bold text-white text-[15px] mb-2 tracking-tight leading-tight">{decision.title}</h3>
                            <p className="text-muted-foreground text-xs mb-4 line-clamp-4 leading-relaxed font-medium">{decision.content}</p>

                            {decision.rationale && (
                                <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl text-xs text-muted-foreground/80 italic font-medium mb-4 relative pl-8">
                                    <span className="absolute left-3 top-2.5 text-xl leading-none text-white/20 font-serif">"</span>
                                    {decision.rationale}
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.03]">
                                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                    BY: {decision.created_by_name?.split(' ')[0] || 'Unknown'}
                                </div>

                                {canApprove(decision) && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(decision.id)}
                                            disabled={actionLoading !== null}
                                            className="p-2 bg-white text-black rounded-lg hover:bg-white/90 transition-all duration-300 shadow-lg shadow-white/5 disabled:opacity-50"
                                            title="Approve"
                                        >
                                            {actionLoading?.id === decision.id && actionLoading.type === 'approve' ? <Spinner size={14} className="text-black" /> : <FiCheck className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => handleReject(decision.id)}
                                            disabled={actionLoading !== null}
                                            className="p-2 glass-card border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all duration-300 disabled:opacity-50"
                                            title="Reject"
                                        >
                                            {actionLoading?.id === decision.id && actionLoading.type === 'reject' ? <Spinner size={14} /> : <FiX className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
