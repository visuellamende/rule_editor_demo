import { useState, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { useCanvasStore } from '../../../store/useCanvasStore';
import './LabeledEdge.css';

export function LabeledEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { edges, updateEdgeData, setSelectedEdgeId } = useCanvasStore();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue((label as string) ?? '');
    setIsEditing(true);
  };

  const handleConfirm = () => {
    updateEdgeData(id, { label: editValue.trim() });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEdgeId(id);
  };

  const siblingEdges = edges.filter((e) => e.source === source);
  const hasSiblings = siblingEdges.length > 1;

  let displayLabel = (label as string) || '';
  let isPlaceholder = false;

  if (!displayLabel && hasSiblings) {
    displayLabel = '?';
    isPlaceholder = true;
  }

  const showLabelRenderer = !!displayLabel || isEditing || selected;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={selected ? 'labeled-edge--selected' : ''}
      />
      {showLabelRenderer && (
        <EdgeLabelRenderer>
          <div
            className={`labeled-edge__label ${selected ? 'labeled-edge__label--selected' : ''} ${!label ? 'labeled-edge__label--empty' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            onDoubleClick={handleDoubleClick}
            onClick={handleClick}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                className="labeled-edge__input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleConfirm}
                onKeyDown={handleKeyDown}
                placeholder={hasSiblings ? '?' : '...'}
              />
            ) : (
              <span className={`labeled-edge__text ${isPlaceholder ? 'labeled-edge__text--placeholder' : ''}`}>
                {displayLabel || '...'}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}


