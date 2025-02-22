import React from 'react';
import Image from 'next/image';
import { Memora } from '@/types/memora';
import { useRouter } from 'next/navigation';

export const AgentCard = ({ agent }: { agent: Memora }) => {
  const router = useRouter();

  const handleTalkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/memora/${agent.id}`);
  };

  return (
    <div className="group relative bg-neutral-light rounded-xl shadow-sm border border-secondary-light p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-secondary">
      {/* Decorative gradient background that shows on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-light via-neutral-light to-secondary-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content container */}
      <div className="relative">
        {/* Top section with image and info */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-secondary-light group-hover:ring-secondary transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-10 group-hover:opacity-20 transition-opacity" />
            <Image
              src={agent.profile_picture_base64 ? `data:image/jpeg;base64,${agent.profile_picture_base64}` : `https://i.pravatar.cc/150?u=${encodeURIComponent(agent.full_name)}`}
              alt={agent.full_name}
              fill
              className="object-cover transform group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-dark mb-1 truncate group-hover:text-primary transition-colors">
              {agent.full_name}
            </h3>
            <p 
              className="text-sm text-neutral-dark/70 line-clamp-2 leading-snug group-hover:text-neutral-dark/80 transition-colors cursor-help"
              title={agent.bio || ''}
            >
              {agent.bio || ''}
            </p>
          </div>
        </div>

        {/* Divider with gradient */}
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-secondary-light to-transparent group-hover:via-secondary-hover transition-colors" />

        {/* Bottom section with metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Chat count with pulsing effect */}
            <div className="flex items-center gap-1.5 text-neutral-dark/70 group-hover:text-primary transition-colors">
              <div className="relative">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full group-hover:animate-pulse" />
              </div>
              <span className="text-sm font-medium">
                -
              </span>
            </div>
          </div>

          {/* Start Chat Button with gradient hover */}
          <button 
            onClick={handleTalkClick}
            className="relative px-4 py-1.5 rounded-full text-sm font-medium text-primary hover:text-neutral-light transition-colors duration-300 group-hover:shadow-md"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span>Talk</span>
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </button>
        </div>
      </div>
    </div>
  );
}; 