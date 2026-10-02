import "server-only";
import type { BOSProductKey } from "@/data/products";

export type AnnualOfferKey = "onboarding-annual" | "promotions-annual";

const offers: Record<BOSProductKey,{key:AnnualOfferKey;priceEnv:string}> = {
 onboarding:{key:"onboarding-annual",priceEnv:"STRIPE_PRICE_ID_ANNUAL_ONBOARDING"},
 promotions:{key:"promotions-annual",priceEnv:"STRIPE_PRICE_ID_ANNUAL_PROMOTIONS"},
};

export function annualOffer(product:BOSProductKey){
 const offer=offers[product];
 const priceId=process.env[offer.priceEnv];
 if(!priceId) throw new Error(`${offer.priceEnv} is not set`);
 return {...offer,priceId};
}
