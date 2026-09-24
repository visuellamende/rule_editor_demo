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

/** Schreibt berechnete Linien-Styles inline auf alle SVG-Pfade. Gibt eine Aufräumfunktion zurück. */
function pinSvgStyles(root: HTMLElement): () => void {
  const selector = '.react-flow__edge-path, .react-flow__connection-path, marker path, marker polyline';
  const restore: Array<() => void> = [];

  // Falls <defs> mit Markern außerhalb des Viewports liegen, temporär in den Viewport klonen
  const flowContainer = root.closest('.react-flow') || document;
  const externalDefs = Array.from(flowContainer.querySelectorAll('defs')).filter(
    (defs) => !root.contains(defs),
  );

  externalDefs.forEach((defs) => {
    const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgWrapper.setAttribute('style', 'position: absolute; width: 0; height: 0; pointer-events: none;');
    svgWrapper.appendChild(defs.cloneNode(true));
    root.appendChild(svgWrapper);
    restore.push(() => {
      svgWrapper.remove();
    });
  });

  root.querySelectorAll<SVGElement>(selector).forEach((el) => {
    const computed = getComputedStyle(el);
    const previous = el.getAttribute('style');

    el.style.stroke = computed.stroke;
    el.style.strokeWidth = computed.strokeWidth;
    el.style.strokeDasharray = computed.strokeDasharray;
    el.style.strokeLinecap = computed.strokeLinecap;
    el.style.fill = computed.fill;

    restore.push(() => {
      if (previous === null) el.removeAttribute('style');
      else el.setAttribute('style', previous);
    });
  });

  return () => restore.reverse().forEach((fn) => fn());
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

  const restore = pinSvgStyles(viewportEl);
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
  } finally {
    restore();
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

  const restore = pinSvgStyles(viewportEl);
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
  } finally {
    restore();
  }
}

