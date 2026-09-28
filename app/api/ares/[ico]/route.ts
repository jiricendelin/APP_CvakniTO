import { NextResponse } from "next/server";
import { fetchAresSubjectByIco } from "@/lib/ares/fetch-subject";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ico: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const { ico } = await context.params;
  const result = await fetchAresSubjectByIco(ico);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.subject);
}
