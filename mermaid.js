flowchart LR
  subgraph sg0["Kanban Espeezy User Journey Flow"]
    s1["1. Create your account\nApp: Sign up & onboarding\nPath: /login\nSign up with personal email (free) or verify school email for Premium. Roles: Personal, Student, Educator, Admin."]
    s2["2. Join or create a team\nApp: Welcome onboarding · Settings → Teams\nPath: /settings?tab=workspace\nStart a team or request to join. Team leads approve join requests in chat."]
    s3["3. Run work on the board\nApp: Dashboard\nPath: /\nPlan sprints: tasks, assignees, categories, due dates, with team chat tied to your group."]
    s4["4. Prove who did what\nApp: Activity log · Project Stats\nPath: /analytics\nLogs, stats, and artifacts verify contributions for fair assessments."]
    s5["5. Store work & track impact\nApp: My Assets · Impact\nPath: /assets/impact\nMy Assets stores files/links. Impact Log records marketplace & Hustle events with verification IDs."]
    s6["6. Earn and trade on campus\nApp: Hustle · Resources\nPath: /hustle\nPost/accept Hustle gigs with escrow credits. Buy/sell on Resources with a traceable credit trail."]
    s7["7. Stay in sync with people\nApp: Feed · Teammates\nPath: /network\nJourney feed, roster/network, in-app notifications, and team chat on the board."]
    s8["8. Switch teams in one tap\nApp: Settings → Teams\nPath: /settings?tab=workspace\nSet active team, switch back, or request new — boards stay saved."]
    s9["9. Recharge between sprints\nApp: Break Room · Games · Jukebox\nPath: /chillout\nBreak Room quizzes, Skirmish games, and Jukebox between serious work."]

    s1 --> s2 --> s3 --> s4 --> s5 --> s6 --> s7 --> s8 --> s9
    s2 -. "manage/switch teams" .-> s8
    s3 -. "chat + notifications" .-> s7
    s5 -. "verified credits trail" .-> s6
  end
