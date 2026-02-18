import React, { useState, useEffect, useRef } from 'react';

/*
  Autocomplete dropdown with ARIA combobox support, auto-scroll, and unified theming.
  Props:
    options: [{ id, name }]
    value: string
    onChange: (newValue:string) => void
    placeholder?: string
    disabled?: boolean
*/
export default function Autocomplete({ options = [], value, onChange, placeholder = '', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useRef(`ac-listbox-${Math.random().toString(36).slice(2, 7)}`).current;

  const normalized = value?.toLowerCase() || '';
  const filtered = options.filter(o => o.name.toLowerCase().includes(normalized)).slice(0, 50);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setHighlight(0); }, [normalized]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlight];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  function commitSelection(idx) {
    if (filtered[idx]) {
      onChange(filtered[idx].name);
      setOpen(false);
      requestAnimationFrame(() => inputRef.current?.setSelectionRange?.(filtered[idx].name.length, filtered[idx].name.length));
    }
  }

  function handleKeyDown(e) {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(e.key)) { setOpen(true); return; }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlight(h => Math.min(filtered.length - 1, h + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight(h => Math.max(0, h - 1));
        break;
      case 'Enter':
        if (open) { e.preventDefault(); commitSelection(highlight); }
        break;
      case 'Escape':
        setOpen(false);
        break;
      default: break;
    }
  }

  function highlightName(name) {
    if (!normalized) return name;
    const idx = name.toLowerCase().indexOf(normalized);
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <span className="font-semibold" style={{ color: 'rgb(var(--brand))' }}>{name.slice(idx, idx + normalized.length)}</span>
        {name.slice(idx + normalized.length)}
      </>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (value) setOpen(true); }}
        onKeyDown={handleKeyDown}
        className={`input-base ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && filtered[highlight] ? `${listboxId}-${highlight}` : undefined}
        aria-autocomplete="list"
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 mt-1 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-20 animate-fadeIn scrollbar-thin"
          style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
        >
          {filtered.map((opt, idx) => (
            <button
              type="button"
              id={`${listboxId}-${idx}`}
              role="option"
              aria-selected={idx === highlight}
              key={opt.id || opt.name}
              onMouseDown={e => { e.preventDefault(); commitSelection(idx); }}
              onMouseEnter={() => setHighlight(idx)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${idx === highlight ? 'text-white' : ''}`}
              style={idx === highlight ? { backgroundColor: 'rgb(var(--brand))' } : { color: 'rgb(var(--text))' }}
            >
              {highlightName(opt.name)}
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && value && (
        <div className="absolute left-0 right-0 mt-1 rounded-xl shadow-lg z-20 px-4 py-3 text-sm" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--muted))' }}>
          No matches
        </div>
      )}
    </div>
  );
}
