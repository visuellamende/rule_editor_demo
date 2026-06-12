import { toSvg } from 'html-to-image';
import { downloadFile } from '../services/browserStorage';

export async function exportCanvasAsSvg(
  canvasElement: HTMLElement,
  mapName: string,
): Promise<void> {
  try {
    const bgBase = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg-base')
      .trim();

    const svgDataUrl = await toSvg(canvasElement, {
      backgroundColor: bgBase || '#ffffff',
      filter: (node) => {
        const classList = node.classList;
        if (classList) {
          if (classList.contains('react-flow__controls')) return false;
          if (classList.contains('react-flow__panel')) return false;
          if (classList.contains('react-flow__attribution')) return false;
          if (classList.contains('rule-canvas__background')) return false;
          if (classList.contains('react-flow__background')) return false;
          if (classList.contains('rule-canvas__auto-layout')) return false;
        }
        return true;
      },
    });

    const svgString = await (await fetch(svgDataUrl)).text();
    downloadFile(svgString, `${mapName || 'rulemap'}.svg`, 'image/svg+xml;charset=utf-8');
  } catch (error) {
    console.error('SVG-Export fehlgeschlagen:', error);
  }
}
