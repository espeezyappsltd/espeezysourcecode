import { createClient, LiveList, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { Task } from "@/types/database";

const client = createClient({
  authEndpoint: async (room) => {
    // Dynamic import to avoid SSR issues if auth is not available
    const { auth } = await import("./lib/firebase");
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : "";

    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ room }),
    });

    return await response.json();
  },
});

// Presence is used to track ephemeral state like cursors or dragging
export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
};

// Presence is used to track ephemeral state like cursors or dragging
export type Presence = {
  draggingTaskId: string | null;
  userName?: string;
  isTyping?: boolean;
  isThinking?: boolean; // For the "Chill Out" game turn indicator
  lastAction?: string | null;
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: 'multiple_choice' | 'explanation';
  options?: string[];
  correctAnswer: string | number;
  difficulty_multiplier?: number;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar: string;
  }
};

export type QuizScore = {
  userId: string;
  userName: string;
  points: number;
};

// Storage is the persistent, conflict-free state of the room
type Storage = {
  tasks: LiveList<Task>;
  messages: LiveList<ChatMessage>;
  // Chill Out Zone - Quiz State
  quizQuestions: LiveList<QuizQuestion>;
  quizScores: LiveList<QuizScore>;
  quizStatus: 'setup' | 'initializing' | 'playing' | 'results';
  currentQuestionIndex: number;
  activeTurnUserId: string | null;
  gameId: string | null;
  roundStartTime: number;
  timerDuration: number;
  config: LiveObject<{
    difficulty: string;
    mode: string;
  }>;
};

// TODO: Add fallback to Supabase Realtime if Liveblocks is unavailable
// Example: if (liveblocksDown) { useSupabaseRealtime() }
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useStorage,
  useMutation,
  useOthersMapped,
} = createRoomContext<Presence, Storage, UserMeta>(client);
