'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import Image from 'next/image';
import { HiInformationCircle, HiPaperAirplane, HiVolumeUp, HiCake, HiTranslate, HiChat, HiLockClosed, HiUserGroup, HiPlus, HiX, HiCheck } from 'react-icons/hi';
import { Memora } from '@/types/memora';
import { useSideMenu } from '@/contexts/SideMenuContext';
import apiClient from '@/lib/apiClient';
import debounce from 'lodash/debounce';

interface ChatMessage {
  content: string;
  memora_id: number;
  id: string;
  response: string;
  timestamp: string;
  sent_by_id: string;
  video_url?: string;
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  picture?: string;
  is_active: boolean;
} 

const MemoraPage = () => {
  const { id } = useParams();
  const { user, error } = useUser();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{
    id: string;
    content: string;
    sender: 'user' | 'memora';
    timestamp: Date;
  }[]>([]);
  const { isCollapsed } = useSideMenu();
  const [memora, setMemora] = useState<Memora | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sharedUsers, setSharedUsers] = useState<{
    id: string;
    name: string;
    email: string;
    picture?: string;
    is_active: boolean;
  }[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length >= 3) {
        setIsSearching(true);
        try {
          const response = await apiClient.get<UserSearchResult[]>('/users', {
            params: { name: term }
          });
          // Filter out users who are already shared with
          const filteredResults = response.data.filter(
            user => !sharedUsers.some(shared => shared.id === user.id)
          );
          setSearchResults(filteredResults);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300),
    [sharedUsers]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [memoraResponse, messagesResponse] = await Promise.all([
          apiClient.get<Memora>(`/memora/${id}`),
          apiClient.get<ChatMessage[]>(`/memora/messages/${id}`)
        ]);

        setMemora(memoraResponse.data);

        // If the memora belongs to the current user, fetch shared users
        if (memoraResponse.data.user_id === user?.sub) {
          const sharedUsersResponse = await apiClient.get(`/memora/${id}/shared-with`);
          setSharedUsers(sharedUsersResponse.data);
        }

        const formattedMessages = messagesResponse.data.flatMap((chatMessage) => [
          {
            id: `${chatMessage.id}-user`,
            content: chatMessage.content,
            sender: 'user',
            timestamp: new Date(chatMessage.timestamp)
          },
          {
            id: `${chatMessage.id}-memora`,
            content: chatMessage.response,
            sender: 'memora',
            timestamp: new Date(chatMessage.timestamp)
          }
        ]);

        // Initialize video URLs if they exist
        const initialVideoUrls: Record<string, string> = {};
        messagesResponse.data.forEach((message) => {
          if (message.video_url) {
            initialVideoUrls[`${message.id}-memora`] = message.video_url;
          }
        });
        setVideoUrls(initialVideoUrls);

        setMessages(formattedMessages as { id: string; content: string; sender: "user" | "memora"; timestamp: Date; }[]);
        // Scroll to bottom after messages are loaded
        setTimeout(scrollToBottom, 100); // Small delay to ensure messages are rendered
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, user]);

  // Add effect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !id) return;

    // Add user message immediately for better UX
    const tempUserMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    
    // Add temporary loading message
    const tempLoadingMessage = {
      id: `${tempUserMessage.id}-loading`,
      content: '...',
      sender: 'memora' as const,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, tempUserMessage, tempLoadingMessage]);
    setMessage('');
    setIsResponseLoading(true);

    try {
      // Send message to API
      const response = await apiClient.post<ChatMessage>('/memora/messages/', {
        content: message,
        memora_id: Number(id)
      });

      // Update messages with both user message and memora response
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserMessage.id && msg.id !== tempLoadingMessage.id), // Remove temporary messages
        {
          id: `${response.data.id}-user`,
          content: response.data.content,
          sender: 'user',
          timestamp: new Date(response.data.timestamp)
        },
        {
          id: `${response.data.id}-memora`,
          content: response.data.response,
          sender: 'memora',
          timestamp: new Date(response.data.timestamp)
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temporary messages if there's an error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id && msg.id !== tempLoadingMessage.id));
      // You might want to show an error message to the user here
    } finally {
      setIsResponseLoading(false);
    }
  };

  const listenAudio = async (messageId: string) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Extract the numeric ID from the message ID (removing the '-memora' suffix)
      const messageIdWithoutSuffix = messageId.replace('-memora', '');
      
      // Fetch audio using apiClient
      const response = await apiClient.get(`/memora/messages/${messageIdWithoutSuffix}/audio`, {
        responseType: 'blob'
      });
      
      // Create blob URL from the response
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create audio element and set source
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      setIsPlaying(messageId);
      
      audio.onended = () => {
        setIsPlaying(null);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl); // Clean up blob URL
      };

      audio.onerror = () => {
        setIsPlaying(null);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl); // Clean up blob URL
        console.error('Error playing audio');
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(null);
    }
  };

  const getVideo = async (messageId: string) => {
    try {
      // Extract the numeric ID from the message ID (removing the '-memora' suffix)
      const messageIdWithoutSuffix = messageId.replace('-memora', '');
      
      setIsVideoProcessing(messageId);
      
      // Fetch video URL using apiClient
      const videoUrl = await apiClient.get(`/memora/messages/${messageIdWithoutSuffix}/video`);
      
      // Store the video URL in state
      setVideoUrls(prev => ({
        ...prev,
        [messageId]: videoUrl.data
      }));
    } catch (error) {
      console.error('Error getting video:', error);
    } finally {
      setIsVideoProcessing(null);
    }
  };

  const handleShare = async () => {
    // TODO: Implement the share endpoint call
    setIsShareModalOpen(false);
    setSelectedUsers([]);
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <main className={`h-[calc(100vh-4rem)] transition-all duration-300 ${
        isCollapsed ? '-ml-[15rem]' : '-ml-0'
      }`}>
        <div className="flex h-full items-center justify-center">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      </main>
    );
  }

  if (!memora) {
    return (
      <main className={`h-[calc(100vh-4rem)] transition-all duration-300 ${
        isCollapsed ? '-ml-[15rem]' : '-ml-0'
      }`}>
        <div className="flex h-full items-center justify-center">
          <div className="text-neutral-dark">Memora not found</div>
        </div>
      </main>
    );
  }

  return (
    <main className={`h-screen flex flex-col transition-all duration-300 pt-16 ${
      isCollapsed ? 'ml-16' : 'ml-64'
    }`}>
      <div className="flex h-full overflow-hidden">
        {/* Main Chat Section */}
        <div className="flex-1 flex flex-col bg-neutral-light">
          {/* Chat Header */}
          <div className="border-b border-secondary-light p-4 pl-10 pr-10">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src={memora.profile_picture_base64 ? `data:image/jpeg;base64,${memora.profile_picture_base64}` : `https://i.pravatar.cc/150?u=${encodeURIComponent(memora.full_name)}`}
                  alt={memora.full_name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <h1 className="font-semibold text-primary">{memora.full_name}</h1>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-2xl p-3 ${
                  msg.sender === 'user'
                    ? 'bg-primary text-neutral-light rounded-tr-none'
                    : 'bg-secondary-light/50 border border-secondary-light rounded-tl-none'
                }`}>
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm">
                      {msg.id.includes('loading') ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-pulse">●</span>
                          <span className="animate-pulse delay-100">●</span>
                          <span className="animate-pulse delay-200">●</span>
                        </span>
                      ) : (
                        <>
                          <span>{msg.content}</span>
                          {videoUrls[msg.id] && (
                            <div className="mt-2">
                              <video 
                                src={videoUrls[msg.id]} 
                                controls 
                                className="rounded-lg w-full"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                        </>
                      )}
                    </p>
                    {msg.sender === 'memora' && !msg.id.includes('loading') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => listenAudio(msg.id)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Listen to response"
                          disabled={isPlaying === msg.id}
                        >
                          <HiVolumeUp className={`w-5 h-5 ${isPlaying === msg.id ? 'animate-pulse' : ''}`} />
                        </button>
                        <button
                          onClick={() => getVideo(msg.id)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Watch video response"
                          disabled={isVideoProcessing === msg.id}
                        >
                          {isVideoProcessing === msg.id ? (
                            <div className="flex items-center gap-1">
                              <span className="animate-pulse text-xs">Processing.. it may take a while</span>
                            </div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs opacity-60 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t border-secondary-light p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-full border border-secondary-light focus:ring-2 focus:ring-primary focus:border-transparent bg-neutral-light"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-2 rounded-full bg-primary text-neutral-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                <HiPaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            </form>
          </div>
        </div>

        {/* Memora Info Sidebar */}
        <div className="w-80 border-l border-secondary-light bg-neutral-light overflow-y-auto">
          {/* Profile Header */}
          <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <div className="relative w-32 h-32">
                <Image
                  src={memora.profile_picture_base64 ? `data:image/jpeg;base64,${memora.profile_picture_base64}` : `https://i.pravatar.cc/150?u=${encodeURIComponent(memora.full_name)}`}
                  alt={memora.full_name}
                  fill
                  className="rounded-full object-cover ring-4 ring-neutral-light shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 pt-20 pb-6">
            {/* Name and Bio */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-primary mb-2">{memora.full_name}</h2>
              <p className="text-sm text-neutral-dark/70">{memora.bio}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {memora.privacy_status && (
                <div className="bg-secondary-light/20 rounded-xl p-3 text-center">
                  <HiLockClosed className="w-5 h-5 text-primary mx-auto mb-1" />
                  <span className="text-xs font-medium text-neutral-dark/70">
                    {memora.privacy_status === 'public' ? 'Public Memora' : 'Private Memora'}
                  </span>
                </div>
              )}
              {memora.language && (
                <div className="bg-secondary-light/20 rounded-xl p-3 text-center">
                  <HiTranslate className="w-5 h-5 text-primary mx-auto mb-1" />
                  <span className="text-xs font-medium text-neutral-dark/70">
                    {memora.language}
                  </span>
                </div>
              )}
              {memora.user_id === user?.sub && (
                <div className="col-span-2 bg-secondary-light/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2 justify-between">
                    <div className="flex items-center gap-2">
                      <HiUserGroup className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-neutral-dark/70">Shared With</span>
                    </div>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="p-1 rounded-full hover:bg-secondary-light/30 transition-colors"
                      title="Share with more users"
                    >
                      <HiPlus className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                  {sharedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {sharedUsers.map((user) => (
                        <div key={user.id} className="relative w-6 h-6" title={user.name}>
                          <Image
                            src={user.picture || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`}
                            alt={user.name}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-dark/70 text-center">
                      Not shared with anyone yet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Details List */}
            <div className="space-y-6">
              {/* Personality Section */}
              {memora.speak_pattern && (
                <div className="bg-neutral-light rounded-xl p-4 border border-secondary-light/50">
                  <div className="flex items-center gap-2 mb-2">
                    <HiChat className="w-5 h-5 text-primary" />
                    <h3 className="font-medium text-primary text-sm">Personality</h3>
                  </div>
                  <p className="text-sm text-neutral-dark/70 pl-7">
                    {memora.speak_pattern}
                  </p>
                </div>
              )}

              {/* Birthday Section */}
              {memora.birthday && (
                <div className="bg-neutral-light rounded-xl p-4 border border-secondary-light/50">
                  <div className="flex items-center gap-2 mb-2">
                    <HiCake className="w-5 h-5 text-primary" />
                    <h3 className="font-medium text-primary text-sm">Birthday</h3>
                  </div>
                  <p className="text-sm text-neutral-dark/70 pl-7">
                    {new Date(memora.birthday).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* About Section */}
              {memora.description && (
                <div className="bg-neutral-light rounded-xl p-4 border border-secondary-light/50">
                  <div className="flex items-center gap-2 mb-2">
                    <HiInformationCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-medium text-primary text-sm">About</h3>
                  </div>
                  <p className="text-sm text-neutral-dark/70 pl-7 leading-relaxed">
                    {memora.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-light rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary">Share Memora</h3>
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setSelectedUsers([]);
                  setSearchTerm('');
                }}
                className="p-1 rounded-full hover:bg-secondary-light/30 transition-colors"
              >
                <HiX className="w-5 h-5 text-neutral-dark" />
              </button>
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name..."
              className="w-full px-4 py-2 rounded-lg border border-secondary-light focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
            />

            <div className="mb-4">
              <div className="text-sm font-medium text-neutral-dark mb-2">Selected Users:</div>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 bg-secondary-light/20 rounded-full px-3 py-1"
                  >
                    <div className="relative w-6 h-6">
                      <Image
                        src={user.picture || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`}
                        alt={user.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <span className="text-sm">{user.name}</span>
                    <button
                      onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                      className="p-1 rounded-full hover:bg-secondary-light/30 transition-colors"
                    >
                      <HiX className="w-4 h-4 text-neutral-dark" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto mb-4">
              {isSearching ? (
                <div className="text-center py-4">
                  <div className="animate-pulse text-neutral-dark">Searching...</div>
                </div>
              ) : searchTerm.length < 3 ? (
                <div className="text-center py-4 text-neutral-dark/70">
                  Type at least 3 characters to search
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-4 text-neutral-dark/70">
                  No users found
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-secondary-light/20 rounded-lg cursor-pointer"
                      onClick={() => {
                        if (!selectedUsers.some(u => u.id === user.id)) {
                          setSelectedUsers(prev => [...prev, user]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8">
                          <Image
                            src={user.picture || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`}
                            alt={user.name}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-neutral-dark/70">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {selectedUsers.some(u => u.id === user.id) && (
                          <HiCheck className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setSelectedUsers([]);
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-lg border border-secondary-light hover:bg-secondary-light/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 rounded-lg bg-primary text-neutral-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MemoraPage; 