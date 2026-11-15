import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { prisma } from "./db";

// Constraint: no email service in this product. Magic links are handed to
// `sendMagicLink` — in development that means the server console; wire a
// transactional provider here if that ever changes.
const socialProviders = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Dev servers run on whatever port is free; keep both canonical ports trusted.
  trustedOrigins: ["http://localhost:3000", "http://localhost:3111"],
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log(`\n[auth] magic link for ${email}:\n${url}\n`);
      },
    }),
  ],
  socialProviders,
});
