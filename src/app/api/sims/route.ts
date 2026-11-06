import { errorResponse, listSims, postSim, requester } from "@/lib/repo";
import { MAX_BYTES } from "@/lib/qsim";

export async function GET() {
  const { sims } = await listSims();
  return Response.json({ sims });
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES + 2048) {
      return Response.json({ error: "That file is too big to be a sim file." }, { status: 413 });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body.file !== "string") return Response.json({ error: "Choose a .qsim file to post." }, { status: 400 });
    // People never see this field. Scripts that fill in every box do, and get a quiet refusal.
    if (body.website) return Response.json({ error: "That couldn't be posted." }, { status: 400 });
    const sim = await postSim(body.file, requester(request));
    return Response.json({ id: sim.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
