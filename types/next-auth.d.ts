import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      provider?: string;
      providerAccountId?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
