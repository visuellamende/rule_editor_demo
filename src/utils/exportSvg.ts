import { toPng } from 'html-to-image';

export async function exportCanvasAsSvg(
  mapName: string,
): Promise<void> {
  const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
  if (!reactFlowElement) {
    console.error('React Flow Element nicht gefunden');
    return;
  }

  const viewport = reactFlowElement.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewport) {
    console.error('React Flow Viewport nicht gefunden');
    return;
  }

  try {
    const rfBounds = reactFlowElement.getBoundingClientRect();
    const width = rfBounds.width;
    const height = rfBounds.height;

    // 1. Hintergrundfarbe ermitteln
    const backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg-base')
      .trim() || '#121214';

    // 2. Viewport Transform auslesen (z.B. matrix(...))
    const viewportStyle = window.getComputedStyle(viewport);
    const viewportTransform = viewportStyle.transform !== 'none' ? viewportStyle.transform : 'matrix(1, 0, 0, 1, 0, 0)';

    // 3. SVG-Defs (Arrow-Marker) klonen und inlinen
    let defsContent = '';
    const defsElement = reactFlowElement.querySelector('.react-flow__edges defs');
    if (defsElement) {
      const clonedDefs = defsElement.cloneNode(true) as HTMLElement;
      clonedDefs.querySelectorAll('path, polygon, polyline, marker').forEach((el) => {
        const style = window.getComputedStyle(el);
        const fill = style.fill;
        const stroke = style.stroke;
        if (fill && fill !== 'none') el.setAttribute('fill', fill);
        if (stroke && stroke !== 'none') el.setAttribute('stroke', stroke);
      });
      defsContent = clonedDefs.outerHTML;
    }

    // 4. Edges extrahieren und inlinen
    let edgeSvgContent = '';
    const edgeGroups = reactFlowElement.querySelectorAll('.react-flow__edge');
    edgeGroups.forEach((edge) => {
      const paths = edge.querySelectorAll('path');
      paths.forEach((path) => {
        const d = path.getAttribute('d');
        const style = window.getComputedStyle(path);
        const stroke = style.stroke || '#71717a';
        const strokeWidth = style.strokeWidth || '1.5';
        const markerEnd = path.getAttribute('marker-end') || '';
        if (d) {
          edgeSvgContent += `    <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" ${markerEnd ? `marker-end="${markerEnd}"` : ''}/>\n`;
        }
      });
    });

    // 5. Edge-Labels extrahieren
    let edgeLabelContent = '';
    const edgeLabels = viewport.querySelectorAll('.react-flow__edgelabel-renderer .labeled-edge__label-wrapper');
    edgeLabels.forEach((labelEl) => {
      const htmlEl = labelEl as HTMLElement;
      const transform = htmlEl.style.transform;
      const matches = [...transform.matchAll(/translate\(([^)]+)\)/g)];
      if (matches.length > 0) {
        const lastTranslate = matches[matches.length - 1][1];
        const parts = lastTranslate.split(',');
        if (parts.length >= 2) {
          const x = parseFloat(parts[0]);
          const y = parseFloat(parts[1]);
          const text = htmlEl.textContent?.trim() || '';
          if (text) {
            const labelInner = htmlEl.querySelector('.labeled-edge__label') as HTMLElement || htmlEl;
            const style = window.getComputedStyle(labelInner);
            const bgColor = style.backgroundColor || 'rgba(18, 18, 20, 0.8)';
            const textColor = style.color || '#a1a1aa';
            const fontSize = style.fontSize || '12px';
            const fontFamily = style.fontFamily || 'Inter, sans-serif';
            
            const rectWidth = htmlEl.clientWidth || (text.length * 7 + 16);
            const rectHeight = htmlEl.clientHeight || 24;
            
            edgeLabelContent += `
      <g transform="translate(${x - rectWidth / 2}, ${y - rectHeight / 2})">
        <rect width="${rectWidth}" height="${rectHeight}" rx="4" fill="${bgColor}" />
        <text x="${rectWidth / 2}" y="${rectHeight / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" fill="${textColor}">${text}</text>
      </g>`;
          }
        }
      }
    });

    // 6. Knoten als transparentes PNG via html-to-image rendern
    const nodesDataUrl = await toPng(viewport, {
      backgroundColor: 'transparent',
      filter: (node: HTMLElement) => {
        if (!(node instanceof HTMLElement)) return true;
        if (!node.classList) return true;
        
        // Kanten und sonstige Overlays für das reine Knoten-Bild ausblenden
        if (node.classList.contains('react-flow__edges')) return false;
        if (node.classList.contains('react-flow__edgelabel-renderer')) return false;
        if (node.classList.contains('react-flow__controls')) return false;
        if (node.classList.contains('react-flow__panel')) return false;
        if (node.classList.contains('react-flow__attribution')) return false;
        if (node.classList.contains('react-flow__minimap')) return false;
        if (node.classList.contains('rule-canvas__auto-layout')) return false;
        
        return true;
      },
      pixelRatio: 2,
    });

    // 7. SVG zusammensetzen
    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${defsContent}
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <g transform="${viewportTransform}">
    ${edgeSvgContent}
  </g>
  <image href="${nodesDataUrl}" width="${width}" height="${height}"/>
  <g transform="${viewportTransform}">
    ${edgeLabelContent}
  </g>
</svg>`;

    // 8. Download triggern
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
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
): Promise<void> {
  const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
  if (!reactFlowElement) {
    console.error('React Flow Element nicht gefunden');
    return;
  }

  try {
    const backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg-base')
      .trim() || '#121214';

    const dataUrl = await toPng(reactFlowElement, {
      backgroundColor,
      pixelRatio: 2,
      filter: (node: HTMLElement) => {
        if (!(node instanceof HTMLElement)) return true;
        if (!node.classList) return true;

        if (node.classList.contains('react-flow__controls')) return false;
        if (node.classList.contains('react-flow__panel')) return false;
        if (node.classList.contains('react-flow__attribution')) return false;
        if (node.classList.contains('react-flow__minimap')) return false;
        if (node.classList.contains('rule-canvas__auto-layout')) return false;

        return true;
      },
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${mapName || 'rulemap'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

  } catch (error) {
    console.error('PNG-Export fehlgeschlagen:', error);
  }
}
