import { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useI18n } from '../../i18n';
import { CustomSelect } from '../primitives/CustomSelect';
import type { RulemapCategory } from '../../types/nodes';
import { exportAsJSON, exportAsMarkdown } from '../../utils/exportRulemap';
import { downloadFile } from '../../services/browserStorage';
import { useReactFlow } from '@xyflow/react';
import { exportCanvasAsSvg, exportCanvasAsPng } from '../../utils/exportSvg';
import { PROMPT_TEMPLATES, type PromptTemplate } from '../../data/promptTemplates';
import { buildPrompt } from '../../utils/buildPrompt';
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
  const { mapMeta, updateMapMeta, nodes } = useCanvasStore();
  const warnings = useCanvasStore((state) => state.validationWarnings);
  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;
  const reactFlowInstance = useReactFlow();
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

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
    // FitView vor dem Export, damit alles sichtbar ist
    try {
      reactFlowInstance.fitView({ padding: 0.2, duration: 0 });
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch {}

    const mapName = useCanvasStore.getState().mapMeta.name;
    await exportCanvasAsSvg(mapName);
  };

  const handleExportPng = async () => {
    // FitView vor dem Export, damit alles sichtbar ist
    try {
      reactFlowInstance.fitView({ padding: 0.2, duration: 0 });
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch {}

    const mapName = useCanvasStore.getState().mapMeta.name;
    await exportCanvasAsPng(mapName);
  };

  const handleCopyTemplate = async (template: PromptTemplate) => {
    const { mapMeta, nodes, edges } = useCanvasStore.getState();
    const jsonExport = exportAsJSON(mapMeta, nodes, edges);
    const fullPrompt = buildPrompt(template, jsonExport);

    await navigator.clipboard.writeText(fullPrompt);

    setCopiedTemplate(template.id);
    setTimeout(() => setCopiedTemplate(null), 2000);
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

      {/* Validation Summary */}
      {warnings.length > 0 ? (
        <div className="map-info-panel__validation">
          <span className="map-info-panel__validation-title">{t('validation.title')}</span>
          {errorCount > 0 && (
            <span className="map-info-panel__validation-errors">
              {errorCount} {t('validation.errors')}
            </span>
          )}
          {warningCount > 0 && (
            <span className="map-info-panel__validation-warnings">
              {warningCount} {t('validation.warnings')}
            </span>
          )}
        </div>
      ) : nodes.length > 0 ? (
        <div className="map-info-panel__validation map-info-panel__validation--ok">
          <span>{t('validation.ok')}</span>
        </div>
      ) : null}

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
          <button
            className="map-info-panel__export-button"
            onClick={handleExportSvg}
            title={t('export.svgFile')}
          >
            {t('export.svgFile')}
          </button>
          <button
            className="map-info-panel__export-button"
            onClick={handleExportPng}
            title={t('export.pngFile')}
          >
            {t('export.pngFile')}
          </button>
        </div>
      </div>

      {/* Prompt Templates Section */}
      <div className="map-info-panel__section">
        <h4 className="map-info-panel__section-title">{t('export.templates')}</h4>
        <div className="map-info-panel__templates">
          {PROMPT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              className={`map-info-panel__template-button ${
                copiedTemplate === template.id ? 'map-info-panel__template-button--copied' : ''
              }`}
              onClick={() => handleCopyTemplate(template)}
              title={t(template.descriptionKey)}
            >
              <TemplateIcon type={template.icon} />
              <span>
                {copiedTemplate === template.id ? t('template.copied') : t(template.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateIcon({ type }: { type: string }) {
  switch (type) {
    case 'code':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'check':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'shield':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'book':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'search':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    default:
      return null;
  }
}
