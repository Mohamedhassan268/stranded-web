import { getSim, isModerator } from "@/lib/repo";
import { getStore } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const found = await getSim((await params).id);
  if (!found) return Response.json({ error: "That sim isn't in the repo." }, { status: 404 });
  return Response.json({ sim: found.sim, reviews: found.reviews });
}

export async function DELETE(request: Request, { params }: Context) {
  if (!isModerator(request)) return Response.json({ error: "Not allowed." }, { status: 401 });
  const removed = await getStore().remove((await params).id);
  return removed ? new Response(null, { status: 204 }) : Response.json({ error: "That sim isn't in the store." }, { status: 404 });
}
