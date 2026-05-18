'use client'

import { ClosedChatButton } from './team-chat/ClosedChatButton'
import { TeamChatHeader } from './team-chat/TeamChatHeader'
import { TeamLobby } from './team-chat/TeamLobby'
import { MessageList } from './team-chat/MessageList'
import { ChatInputBar } from './team-chat/ChatInputBar'
import { useTeamChat, type TeamChatProps } from './team-chat/useTeamChat'

export type { TeamChatProps }

export default function TeamChat({ groupId, user }: TeamChatProps) {
  const {
    isOpen,
    messages,
    newMessage,
    loading,
    uploading,
    showLobby,
    groupMembers,
    isSearching,
    chatSearch,
    setChatSearch,
    messagesEndRef,
    isOnline,
    groupedMessages,
    othersTyping,
    teamOnlineCount,
    handleTyping,
    handleSendMessage,
    handleDeleteMessage,
    handleFileUpload,
    openChat,
    closeChat,
    toggleLobby,
    openSearch,
    closeSearch,
    onViewProfile,
  } = useTeamChat({ groupId, user })

  if (!isOpen) {
    return <ClosedChatButton onOpen={openChat} />
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--h-mobile-bottom) + 1rem + env(safe-area-inset-bottom))',
        right: 'min(2rem, 0.5rem)',
        width: 'min(400px, calc(100vw - 1rem))',
        maxHeight: 'calc(var(--vh-dynamic) - var(--h-mobile-bottom) - var(--h-nav) - 2rem)',
        background: 'var(--surface)',
        borderRadius: '24px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 5000,
        overflow: 'hidden',
        animation: 'whatsappIn 0.4s ease-out',
      }}
      className="responsive-chat"
    >
      <TeamChatHeader
        isSearching={isSearching}
        chatSearch={chatSearch}
        onSearchChange={setChatSearch}
        onCloseSearch={closeSearch}
        othersTyping={othersTyping}
        teamOnlineCount={teamOnlineCount}
        showLobby={showLobby}
        onToggleLobby={toggleLobby}
        onOpenSearch={openSearch}
        onClose={closeChat}
      />

      <TeamLobby
        showLobby={showLobby}
        groupMembers={groupMembers}
        userId={user.id}
        onViewProfile={onViewProfile}
      />

      <MessageList
        loading={loading}
        messages={messages}
        groupedMessages={groupedMessages}
        user={user}
        isOnline={isOnline}
        othersTyping={othersTyping}
        onDeleteMessage={handleDeleteMessage}
        messagesEndRef={messagesEndRef}
      />

      <ChatInputBar
        newMessage={newMessage}
        isOnline={isOnline}
        uploading={uploading}
        onTyping={handleTyping}
        onUpload={handleFileUpload}
        onSend={handleSendMessage}
      />

      <style jsx>{`
          @keyframes whatsappIn { 
            from { opacity: 0; transform: translateY(40px) scale(0.9); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .msg-bubble.pending { opacity: 0.65; }
          .chat-viewport::-webkit-scrollbar { display: block; width: 4px; }
          .chat-viewport::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
          .chat-viewport { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
          .typing-dots span { animation: blink 1.4s infinite; opacity: 0; font-size: 1.1rem; margin: 0 0.5px; }
          .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
          .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
          @keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
          @keyframes slideUp { 
            from { opacity: 0; transform: translateY(20px); } 
            to { opacity: 1; transform: translateY(0); } 
          }
          .msg-bubble:hover .delete-btn { opacity: 0.7 !important; }
          .icon-btn:hover { background: var(--border); }
          .chat-toggle:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,0.3); }
          .lobby-card:hover { transform: translateX(5px); border-color: var(--brand) !important; background: var(--surface) !important; }

          @media (min-width: 769px) {
            .chat-toggle {
              bottom: 2rem !important;
              right: 2rem !important;
            }
            .responsive-chat {
              bottom: 2rem !important;
              right: 2rem !important;
              height: min(650px, calc(100vh - 6rem)) !important;
            }
          }
       `}</style>
    </div>
  )
}
