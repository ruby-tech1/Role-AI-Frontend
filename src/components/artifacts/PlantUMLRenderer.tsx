import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiMaximize2, FiMinimize2, FiZoomIn, FiZoomOut, FiDownload, FiX } from 'react-icons/fi';

/**
 * PlantUML text encoding using deflate compression.
 * Follows the official PlantUML encoding spec:
 * https://plantuml.com/text-encoding
 */
function encodePlantUML(source: string): string {
    // Convert string to UTF-8 byte array
    const encoder = new TextEncoder();
    const data = encoder.encode(source);

    // Deflate compress using CompressionStream API
    // Fallback: use the hex encoding approach if CompressionStream is unavailable
    // For simplicity and broad compatibility, use the PlantUML hex encoding (~h prefix)
    const hex = Array.from(data)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return '~h' + hex;
}

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

interface PlantUMLRendererProps {
    chart: string;
}

export default function PlantUMLRenderer({ chart }: PlantUMLRendererProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (!chart) return;

        const cleanedChart = chart.trim().replace(/\r\n/g, '\n');

        // Ensure the chart has @startuml / @enduml wrapper
        let fullChart = cleanedChart;
        if (!fullChart.startsWith('@startuml')) {
            fullChart = `@startuml\n${fullChart}\n@enduml`;
        }

        setIsLoading(true);
        setError(null);

        const encoded = encodePlantUML(fullChart);
        const url = `${PLANTUML_SERVER}/svg/${encoded}`;

        fetch(url)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`PlantUML server returned ${res.status}`);
                }
                return res.text();
            })
            .then((svgText) => {
                setSvg(svgText);
                setIsLoading(false);
            })
            .catch((err: unknown) => {
                console.error('PlantUML rendering error:', err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(errorMessage);
                setSvg('');
                setIsLoading(false);
            });
    }, [chart]);

    const handleZoomIn = useCallback(() => {
        setZoom((prev) => Math.min(prev + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
    }, []);

    const handleDownload = useCallback(
        (format: 'svg' | 'png') => {
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
                const svgElement = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                const svgWidth = parseInt(svgElement.getAttribute('width') || '800');
                const svgHeight = parseInt(svgElement.getAttribute('height') || '600');

                canvas.width = svgWidth * 2;
                canvas.height = svgHeight * 2;

                const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                const blobUrl = URL.createObjectURL(svgBlob);

                img.onload = () => {
                    if (ctx) {
                        ctx.fillStyle = '#1e293b';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const pngUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = pngUrl;
                                a.download = 'diagram.png';
                                a.click();
                                URL.revokeObjectURL(pngUrl);
                            }
                        }, 'image/png');
                    }
                    URL.revokeObjectURL(blobUrl);
                };
                img.src = blobUrl;
            }
        },
        [svg]
    );

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((prev) => !prev);
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
                <div className="text-red-400 text-sm font-medium mb-2">Failed to render PlantUML diagram</div>
                <div className="text-red-300/70 text-xs font-mono">{error}</div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-slate-900/50 rounded-lg p-8 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-medium">Rendering PlantUML diagram...</span>
                </div>
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
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
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
                    <span className="text-sm text-gray-400">PlantUML Diagram Viewer</span>
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
        <div className="plantuml-wrapper bg-slate-900/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b border-white/10 bg-white/5">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider pl-2">PlantUML</span>
                {controls}
            </div>
            <div className="p-4 overflow-auto max-h-[500px]" ref={ref}>
                {diagramContent}
            </div>
        </div>
    );
}
