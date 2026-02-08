/**
 * TypeScript interfaces for the Role-Aware AI Assistant
 */

// API Response wrapper
export interface APIResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    description: string | null;
    status: string;
}

// User types
export interface User {
    id: string;
    email: string;
    full_name: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

export interface ProfileUpdateRequest {
    email?: string;
    full_name?: string;
}

export interface PasswordChangeRequest {
    current_password: string;
    new_password: string;
}

// Role enum
export type Role =
    | 'product_manager'
    | 'developer'
    | 'qa_engineer'
    | 'security_engineer'
    | 'designer';

export const ROLE_LABELS: Record<Role, string> = {
    product_manager: 'Product Manager',
    developer: 'Developer',
    qa_engineer: 'QA Engineer',
    security_engineer: 'Security Engineer',
    designer: 'Designer',
};

// Project types
export interface Project {
    id: string;
    name: string;
    description: string | null;
    context: string | null;
    owner_id: string;
    allow_pm_manage: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProjectWithMembers extends Project {
    members: ProjectMember[];
}

export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    role: Role;
    joined_at: string;
    user_email?: string;
    user_full_name?: string;
}

export interface CreateProjectRequest {
    name: string;
    description?: string;
    context?: string;
    allow_pm_manage?: boolean;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    context?: string;
    allow_pm_approval?: boolean;
}

export interface AddMemberRequest {
    user_id: string;
    role: Role;
}

export interface UpdateMemberRoleRequest {
    role: Role;
}

export interface ChatRequest {
    message: string;
    role: Role;
    project_id?: string;
    chat_id?: string;
    file_ids?: string[];
}

export interface ChatResponse {
    response: string;
    role: Role;
    chat_id: string;
    tokens_used?: number;
    decision_proposal?: CreateDecisionRequest;
}


export interface ChatSession {
    id: string;
    title: string | null;
    project_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    role: string;
    content: string;
    created_at: string;
    files: { id: string; filename: string; url: string }[];
}

// Design Decision types
export type DecisionStatus = 'proposed' | 'approved' | 'rejected' | 'superseded';

export const DECISION_STATUS_LABELS: Record<DecisionStatus, string> = {
    proposed: 'Proposed',
    approved: 'Approved',
    rejected: 'Rejected',
    superseded: 'Superseded',
};

export interface DesignDecision {
    id: string;
    project_id: string;
    created_by_id: string;
    title: string;
    content: string;
    rationale: string | null;
    status: DecisionStatus;
    approved_by_id: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    // Extended fields from API
    created_by_email?: string;
    created_by_name?: string;
    approved_by_email?: string;
    approved_by_name?: string;
}

export interface CreateDecisionRequest {
    title: string;
    content: string;
    rationale?: string;
}

export interface ProjectFile {
    id: string;
    filename: string;
    url: string;
    uploaded_at: string;
    uploaded_by_id?: string;
}

