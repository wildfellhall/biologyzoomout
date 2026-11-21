// Original instructional questions, never copied from College Board exam items.
export const question=(prompt,answer,reason,wrong1,feedback1,wrong2,feedback2)=>({prompt,answer,reason,distractors:[{text:wrong1,feedback:feedback1},{text:wrong2,feedback:feedback2}]});
export const entry=(topic,sim,objective,explanation,example,predict,transfer,recall,rubric,sample)=>({topic,sim,objective,explanation,example,predict,transfer,recall,rubric,sample});
