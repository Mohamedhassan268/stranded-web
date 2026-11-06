import { isModerator } from "@/lib/repo";
import { getStore } from "@/lib/store";

type Context = { params: Promise<{ id: string; reviewId: string }> };

export async function DELETE(request: Request, { params }: Context) {
  if (!isModerator(request)) return Response.json({ error: "Not allowed." }, { status: 401 });
  const { id, reviewId } = await params;
  const removed = await getStore().removeReview(id, reviewId);
  return removed ? new Response(null, { status: 204 }) : Response.json({ error: "That review isn't in the store." }, { status: 404 });
}
