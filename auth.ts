import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import argon2 from "argon2";
import { findUserForCredentials } from "@/lib/bos/authRepository";

export const {handlers,auth,signIn,signOut}=NextAuth({
  trustHost:true,
  providers:[
    Google({clientId:process.env.AUTH_GOOGLE_ID,clientSecret:process.env.AUTH_GOOGLE_SECRET}),
    Credentials({name:"Email i hasło",credentials:{email:{label:"Adres e-mail",type:"email"},password:{label:"Hasło",type:"password"}},async authorize(credentials){
      const email=typeof credentials.email==="string"?credentials.email.trim().toLowerCase():"";
      const password=typeof credentials.password==="string"?credentials.password:"";
      if(!email||!password)return null;
      const user=await findUserForCredentials(email);if(!user||!user.email_verified_at)return null;
      if(!await argon2.verify(user.password_hash,password))return null;
      return{id:user.id,name:user.display_name,email:user.email};
    }})
  ],
  pages:{signIn:"/login"},
  session:{strategy:"jwt"},
  callbacks:{
    async jwt({token,account,profile,user}){
      if(account?.provider==="google"&&profile?.sub){token.provider="google";token.providerAccountId=profile.sub;}
      if(account?.provider==="credentials"&&user?.id){token.sub=user.id;token.provider="credentials";token.providerAccountId=user.id;}
      return token;
    },
    async session({session,token}){if(session.user){session.user.id=token.sub??"";session.user.provider=typeof token.provider==="string"?token.provider:undefined;session.user.providerAccountId=typeof token.providerAccountId==="string"?token.providerAccountId:undefined;}return session;}
  }
});