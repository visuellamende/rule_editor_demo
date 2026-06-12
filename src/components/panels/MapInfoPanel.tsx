import { useCanvasStore } from '../../store/useCanvasStore';
import { useI18n } from '../../i18n';
import { CustomSelect } from '../primitives/CustomSelect';
import type { RulemapCategory } from '../../types/nodes';
import { exportAsJSON, exportAsMarkdown } from '../../utils/exportRulemap';
import { downloadFile } from '../../services/browserStorage';
import { useReactFlow } from '@xyflow/react';
import { exportCanvasAsSvg } from '../../utils/exportSvg';
import './MapInfoPanel.css';

const categoryValues: RulemapCategory[] = [
  'validation',
  'permission',
  'state',
  'business-logic',
  'error-handling',
];

export function MapInfoPanel() {
  const { t } = useI18n();
  const { mapMeta, updateMapMeta } = useCanvasStore();
  const reactFlowInstance = useReactFlow();

  const categoryOptions = [
    { value: '', label: t('sidebar.mapCategory.none') },
    ...categoryValues.map((cat) => ({
      value: cat,
      label: t(`category.${cat}` as any),
    })),
  ];

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleExportJSON = () => {
    const { mapMeta, nodes, edges } = useCanvasStore.getState();
    const content = exportAsJSON(mapMeta, nodes, edges);
    downloadFile(content, `${mapMeta.name || 'rulemap'}-export.json`, 'application/json');
  };

  const handleExportMarkdown = () => {
    const { mapMeta, nodes, edges } = useCanvasStore.getState();
    const content = exportAsMarkdown(mapMeta, nodes, edges);
    downloadFile(content, `${mapMeta.name || 'rulemap'}.md`, 'text/markdown');
  };

  const handleCopyJSON = async () => {
    const { mapMeta, nodes, edges } = useCanvasStore.getState();
    const content = exportAsJSON(mapMeta, nodes, edges);
    await navigator.clipboard.writeText(content);
  };

  const handleCopyMarkdown = async () => {
    const { mapMeta, nodes, edges } = useCanvasStore.getState();
    const content = exportAsMarkdown(mapMeta, nodes, edges);
    await navigator.clipboard.writeText(content);
  };

  const handleExportSvg = async () => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 0 });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvasElement = document.querySelector('.react-flow') as HTMLElement;
    if (canvasElement) {
      await exportCanvasAsSvg(canvasElement, mapMeta.name);
    }
  };

  return (
    <div className="map-info-panel">
      {/* Name */}
      <div className="map-info-panel__field">
        <label className="map-info-panel__label">{t('sidebar.mapName')}</label>
        <input
          className="map-info-panel__input"
          type="text"
          value={mapMeta.name}
          onChange={(e) => updateMapMeta({ name: e.target.value })}
          placeholder={t('sidebar.mapName.placeholder')}
        />
      </div>

      {/* Beschreibung */}
      <div className="map-info-panel__field">
        <label className="map-info-panel__label">{t('sidebar.mapDescription')}</label>
        <textarea
          className="map-info-panel__textarea"
          value={mapMeta.description}
          onChange={(e) => updateMapMeta({ description: e.target.value })}
          placeholder={t('sidebar.mapDescription.placeholder')}
          rows={3}
        />
      </div>

      {/* Kategorie */}
      <div className="map-info-panel__field">
        <label className="map-info-panel__label">{t('sidebar.mapCategory')}</label>
        <CustomSelect
          options={categoryOptions}
          value={mapMeta.category ?? ''}
          onChange={(value) => updateMapMeta({ category: (value || null) as RulemapCategory | null })}
        />
      </div>

      {/* Erstellt */}
      <div className="map-info-panel__meta">
        <span className="map-info-panel__meta-label">{t('sidebar.mapCreated')}</span>
        <span className="map-info-panel__meta-value">{formatDate(mapMeta.created)}</span>
      </div>

      {/* Export Section */}
      <div className="map-info-panel__section">
        <h4 className="map-info-panel__section-title">{t('export.title')}</h4>

        <div className="map-info-panel__export-buttons">
          <button
            className="map-info-panel__export-button"
            onClick={handleExportJSON}
            title={t('export.jsonFile')}
          >
            {t('export.jsonFile')}
          </button>
          <button
            className="map-info-panel__export-button"
            onClick={handleCopyJSON}
            title={t('export.jsonCopy')}
          >
            {t('export.jsonCopy')}
          </button>
          <button
            className="map-info-panel__export-button"
            onClick={handleExportMarkdown}
            title={t('export.markdownFile')}
          >
            {t('export.markdownFile')}
          </button>
          <button
            className="map-info-panel__export-button"
            onClick={handleCopyMarkdown}
            title={t('export.markdownCopy')}
          >
            {t('export.markdownCopy')}
          </button>
        </div>

        <button
          className="map-info-panel__export-button map-info-panel__export-button--full"
          onClick={handleExportSvg}
          title={t('export.svgFile')}
        >
          {t('export.svgFile')}
        </button>
      </div>
    </div>
  );
}

