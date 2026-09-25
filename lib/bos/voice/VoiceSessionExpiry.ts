export type VoiceSessionExpiryOptions={expiresAt:number|null;onExpired:()=>void;skewSeconds?:number};
export class VoiceSessionExpiry{
 private timer:ReturnType<typeof setTimeout>|null=null;
 arm({expiresAt,onExpired,skewSeconds=5}:VoiceSessionExpiryOptions){
  this.clear();if(!expiresAt)return;
  const delay=Math.max(0,expiresAt*1000-Date.now()-skewSeconds*1000);
  this.timer=setTimeout(()=>{this.timer=null;onExpired();},delay);
 }
 clear(){if(this.timer!==null){clearTimeout(this.timer);this.timer=null;}}
}
