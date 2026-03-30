import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';
import { FiMaximize2, FiMinimize2, FiZoomIn, FiZoomOut, FiDownload, FiX } from 'react-icons/fi';

mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
        // Base colors
        primaryColor: '#0ea5e9',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#38bdf8',
        secondaryColor: '#8b5cf6',
        secondaryTextColor: '#f8fafc',
        secondaryBorderColor: '#a78bfa',
        tertiaryColor: '#06b6d4',
        tertiaryTextColor: '#f8fafc',
        tertiaryBorderColor: '#22d3ee',

        // Background
        background: '#0f172a',
        mainBkg: '#1e293b',
        nodeBorder: '#38bdf8',

        // Text
        lineColor: '#94a3b8',
        textColor: '#e2e8f0',

        // Flowchart
        nodeTextColor: '#f8fafc',

        // Sequence diagram
        actorBkg: '#0ea5e9',
        actorBorder: '#38bdf8',
        actorTextColor: '#f8fafc',
        actorLineColor: '#64748b',
        signalColor: '#e2e8f0',
        signalTextColor: '#e2e8f0',
        labelBoxBkgColor: '#1e293b',
        labelBoxBorderColor: '#38bdf8',
        labelTextColor: '#f8fafc',
        loopTextColor: '#f8fafc',
        activationBorderColor: '#38bdf8',
        activationBkgColor: '#1e3a5f',
        sequenceNumberColor: '#f8fafc',

        // Class diagram
        classText: '#f8fafc',

        // ER diagram
        entityBkg: '#1e293b',
        entityTextColor: '#f8fafc',

        // Notes
        noteBkgColor: '#854d0e',
        noteTextColor: '#fef9c3',
        noteBorderColor: '#ca8a04',

        // Edges
        edgeLabelBackground: '#1e293b',

        // Pie chart
        pie1: '#0ea5e9',
        pie2: '#8b5cf6',
        pie3: '#f43f5e',
        pie4: '#10b981',
        pie5: '#f59e0b',
        pie6: '#06b6d4',
        pie7: '#ec4899',
        pie8: '#14b8a6',

        // Gantt
        cScale0: '#0ea5e9',
        cScale1: '#8b5cf6',
        cScale2: '#f43f5e',
        cScale3: '#10b981',
        cScale4: '#f59e0b',

        // Font
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        fontSize: '14px',
    },
});

interface MermaidRendererProps {
    chart: string;
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (chart && ref.current) {
            setError(null);
            const cleanedChart = chart.trim().replace(/\r\n/g, '\n');

            mermaid.render(id, cleanedChart).then((result) => {
                setSvg(result.svg);
            }).catch((err: unknown) => {
                console.error("Mermaid rendering error:", err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(errorMessage);
                setSvg('');
            });
        }
    }, [chart, id]);

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    }, []);

    const handleDownload = useCallback((format: 'svg' | 'png') => {
        if (!svg) return;

        if (format === 'svg') {
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diagram.svg';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const scale = 2;
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;

            // Extract true dimensions from viewBox first, then width/height attributes
            let svgWidth = 800;
            let svgHeight = 600;
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(/[\s,]+/).map(Number);
                if (parts.length === 4 && !parts.some(isNaN)) {
                    svgWidth = parts[2];
                    svgHeight = parts[3];
                }
            } else {
                const w = parseFloat(svgElement.getAttribute('width') || '');
                const h = parseFloat(svgElement.getAttribute('height') || '');
                if (!isNaN(w) && w > 0) svgWidth = w;
                if (!isNaN(h) && h > 0) svgHeight = h;
            }

            // Set explicit pixel dimensions on the SVG so the browser renders it at the right size
            svgElement.setAttribute('width', String(svgWidth));
            svgElement.setAttribute('height', String(svgHeight));
            if (!viewBox) {
                svgElement.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
            }

            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);
            const base64 = btoa(unescape(encodeURIComponent(svgString)));
            const dataUrl = `data:image/svg+xml;base64,${base64}`;

            const canvas = document.createElement('canvas');
            canvas.width = svgWidth * scale;
            canvas.height = svgHeight * scale;
            const ctx = canvas.getContext('2d');

            const img = new Image();
            img.onload = () => {
                if (ctx) {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    try {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const pngUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = pngUrl;
                                a.download = 'diagram.png';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(pngUrl);
                            }
                        }, 'image/png');
                    } catch (e) {
                        console.error('PNG export failed (canvas tainted):', e);
                    }
                }
            };
            img.onerror = () => {
                console.error('Failed to load SVG for PNG export');
            };
            img.src = dataUrl;
        }
    }, [svg]);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
        setZoom(1);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="text-red-400 text-sm font-medium mb-2">Failed to render diagram</div>
                <div className="text-red-300/70 text-xs font-mono">{error}</div>
            </div>
        );
    }

    const diagramContent = (
        <div
            className="overflow-auto"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
            <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
    );

    const controls = (
        <div className="flex items-center gap-1">
            <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Zoom out"
            >
                <FiZoomOut className="w-4 h-4 text-gray-300" />
            </button>
            <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Zoom in"
            >
                <FiZoomIn className="w-4 h-4 text-gray-300" />
            </button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button
                onClick={() => handleDownload('png')}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
                title="Download PNG"
            >
                <FiDownload className="w-4 h-4 text-gray-300" />
            </button>
            <button
                onClick={() => handleDownload('svg')}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs text-gray-300"
                title="Download SVG"
            >
                SVG
            </button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
                {isFullscreen ? (
                    <FiMinimize2 className="w-4 h-4 text-gray-300" />
                ) : (
                    <FiMaximize2 className="w-4 h-4 text-gray-300" />
                )}
            </button>
        </div>
    );

    if (isFullscreen && typeof document !== 'undefined') {
        return createPortal(
            <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <span className="text-sm text-gray-400">Diagram Viewer</span>
                    <div className="flex items-center gap-4">
                        {controls}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                        >
                            <FiX className="w-5 h-5 text-gray-300" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-8" ref={ref}>
                    {diagramContent}
                </div>
            </div>,
            document.body
        );
    }

    return (
        <div className="mermaid-wrapper bg-slate-900/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-end p-2 border-b border-white/10 bg-white/5">
                {controls}
            </div>
            <div className="p-4 overflow-auto max-h-[500px]" ref={ref}>
                {diagramContent}
            </div>
        </div>
    );
}
