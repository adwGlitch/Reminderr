import { NextRequest, NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getAdminAuth } from "@/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const logs: string[] = [];
    
    logs.push("Imported adminAuth successfully");
    
    // Test adminAuth operation
    try {
      logs.push("Calling adminAuth.listUsers...");
      const adminAuth = getAdminAuth();
      const listUsersResult = await adminAuth.listUsers(1);
      logs.push(`listUsers succeeded ✓ found ${listUsersResult.users.length} users`);
    } catch (e: any) {
      logs.push(`adminAuth test failed: ${e?.message || String(e)}`);
    }
    
    return NextResponse.json({
      success: true,
      logs,
      existingApps: getApps().map(app => app.name),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || String(error),
    }, { status: 500 });
  }
}
