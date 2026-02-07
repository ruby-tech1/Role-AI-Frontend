import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext'; // Added useAuth
import { FiFileText, FiTrash2, FiLoader } from 'react-icons/fi'; // Added FiLoader
import { Project, ProjectFile } from '@/types'; // Imported ProjectFile

interface FileListProps {
    projectId: string;
    refreshTrigger: number;
}

export default function FileList({ projectId, refreshTrigger }: FileListProps) {
    const { user } = useAuth(); // Get current user
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false); // State for ownership

    useEffect(() => {
        if (projectId && user) {
            setLoading(true);

            // Fetch files
            const fetchFiles = api.get<ProjectFile[]>(`/files/project/${projectId}`);

            // Fetch project to check ownership
            const fetchProject = api.get<Project>(`/projects/${projectId}`);

            Promise.all([fetchFiles, fetchProject])
                .then(([filesRes, projectRes]) => {
                    if (filesRes.success && filesRes.data) setFiles(filesRes.data);
                    if (projectRes.success && projectRes.data) {
                        setIsOwner(projectRes.data.owner_id === user.id);
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [projectId, refreshTrigger, user]);

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        setDeleting(fileId);
        try {
            await api.delete(`/files/${fileId}`);
            setFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Failed to delete file:', error);
        } finally {
            setDeleting(null);
        }
    };

    if (!projectId) return null;
    // Don't hide if loading initially, show spinner

    return (
        <div className="space-y-2 mt-4 px-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                Project Files
                {loading && <FiLoader className="w-3 h-3 animate-spin text-purple-500" />} {/* Better loader */}
            </h3>
            {files.length === 0 && !loading && (
                <p className="text-xs text-gray-500 italic">No files uploaded.</p>
            )}
            <div className="space-y-1">
                {files.map(file => {
                    const canDelete = isOwner || (user && file.uploaded_by_id === user.id);
                    return (
                        <div key={file.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition group">
                            <FiFileText className="w-4 h-4 text-purple-400 shrink-0" />
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 hover:text-purple-300 transition" title={file.filename}>
                                {file.filename}
                            </a>
                            {canDelete && (
                                <button
                                    onClick={() => handleDelete(file.id)}
                                    disabled={deleting === file.id}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition"
                                    title="Delete file"
                                >
                                    {deleting === file.id ? (
                                        <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                                    ) : (
                                        <FiTrash2 className="w-3 h-3" />
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
