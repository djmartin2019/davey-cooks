// Emitted as out/version.json. The installed app polls it to detect new
// deploys; see src/components/update-check.tsx.
export const dynamic = "force-static";

export function GET() {
  return Response.json({ version: process.env.NEXT_PUBLIC_BUILD_ID });
}
