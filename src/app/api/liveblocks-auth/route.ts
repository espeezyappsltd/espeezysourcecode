import { Liveblocks } from "@liveblocks/node";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

export async function POST(request: Request) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) return new NextResponse("Liveblocks secret not configured", { status: 500 });

  const liveblocks = new Liveblocks({ secret });
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized: Missing token", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) {
      return new NextResponse("Service unavailable (build time)", { status: 503 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get group members/profile to confirm access
    const profileDoc = await adminDb.collection('profiles').doc(userId).get();
    const profile = profileDoc.data();

    const { room } = await request.json();

    // Security: Only allow users to join their assigned group room or a dynamic quiz/skirmish room
    if (room && !room.startsWith('quiz_') && !room.startsWith('skirmish_') && profile?.group_id !== room) {
      return new NextResponse("Forbidden: Not in this group", { status: 403 });
    }

    // Prepare session
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: profile?.full_name || decodedToken.email || 'Anonymous',
        avatar: profile?.avatar_url || '',
      },
    });

    // Provide full access to the requested room if it's their group room
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    } else {
      session.allow("*", session.FULL_ACCESS);
    }

    const { body, status } = await session.authorize();
    return new NextResponse(body, { status });
  } catch (error) {
    console.error("Liveblocks Auth Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
