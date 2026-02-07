import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiRefreshCcw, FiPlus, FiChevronDown, FiAlertCircle } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
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
    const [newDecision, setNewDecision] = useState<CreateDecisionRequest>({
        title: '',
        content: '',
        rationale: '',
    });

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

        try {
            const response = await api.patch<DesignDecision>(`/projects/${projectId}/decisions/${decisionId}/approve`, {});
            if (response.success) {
                fetchDecisions();
            }
        } catch (error) {
            console.error('Failed to approve decision:', error);
            alert('Failed to approve decision. Ensure you have permission.');
        }
    };

    const handleReject = async (decisionId: string) => {
        if (!confirm('Are you sure you want to reject this decision?')) return;

        try {
            const response = await api.patch<DesignDecision>(`/projects/${projectId}/decisions/${decisionId}/reject`, {});
            if (response.success) {
                fetchDecisions();
            }
        } catch (error) {
            console.error('Failed to reject decision:', error);
            alert('Failed to reject decision. Ensure you have permission.');
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
            case 'approved': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'superseded': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
            default: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'; // proposed
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-white/10 w-80 shrink-0 transition-all">
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-white">Design Decisions</h2>
                <button
                    onClick={fetchDecisions}
                    className="text-gray-400 hover:text-white transition"
                    title="Refresh"
                >
                    <FiRefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Create New Decision Button */}
            <div className="p-4 border-b border-white/10 shrink-0">
                <button
                    onClick={() => setIsCreateOpen(!isCreateOpen)}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 flex items-center justify-center gap-2 transition"
                >
                    <FiPlus className="w-4 h-4" />
                    Propsoe Decision
                </button>
            </div>

            {/* Create Form */}
            {isCreateOpen && (
                <div className="p-4 border-b border-white/10 bg-white/5 shrink-0">
                    <form onSubmit={handleCreateSubmit} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Title"
                            value={newDecision.title}
                            onChange={e => setNewDecision({ ...newDecision, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                            required
                        />
                        <textarea
                            placeholder="Content details..."
                            value={newDecision.content}
                            onChange={e => setNewDecision({ ...newDecision, content: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500 min-h-[80px]"
                            required
                        />
                        <textarea
                            placeholder="Rationale (optional)..."
                            value={newDecision.rationale}
                            onChange={e => setNewDecision({ ...newDecision, rationale: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500 min-h-[60px]"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition flex items-center gap-1"
                            >
                                {isSubmitting && <FaSpinner className="animate-spin w-3 h-3" />}
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="p-2 border-b border-white/10 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
                {(['all', 'proposed', 'approved', 'rejected'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition capitalize
                            ${statusFilter === status
                                ? 'bg-purple-500 text-white border-purple-500'
                                : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Decision List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {decisions.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        No decisions loggged yet.
                    </div>
                ) : (
                    filteredDecisions.map(decision => (
                        <div key={decision.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition group">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(decision.status)}`}>
                                    {decision.status}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    {new Date(decision.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="font-medium text-white text-sm mb-1">{decision.title}</h3>
                            <p className="text-gray-400 text-xs mb-2 line-clamp-3">{decision.content}</p>

                            {decision.rationale && (
                                <div className="bg-black/20 p-2 rounded text-xs text-gray-400 italic mb-2">
                                    "{decision.rationale}"
                                </div>
                            )}

                            <div className="flex justify-between items-end mt-2">
                                <div className="text-[10px] text-gray-500">
                                    By: {decision.created_by_name || 'Unknown'}
                                </div>

                                {canApprove(decision) && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(decision.id)}
                                            className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500 hover:text-white transition"
                                            title="Approve"
                                        >
                                            <FiCheck className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleReject(decision.id)}
                                            className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition"
                                            title="Reject"
                                        >
                                            <FiX className="w-3.5 h-3.5" />
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
