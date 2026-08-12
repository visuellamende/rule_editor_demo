import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n';
import { JSON_SCHEMA_SPEC } from '../../data/jsonSchema';
import { JSON_EXPORT_SPEC } from '../../data/jsonExportSchema';
import { GENERATE_MAP_PROMPT } from '../../data/generatePrompt';
import './AgentOverlay.css';

interface AgentOverlayProps {
  onClose: () => void;
}

export function AgentOverlay({ onClose }: AgentOverlayProps) {
  const { t } = useI18n();
  const [copiedButton, setCopiedButton] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedButton(id);
    setTimeout(() => setCopiedButton(null), 2000);
  };

  return (
    <div className="agent-overlay" ref={overlayRef} onClick={handleBackdropClick}>
      <div className="agent-overlay__panel">
        <div className="agent-overlay__header">
          <h2 className="agent-overlay__title">{t('agent.title')}</h2>
          <button className="agent-overlay__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="agent-overlay__description">
          {t('agent.description')}
        </p>

        <div className="agent-overlay__options">
          {/* JSON-Schema Import */}
          <div className="agent-overlay__option">
            <h3 className="agent-overlay__option-title">{t('agent.schemaImport.title')}</h3>
            <p className="agent-overlay__option-description">{t('agent.schemaImport.description')}</p>
            <button
              className={`agent-overlay__copy-button ${copiedButton === 'schemaImport' ? 'agent-overlay__copy-button--copied' : ''}`}
              onClick={() => handleCopy(JSON_SCHEMA_SPEC, 'schemaImport')}
            >
              {copiedButton === 'schemaImport' ? t('template.copied') : t('agent.schemaImport.copy')}
            </button>
          </div>

          {/* JSON-Schema Export */}
          <div className="agent-overlay__option">
            <h3 className="agent-overlay__option-title">{t('agent.schemaExport.title')}</h3>
            <p className="agent-overlay__option-description">{t('agent.schemaExport.description')}</p>
            <button
              className={`agent-overlay__copy-button ${copiedButton === 'schemaExport' ? 'agent-overlay__copy-button--copied' : ''}`}
              onClick={() => handleCopy(JSON_EXPORT_SPEC, 'schemaExport')}
            >
              {copiedButton === 'schemaExport' ? t('template.copied') : t('agent.schemaExport.copy')}
            </button>
          </div>

          {/* Map generieren */}
          <div className="agent-overlay__option">
            <h3 className="agent-overlay__option-title">{t('agent.generate.title')}</h3>
            <p className="agent-overlay__option-description">{t('agent.generate.description')}</p>
            <button
              className={`agent-overlay__copy-button ${copiedButton === 'generate' ? 'agent-overlay__copy-button--copied' : ''}`}
              onClick={() => handleCopy(GENERATE_MAP_PROMPT, 'generate')}
            >
              {copiedButton === 'generate' ? t('template.copied') : t('agent.generate.copy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

