import { toSvg } from 'html-to-image';

export async function exportCanvasAsSvg(
  mapName: string,
): Promise<void> {
  // React Flow Viewport-Element finden
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewport) {
    console.error('React Flow Viewport nicht gefunden');
    return;
  }

  // Das übergeordnete React Flow Element für die Dimensionen
  const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
  if (!reactFlowElement) {
    console.error('React Flow Element nicht gefunden');
    return;
  }

  try {
    // Elemente die nicht im Export erscheinen sollen
    const filter = (node: HTMLElement): boolean => {
      if (!(node instanceof HTMLElement)) return true;
      const classList = node.classList;
      if (!classList) return true;

      // Controls, Panels, Attribution ausblenden
      if (classList.contains('react-flow__controls')) return false;
      if (classList.contains('react-flow__panel')) return false;
      if (classList.contains('react-flow__attribution')) return false;
      if (classList.contains('react-flow__minimap')) return false;
      // Auto-Layout Button ausblenden
      if (classList.contains('rule-canvas__auto-layout')) return false;

      return true;
    };

    // Berechne die Bounding Box aller Knoten
    const nodes = document.querySelectorAll('.react-flow__node');
    if (nodes.length === 0) {
      console.error('Keine Knoten gefunden');
      return;
    }

    const svgDataUrl = await toSvg(reactFlowElement, {
      filter,
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bg-base')
        .trim() || '#1e1e1e',
      style: {
        // Sicherstellen dass alle CSS Custom Properties aufgelöst werden
        width: reactFlowElement.offsetWidth + 'px',
        height: reactFlowElement.offsetHeight + 'px',
      },
      // Qualität
      pixelRatio: 2,
    });

    // Data URL in Blob umwandeln und downloaden
    const response = await fetch(svgDataUrl);
    const blob = await response.blob();
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
