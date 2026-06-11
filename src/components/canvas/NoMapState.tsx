import { useI18n } from '../../i18n';
import './NoMapState.css';

export function NoMapState() {
  const { t } = useI18n();

  return (
    <div className="no-map-state">
      <p className="no-map-state__text">{t('canvas.noMap')}</p>
      <p className="no-map-state__hint">{t('canvas.noMapHint')}</p>
    </div>
  );
}
