'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import { COL_CONFIG, COLUMN_ORDER, MAX_USERS, ROOM_ID } from './config'
import type { AnalyticsEvent, AnalyticsSummary, Card, Column, PresenceUser, Priority, SocketStatus, WsMessage } from './types'
import { toCsvLine } from './utils'

function getUserEmail(user: User) {
  return user.email ?? 'unknown@espeezy.com'
}

function getUserPresence(user: User): PresenceUser {
  return {
    userId: user.id,
    email: getUserEmail(user),
  }
}

export function useKanbanMvp() {
  const redirectToHome = useCallback(() => {
    window.location.href = '/'
  }, [])

  const user = useSupabaseUser({
    requireUser: true,
    onUnauthenticated: redirectToHome,
  })

  const [cards, setCards] = useState<Card[]>([])
  const [newTask, setNewTask] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])
  const [presenceCount, setPresenceCount] = useState(1)
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('connecting')
  const [joinError, setJoinError] = useState('')
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const wsRef = useRef<WebSocket | null>(null)
  const cardCounter = useRef(1)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 30_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_ESPEEZY_WS_URL ?? 'wss://espeezyserver.espeezy.com/ws'
    const ws = new WebSocket(wsUrl)

    wsRef.current = ws
    setSocketStatus('connecting')
    setJoinError('')

    ws.onopen = () => {
      setSocketStatus('open')
      ws.send(JSON.stringify({
        type: 'join',
        roomId: ROOM_ID,
        userId: user.id,
        email: getUserEmail(user),
      } satisfies WsMessage))
      setEvents((prev) => [
        {
          at: Date.now(),
          userId: user.id,
          email: getUserEmail(user),
          action: 'user_joined',
        },
        ...prev,
      ])
    }

    ws.onmessage = (event) => {
      const rawMessage: unknown = JSON.parse(event.data as string)

      if (!rawMessage || typeof rawMessage !== 'object' || !('type' in rawMessage)) {
        return
      }

      const message = rawMessage as WsMessage

      if (message.type === 'sync_state') {
        setCards(message.cards ?? [])
        setEvents(message.events ?? [])
        return
      }

      if (message.type === 'presence') {
        setPresenceCount(message.count)
        if (message.users) {
          setPresenceUsers(message.users)
        }
        if (message.count > MAX_USERS) {
          setJoinError('Room is full. MVP supports up to 10 concurrent users.')
        }
        return
      }

      if (message.type === 'card_created') {
        setCards((prev) => {
          if (prev.some((card) => card.id === message.card.id)) {
            return prev
          }

          return [message.card, ...prev]
        })
        setEvents((prev) => [
          {
            at: message.card.updatedAt,
            userId: message.actor.userId,
            email: message.actor.email,
            action: 'card_created',
            cardId: message.card.id,
          },
          ...prev,
        ])
        return
      }

      if (message.type === 'card_moved') {
        setCards((prev) =>
          prev.map((card) =>
            card.id === message.cardId
              ? { ...card, column: message.column, updatedBy: message.actor.email, updatedAt: message.at }
              : card,
          ),
        )
        setEvents((prev) => [
          {
            at: message.at,
            userId: message.actor.userId,
            email: message.actor.email,
            action: 'card_moved',
            cardId: message.cardId,
            toColumn: message.column,
          },
          ...prev,
        ])
        return
      }

      if (message.type === 'error') {
        setJoinError(message.message)
      }
    }

    ws.onclose = () => {
      setSocketStatus('closed')
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [user])

  const analytics = useMemo<AnalyticsSummary[]>(() => {
    const perUser = new Map<string, AnalyticsSummary>()

    for (const event of events) {
      const current = perUser.get(event.userId) ?? {
        userId: event.userId,
        email: event.email,
        created: 0,
        moved: 0,
        total: 0,
      }

      if (event.action === 'card_created') current.created += 1
      if (event.action === 'card_moved') current.moved += 1
      current.total += 1

      perUser.set(event.userId, current)
    }

    return Array.from(perUser.values()).sort((left, right) => right.total - left.total)
  }, [events])

  const cardsByColumn = useMemo<Record<Column, Card[]>>(
    () => ({
      todo: cards.filter((card) => card.column === 'todo'),
      in_progress: cards.filter((card) => card.column === 'in_progress'),
      done: cards.filter((card) => card.column === 'done'),
    }),
    [cards],
  )

  const totalCards = cards.length
  const donePercent = totalCards > 0 ? Math.round((cardsByColumn.done.length / totalCards) * 100) : 0
  const maxActions = Math.max(...analytics.map((item) => item.total), 1)

  function sendWs(message: WsMessage) {
    const ws = wsRef.current

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false
    }

    ws.send(JSON.stringify(message))
    return true
  }

  function createTask() {
    if (!user || !newTask.trim() || presenceCount > MAX_USERS) {
      return
    }

    const userPresence = getUserPresence(user)
    const card: Card = {
      id: `card-${Date.now()}-${cardCounter.current++}`,
      title: newTask.trim(),
      column: 'todo',
      updatedBy: userPresence.email,
      updatedAt: Date.now(),
      createdBy: userPresence.email,
      priority: newPriority,
    }

    const ok = sendWs({
      type: 'card_created',
      card,
      actor: userPresence,
    })

    if (!ok) {
      return
    }

    setCards((prev) => [card, ...prev])
    setEvents((prev) => [
      {
        at: card.updatedAt,
        userId: userPresence.userId,
        email: userPresence.email,
        action: 'card_created',
        cardId: card.id,
      },
      ...prev,
    ])
    setNewTask('')
  }

  function moveCard(cardId: string, nextColumn: Column) {
    if (!user || presenceCount > MAX_USERS) {
      return
    }

    const at = Date.now()
    const actor = getUserPresence(user)
    const ok = sendWs({
      type: 'card_moved',
      cardId,
      column: nextColumn,
      actor,
      at,
    })

    if (!ok) {
      return
    }

    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, column: nextColumn, updatedBy: actor.email, updatedAt: at }
          : card,
      ),
    )
    setEvents((prev) => [
      {
        at,
        userId: actor.userId,
        email: actor.email,
        action: 'card_moved',
        cardId,
        toColumn: nextColumn,
      },
      ...prev,
    ])
  }

  function downloadReport() {
    const rows = [
      toCsvLine(['user_id', 'email', 'cards_created', 'cards_moved', 'total_actions']),
      ...analytics.map((item) =>
        toCsvLine([
          item.userId,
          item.email,
          String(item.created),
          String(item.moved),
          String(item.total),
        ]),
      ),
    ]

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `kanban-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return {
    analytics,
    cards,
    cardsByColumn,
    createTask,
    currentTime,
    donePercent,
    downloadReport,
    events,
    joinError,
    maxActions,
    moveCard,
    newPriority,
    newTask,
    presenceCount,
    presenceUsers,
    setNewPriority,
    setNewTask,
    socketStatus,
    totalCards,
    user,
    columns: COLUMN_ORDER.map((column) => ({
      key: column,
      config: COL_CONFIG[column],
      cards: cardsByColumn[column],
    })),
  }
}
