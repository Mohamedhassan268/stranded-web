import { errorResponse, postReview, requester } from "@/lib/repo";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return Response.json({ error: "That review couldn't be read." }, { status: 400 });
    if (body.website) return Response.json({ error: "That couldn't be posted." }, { status: 400 });
    const review = await postReview((await params).id, body, requester(request));
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
