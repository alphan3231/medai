import { adminAuth } from "@/lib/firebase/admin";

export async function getUserFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  return adminAuth.verifyIdToken(token);
}
