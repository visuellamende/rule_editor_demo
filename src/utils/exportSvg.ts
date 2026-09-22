import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';

const PADDING = 40;
const MAX_DIMENSION = 8000; // Browser-Limit für Canvas-Größe

function getExportOptions(getNodes: () => Node[]) {
  const nodes = getNodes();
  if (nodes.length === 0) {
    return null;
  }

  const bounds = getNodesBounds(nodes);

  let width = bounds.width + PADDING * 2;
  let height = bounds.height + PADDING * 2;

  // Sehr große Maps proportional verkleinern
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const viewport = getViewportForBounds(bounds, width, height, 0.1, 2, PADDING / width);

  const backgroundColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg-base')
      .trim() || '#121214';

  return {
    backgroundColor,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
    filter: (node: HTMLElement) =>
      !node.classList?.contains('rule-node__add-button') &&
      !node.classList?.contains('react-flow__handle'),
  };
}

export async function exportCanvasAsSvg(
  mapName: string,
  getNodes: () => Node[],
): Promise<void> {
  const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewportEl) {
    console.error('React Flow Viewport nicht gefunden');
    return;
  }

  const options = getExportOptions(getNodes);
  if (!options) {
    console.warn('Keine Knoten zum Exportieren vorhanden');
    return;
  }

  try {
    const dataUrl = await toSvg(viewportEl, options);

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapName || 'rulemap'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('SVG-Export fehlgeschlagen:', error);
  }
}

export async function exportCanvasAsPng(
  mapName: string,
  getNodes: () => Node[],
): Promise<void> {
  const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewportEl) {
    console.error('React Flow Viewport nicht gefunden');
    return;
  }

  const options = getExportOptions(getNodes);
  if (!options) {
    console.warn('Keine Knoten zum Exportieren vorhanden');
    return;
  }

  try {
    const dataUrl = await toPng(viewportEl, { ...options, pixelRatio: 2 });

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapName || 'rulemap'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PNG-Export fehlgeschlagen:', error);
  }
}
