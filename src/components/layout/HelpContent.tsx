import { useI18n } from '../../i18n';
import './HelpContent.css';

interface HelpContentProps {
  onBack: () => void;
}

export function HelpContent({ onBack }: HelpContentProps) {
  const { t } = useI18n();

  return (
    <div className="help-content">
      <div className="help-content__header">
        <button className="help-content__back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="help-content__title">{t('settings.help')}</h2>
      </div>

      <div className="help-content__body">
        {/* Was ist es */}
        <section className="help-content__section">
          <h3>{t('help.whatIs')}</h3>
          <p>{t('help.whatIsText')}</p>
        </section>

        {/* Wie starte ich */}
        <section className="help-content__section">
          <h3>{t('help.howTo')}</h3>
          <p>{t('help.howToText')}</p>
        </section>

        {/* Knotentypen mit Farbpunkten */}
        <section className="help-content__section">
          <h3>{t('help.nodeTypes')}</h3>
          <div className="help-content__node-types">
            <div className="help-content__node-type">
              <span className="help-content__node-dot help-content__node-dot--decision" />
              <div className="help-content__node-info">
                <span className="help-content__node-name">Decision</span>
                <span className="help-content__node-desc">{t('help.nodeDecision')}</span>
              </div>
            </div>
            <div className="help-content__node-type">
              <span className="help-content__node-dot help-content__node-dot--condition" />
              <div className="help-content__node-info">
                <span className="help-content__node-name">Condition</span>
                <span className="help-content__node-desc">{t('help.nodeCondition')}</span>
              </div>
            </div>
            <div className="help-content__node-type">
              <span className="help-content__node-dot help-content__node-dot--action" />
              <div className="help-content__node-info">
                <span className="help-content__node-name">Action</span>
                <span className="help-content__node-desc">{t('help.nodeAction')}</span>
              </div>
            </div>
            <div className="help-content__node-type">
              <span className="help-content__node-dot help-content__node-dot--consequence" />
              <div className="help-content__node-info">
                <span className="help-content__node-name">Consequence</span>
                <span className="help-content__node-desc">{t('help.nodeConsequence')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Export */}
        <section className="help-content__section">
          <h3>{t('help.export')}</h3>
          <p>{t('help.exportText')}</p>
        </section>

        {/* Datenquellen */}
        <section className="help-content__section">
          <h3>{t('help.inputSource')}</h3>
          <p>{t('help.inputSourceText')}</p>
        </section>

        {/* Regelautorität */}
        <section className="help-content__section">
          <h3>{t('help.knowledgeSources')}</h3>
          <p>{t('help.knowledgeSourcesText')}</p>
        </section>

        {/* Validierung */}
        <section className="help-content__section">
          <h3>{t('help.validation')}</h3>
          <p>{t('help.validationText')}</p>
        </section>

        {/* Prompt-Templates */}
        <section className="help-content__section">
          <h3>{t('help.promptTemplates')}</h3>
          <p>{t('help.promptTemplatesText')}</p>
        </section>

        {/* Tastenkürzel */}
        <section className="help-content__section">
          <h3>{t('help.shortcuts')}</h3>
          <div className="help-content__shortcuts">
            <div className="help-content__shortcut">
              <span className="help-content__shortcut-label">{t('help.undo')}</span>
              <span className="help-content__shortcut-key">⌘ Z</span>
            </div>
            <div className="help-content__shortcut">
              <span className="help-content__shortcut-label">{t('help.redo')}</span>
              <span className="help-content__shortcut-key">⌘ ⇧ Z</span>
            </div>
            <div className="help-content__shortcut">
              <span className="help-content__shortcut-label">{t('help.inlineEdit')}</span>
              <span className="help-content__shortcut-key">{t('help.doubleClick')}</span>
            </div>
            <div className="help-content__shortcut">
              <span className="help-content__shortcut-label">{t('help.delete')}</span>
              <span className="help-content__shortcut-key">⌫</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
