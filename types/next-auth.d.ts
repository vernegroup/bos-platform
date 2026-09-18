import "next-auth";

declare module "next-auth" {
  interface User {
    provider?: string;
    providerAccountId?: string;
  }

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
