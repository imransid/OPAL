interface Props {
  colors: string[];
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  red: '#dc3545',
  blue: '#0d6efd',
  green: '#198754',
  black: '#212529',
  white: '#f8f9fa',
  yellow: '#ffc107',
  orange: '#fd7e14',
  pink: '#d63384',
  purple: '#6f42c1',
  grey: '#6c757d',
  gray: '#6c757d',
  navy: '#001f3f',
  brown: '#795548',
};

function getColorHex(name: string): string {
  const key = name.trim().toLowerCase();
  return COLOR_MAP[key] ?? `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

export default function ProductBadge({ colors, selectedColor, onSelectColor }: Props) {
  const isSelectable = typeof onSelectColor === 'function';
  return (
    <div className="d-flex flex-wrap gap-2 align-items-center">
      {colors.map((color) => {
        const selected = selectedColor != null && selectedColor.trim().toLowerCase() === color.trim().toLowerCase();
        return (
          <span
            key={color}
            role={isSelectable ? 'button' : undefined}
            tabIndex={isSelectable ? 0 : undefined}
            className={`rounded-circle border ${selected ? 'border-dark border-3' : 'border-secondary'}`}
            style={{
              backgroundColor: getColorHex(color),
              width: '1.5rem',
              height: '1.5rem',
              display: 'inline-block',
              cursor: isSelectable ? 'pointer' : undefined,
            }}
            title={color}
            aria-label={color}
            aria-pressed={isSelectable ? selected : undefined}
            onClick={isSelectable ? () => onSelectColor(color) : undefined}
            onKeyDown={isSelectable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectColor(color); } } : undefined}
          />
        );
      })}
    </div>
  );
}

