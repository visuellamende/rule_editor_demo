import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { CustomSelect } from '../primitives/CustomSelect';
import { HelpContent } from './HelpContent';
import './SettingsOverlay.css';

interface SettingsOverlayProps {
  onClose: () => void;
}

const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'retro', label: 'Retro' },
  { value: 'miami', label: 'Miami' },
];

const languageOptions = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

export function SettingsOverlay({ onClose }: SettingsOverlayProps) {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Schließen bei Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Schließen bei Klick auf Backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" ref={overlayRef} onClick={handleBackdropClick}>
      <div className="settings-overlay__panel">
        {showHelp ? (
          <HelpContent onBack={() => setShowHelp(false)} />
        ) : (
          <>
            <div className="settings-overlay__header">
              <h2 className="settings-overlay__title">{t('settings.title')}</h2>
              <button className="settings-overlay__close" onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="settings-overlay__body">
              {/* Theme */}
              <div className="settings-overlay__field">
                <label className="settings-overlay__label">{t('settings.theme')}</label>
                <CustomSelect
                  options={themeOptions}
                  value={theme}
                  onChange={(value) => setTheme(value as any)}
                />
              </div>

              {/* Sprache */}
              <div className="settings-overlay__field">
                <label className="settings-overlay__label">{t('settings.language')}</label>
                <CustomSelect
                  options={languageOptions}
                  value={locale}
                  onChange={(value) => setLocale(value as any)}
                />
              </div>

              <div className="settings-overlay__section">
                <button
                  className="settings-overlay__help-button"
                  onClick={() => setShowHelp(true)}
                >
                  {t('settings.help')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
