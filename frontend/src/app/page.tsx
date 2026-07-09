import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get("remindsync_session")?.value;

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
