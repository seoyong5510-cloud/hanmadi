// The six CEFR levels and how exercises behave at each one.
const M=(say,rate,pass,spell,blind)=>({say,rate,pass,spell,blind});
export const LEVELS=[
 {id:"a1",name:"입문",cefr:"A1",desc:"영어가 거의 처음이에요. 한글 발음과 뜻을 함께 보여 줘요.",mode:M(true,0.9,0.7,"tiles",false)},
 {id:"a2",name:"초급",cefr:"A2",desc:"짧은 문장은 말할 수 있어요. 일상 대화와 부탁을 연습해요.",mode:M(false,1,0.8,"hard",false)},
 {id:"a2p",name:"초중급",cefr:"A2+",desc:"이유를 붙여 설명하고, 비교하고, 계획을 말해요.",mode:M(false,1,0.8,"hard",false)},
 {id:"b1",name:"중급",cefr:"B1",desc:"경험과 의견을 말하고 문제를 해결해요. 문장을 보기 전에 먼저 듣고 말해요.",mode:M(false,1.05,0.8,"type",true)},
 {id:"b2",name:"중상급",cefr:"B2",desc:"근거를 들어 토론하고 업무 대화를 해요.",mode:M(false,1.05,0.8,"type",true)},
 {id:"c1",name:"고급",cefr:"C1",desc:"미묘한 뜻 차이를 살려 정교하게 말해요.",mode:M(false,1.1,0.8,"type",true)}
];
export const LV=Object.fromEntries(LEVELS.map(l=>[l.id,l]));
export const levelIndex=id=>LEVELS.findIndex(l=>l.id===id);
