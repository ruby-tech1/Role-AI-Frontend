import { useState, useRef } from 'react';
import api from '@/lib/api';
import { FiUploadCloud } from 'react-icons/fi';

interface FileUploaderProps {
    projectId: string;
    onUploadComplete: (file?: { id: string; filename: string }) => void;
}

export default function FileUploader({ projectId, onUploadComplete }: FileUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        await uploadFile(files[0]);
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', projectId);

        try {
            const response = await api.upload<{ id: string; filename: string }>('/files/upload', formData);
            if (response.success && response.data) {
                onUploadComplete(response.data);
            } else {
                // Fallback if needed, though success usually means data is there
                onUploadComplete();
            }
        } catch (err) {
            console.error(err);
            setError("Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };


    return (
        <div className="relative group">
            <div className={`p-6 border border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center cursor-pointer
                ${isUploading
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                }`}
            >
                <FiUploadCloud className={`w-8 h-8 ${isUploading ? 'text-white animate-pulse' : 'text-white/20 group-hover:text-white/60 transition-all duration-500'}`} />
                <div className="text-xs text-white/60">
                    <span className="font-black text-white uppercase tracking-widest">Upload Resource</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">PDF • TXT • MD • DOCX</p>
            </div>

            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleFileChange}
                accept=".pdf,.txt,.md,.docx"
                disabled={isUploading}
            />

            {error && <div className="text-[10px] font-bold text-destructive mt-3 text-center uppercase tracking-widest">{error}</div>}
        </div>
    );
}
