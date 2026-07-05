interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  title?: string;
}

/** Wrapper para os Material Symbols (mesma fonte usada nos mockups). */
export function Icon({ name, className = '', filled = false, title }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      {name}
    </span>
  );
}
