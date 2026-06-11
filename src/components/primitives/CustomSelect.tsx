import { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CustomSelect({ options, value, onChange, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  return (
    <div className="custom-select" ref={ref}>
      <button
        className="custom-select__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={selectedOption ? 'custom-select__value' : 'custom-select__placeholder'}>
          {selectedOption?.label ?? placeholder ?? ''}
        </span>
        <svg
          className={`custom-select__chevron ${isOpen ? 'custom-select__chevron--open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="custom-select__dropdown">
          {options.map((option) => (
            <button
              key={option.value}
              className={`custom-select__option ${option.value === value ? 'custom-select__option--selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
