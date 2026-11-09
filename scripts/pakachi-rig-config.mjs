import {digitHierarchy} from './pakachi-paws.mjs';
// Landmarks measured on the preserved, Y-up TripoSR reconstructions (model units).
// Both forms deliberately use the same semantic hierarchy. This is not a morph map.
export const characterForms={
 humanoid:{label:'Arbeitsform',landmarks:{
  Pelvis:[.22,-.105,.065],Spine:[.225,.005,.065],Chest:[.235,.135,.075],Neck:[.235,.21,.075],Head:[.225,.315,.10],Jaw:[.235,.255,.19],
  LeftEar:[.285,.445,.11],RightEar:[.015,.35,.105],
  LeftShoulder:[.325,.145,.075],LeftElbow:[.355,-.005,.08],LeftWrist:[.40,-.155,.042],LeftHand:[.405,-.195,.049],
  RightShoulder:[.105,.145,.08],RightElbow:[.085,-.005,.10],RightWrist:[.095,-.155,.19],RightHand:[.095,-.195,.19],
  LeftHip:[.30,-.115,.065],LeftKnee:[.305,-.28,.095],LeftAnkle:[.295,-.40,.165],LeftFoot:[.30,-.445,.17],
  RightHip:[.13,-.115,.065],RightKnee:[.12,-.28,.095],RightAnkle:[.105,-.40,.21],RightFoot:[.105,-.445,.21],
  TailBase:[.105,-.19,-.065],Tail1:[-.025,-.25,-.10],Tail2:[-.18,-.22,-.105],Tail3:[-.325,-.105,-.10],TailTip:[-.40,.025,-.09],
 },eyes:[[.255,.337],[.145,.302]],eyeRadius:.024,nose:[.236,.288],mouth:[[.196,.263],[.222,.253],[.25,.267]],headCut:.205,
 },
 animal:{label:'Normalform',landmarks:{
  Pelvis:[-.045,-.12,-.11],Spine:[.065,-.11,.025],Chest:[.23,-.085,.155],Neck:[.235,.02,.17],Head:[.23,.15,.19],Jaw:[.265,.045,.32],
  LeftEar:[.37,.35,.18],RightEar:[.015,.215,.175],
  LeftShoulder:[.375,-.085,.185],LeftElbow:[.375,-.26,.22],LeftWrist:[.40,-.36,.09],LeftHand:[.41,-.395,.09],
  RightShoulder:[.105,-.08,.15],RightElbow:[.135,-.26,.21],RightWrist:[.15,-.355,.25],RightHand:[.16,-.38,.30],
  LeftHip:[.105,-.12,-.165],LeftKnee:[.065,-.255,-.19],LeftAnkle:[.065,-.38,-.215],LeftFoot:[.085,-.415,-.215],
  RightHip:[-.125,-.13,-.14],RightKnee:[-.205,-.28,-.13],RightAnkle:[-.205,-.38,.05],RightFoot:[-.18,-.405,.05],
  TailBase:[-.12,-.105,-.20],Tail1:[-.26,-.11,-.25],Tail2:[-.35,.065,-.25],Tail3:[-.37,.24,-.23],TailTip:[-.35,.345,-.18],
 },eyes:[[.332,.177],[.178,.115]],eyeRadius:.033,nose:[.29,.092],mouth:[[.238,.05],[.276,.035],[.313,.057]],headCut:.015,
 },
};
export const hierarchy=[
 ['Pelvis',null],['Spine','Pelvis'],['Chest','Spine'],['Neck','Chest'],['Head','Neck'],['Jaw','Head'],['LeftEar','Head'],['RightEar','Head'],
 ['LeftShoulder','Chest'],['LeftElbow','LeftShoulder'],['LeftWrist','LeftElbow'],['LeftHand','LeftWrist'],
 ['RightShoulder','Chest'],['RightElbow','RightShoulder'],['RightWrist','RightElbow'],['RightHand','RightWrist'],
 ['LeftHip','Pelvis'],['LeftKnee','LeftHip'],['LeftAnkle','LeftKnee'],['LeftFoot','LeftAnkle'],
 ['RightHip','Pelvis'],['RightKnee','RightHip'],['RightAnkle','RightKnee'],['RightFoot','RightAnkle'],
 ['TailBase','Pelvis'],['Tail1','TailBase'],['Tail2','Tail1'],['Tail3','Tail2'],['TailTip','Tail3'],['LeftEye','Head'],['RightEye','Head'],
 ...digitHierarchy,
];
