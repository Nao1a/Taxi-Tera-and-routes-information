import React, { useState, useEffect, useRef } from 'react';

/*
  Generic Autocomplete dropdown (replaces <datalist>) with better styling & keyboard support.
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

  const normalized = value?.toLowerCase() || '';
  const filtered = options.filter(o => o.name.toLowerCase().includes(normalized)).slice(0, 50);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setHighlight(0); }, [normalized]);

  function commitSelection(idx) {
    if (filtered[idx]) {
      onChange(filtered[idx].name);
      setOpen(false);
      // move cursor to end
      requestAnimationFrame(() => inputRef.current?.setSelectionRange?.(filtered[idx].name.length, filtered[idx].name.length));
    }
  }

  function handleKeyDown(e) {
    if (!open && ['ArrowDown','ArrowUp'].includes(e.key)) {
      setOpen(true); return;
    }
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
      default:
        break;
    }
  }

  function highlightName(name) {
    if (!normalized) return name;
    const idx = name.toLowerCase().indexOf(normalized);
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <span className="text-blue-400 font-medium">{name.slice(idx, idx + normalized.length)}</span>
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
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={`w-full p-4 rounded-2xl bg-gray-100 border border-gray-300 text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-20 animate-fadeIn">
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No matches</div>
          )}
          {filtered.map((opt, idx) => (
            <button
              type="button"
              key={opt.id || opt.name}
              onMouseDown={e => { e.preventDefault(); commitSelection(idx); }}
              onMouseEnter={() => setHighlight(idx)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${idx === highlight ? 'bg-blue-600 text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'}`}
            >
              {highlightName(opt.name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
