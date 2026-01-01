import { useState } from "react";

const Logo = ({
  className = "w-12 h-12",
  src,
  alt = "logo",
}: {
  className?: string;
  src?: string;
  alt?: string;
}) => {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return <img src={src} alt={alt} className={className} onError={() => setImgError(true)} />;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 10C40 10 30 15 25 25C20 35 20 45 25 50C30 55 40 55 45 50C47 48 48 45 48 42"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M50 10C60 10 70 15 75 25C80 35 80 45 75 50C70 55 60 55 55 50C53 48 52 45 52 42"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="50"
        cy="35"
        rx="22"
        ry="20"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M35 30C35 30 40 35 45 30"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M55 30C55 30 60 35 65 30"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M30 45C30 45 32 42 35 42C38 42 40 45 40 45"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M60 45C60 45 62 42 65 42C68 42 70 45 70 45"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 25 L25 20 M30 28 L27 24 M33 30 L31 27"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M72 25 L75 20 M70 28 L73 24 M67 30 L69 27"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 55 L50 75 M45 70 L50 75 L55 70"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 65 L32 75 M40 68 L38 72"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M62 65 L68 75 M60 68 L62 72"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;
