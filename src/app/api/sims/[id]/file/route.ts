import { rawSim } from "@/lib/repo";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const raw = await rawSim(id);
  if (raw === null) return Response.json({ error: "That sim isn't in the repo." }, { status: 404 });
  // Always a download, never a page: these files come from strangers.
  return new Response(raw, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${id}.qsim"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
