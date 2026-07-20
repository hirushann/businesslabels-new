"use client";

import { useState } from "react";

interface CopyLinkButtonProps {
  url: string;
}

export default function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full h-10 bg-gray-50 rounded-full flex items-center px-4 border border-slate-100 overflow-hidden relative">
      <span className="text-sm text-neutral-500 truncate w-full pr-8">
        {url}
      </span>
      <button
        onClick={handleCopy}
        title="Copy link"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-brand transition-colors duration-200"
      >
        {copied ? (
          /* Checkmark icon */
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L7.5 13.5L15 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          /* Copy icon — strokes inherit currentColor from the button */
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.75 10.05V12.3C12.75 15.3 11.55 16.5 8.55 16.5H5.7C2.7 16.5 1.5 15.3 1.5 12.3V9.45C1.5 6.45 2.7 5.25 5.7 5.25H7.95" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.7492 10.05H10.3492C8.54922 10.05 7.94922 9.45 7.94922 7.65V5.25L12.7492 10.05Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.69922 1.5H11.6992" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.25 3.75C5.25 2.505 6.255 1.5 7.5 1.5H9.465" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.5001 6V10.6425C16.5001 11.805 15.5551 12.75 14.3926 12.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.5 6H14.25C12.5625 6 12 5.4375 12 3.75V1.5L16.5 6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}
