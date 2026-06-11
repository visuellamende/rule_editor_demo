import { useCanvasStore } from '../../store/useCanvasStore';
import { useI18n } from '../../i18n';
import './CanvasHeader.css';

export function CanvasHeader() {
  const { t } = useI18n();
  const mapName = useCanvasStore((state) => state.mapMeta.name);

  return (
    <div className="canvas-header">
      <span className="canvas-header__name">
        {mapName || t('canvas.untitled')}
      </span>
    </div>
  );
}
