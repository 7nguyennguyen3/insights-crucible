import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const foldersCollectionRef = db.collection(`saas_users/${userId}/folders`);

    // Fetch folders and order them alphabetically by name
    const q = foldersCollectionRef.orderBy("name", "asc");
    const querySnapshot = await q.get();

    const folders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Error listing folders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
