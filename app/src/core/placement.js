// Level-finding test: four tiers of three questions. It stops as soon as a tier is failed.
export const QUIZ=[
 {tier:1,audio:true,k:"잘 듣고 알맞은 대답을 골라요",q:"Where are you from?",o:["I'm from Korea.","I'm fine, thank you.","Nice to meet you."]},
 {tier:1,k:"영어로 알맞은 것을 골라요",q:"얼마예요?",o:["How much is it?","How many is it?","How long is it?"]},
 {tier:1,audio:true,k:"잘 듣고 알맞은 대답을 골라요",q:"For here or to go?",o:["To go, please.","Yes, please.","I'm going."]},
 {tier:2,audio:true,k:"잘 듣고 뜻을 골라요",q:"Go straight two blocks and turn left at the bank.",o:["두 블록 직진한 뒤 은행에서 왼쪽으로 돌아요.","은행을 지나 두 블록 가서 오른쪽으로 돌아요.","은행에서 두 번째 길로 쭉 가요."]},
 {tier:2,k:"영어로 알맞은 것을 골라요",q:"이거 입어 봐도 돼요?",o:["Can I try this on?","Can I wear this on?","Can I try to this?"]},
 {tier:2,audio:true,k:"잘 듣고 알맞은 대답을 골라요",q:"What did you do last weekend?",o:["I went hiking.","I'm going hiking.","I go hiking."]},
 {tier:3,audio:true,k:"잘 듣고 뜻을 골라요",q:"I'm afraid we're out of that color. Would you like a refund, or should I order one for you?",o:["그 색은 다 떨어져서, 환불할지 새로 주문할지 물어요.","그 색은 환불이 안 된다고 해요.","주문한 색이 도착했다고 해요."]},
 {tier:3,k:"영어로 알맞은 것을 골라요",q:"어제부터 목이 아파요.",o:["I've had a sore throat since yesterday.","I have a sore throat from yesterday.","I had a sore throat since yesterday."]},
 {tier:3,audio:true,k:"잘 듣고 알맞은 대답을 골라요",q:"Would you mind if we met a little later?",o:["Not at all. What time works for you?","Yes, we met yesterday.","Thanks, I'm fine."]},
 {tier:4,audio:true,k:"잘 듣고 뜻을 골라요",q:"Having said that, I think we'd be better off postponing the launch until the bugs are ironed out.",o:["그렇긴 해도, 오류를 다 잡을 때까지 출시를 미루는 게 낫다고 생각해요.","그 말대로, 오류가 있어도 출시를 서두르는 게 낫다고 생각해요.","출시는 이미 미뤄졌고 오류도 다 잡았다고 해요."]},
 {tier:4,k:"영어로 알맞은 것을 골라요",q:"그가 미리 말해 줬더라면 우리가 도울 수 있었을 텐데요.",o:["If he had told us earlier, we could have helped.","If he told us earlier, we could help.","If he has told us earlier, we could have helped."]},
 {tier:4,audio:true,k:"잘 듣고 알맞은 대답을 골라요",q:"I'm not sure the budget will stretch that far. Could we meet somewhere in the middle?",o:["That's fair. What figure did you have in mind?","Yes, the middle seat is fine.","I stretched it yesterday."]}
];
// answered = number of questions answered so far, c = correct answers per tier
export function shouldStop(answered,c){
  if(answered===3&&c[1]<=1)return true;
  if(answered===6&&c[2]<=1)return true;
  if(answered===9&&c[3]<=1)return true;
  return answered>=QUIZ.length;
}
export function place(c){
  if(c[1]<=1||c[2]<=1)return "a1";
  if(c[3]<=1)return c[2]===3?"a2p":"a2";
  return (c[4]||0)>=2?"b2":"b1";
}
