import { NextRequest, NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp, getAdminDb } from "@/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, body: notificationBody } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];

    if (tokens.length === 0) {
      return NextResponse.json({ error: "No registered devices for user" }, { status: 400 });
    }

    const message = {
      notification: {
        title: title || "Test Push Notification",
        body: notificationBody || "This is a test push notification from RemindSync!",
      },
      tokens: tokens,
    };

    const adminApp = getAdminApp();
    const response = await getMessaging(adminApp).sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount, 
      failureCount: response.failureCount 
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
