// Things the characters hold, hand over or think about, and the rules that pick the right
// action, item and face for each line of a lesson dialogue.
const OL="#3b2a21";
const o=w=>' stroke="'+OL+'" stroke-width="'+(w||3)+'" stroke-linejoin="round" stroke-linecap="round"';
// Every prop is drawn around (0,-16): it sits just above the paw that holds it (about 34 x 34).
export const PROPS={
  cup:'<path d="M-11 -30 H11 L8 0 H-8 Z" fill="#fff"'+o()+'/><rect x="-12" y="-35" width="24" height="7" rx="2" fill="#7a4a2e"'+o(2.5)+'/><rect x="-9.5" y="-20" width="19" height="8" fill="#3fae6e"/><circle cx="0" cy="-16" r="2.5" fill="#fff"/>',
  iced:'<path d="M-11 -30 H11 L8 0 H-8 Z" fill="#d7eef8" fill-opacity=".9"'+o()+'/><path d="M-9 -22 H9 L7.5 0 H-7.5 Z" fill="#8a5a3a" opacity=".85"/><rect x="-6" y="-24" width="6" height="6" rx="1" fill="#fff" opacity=".9"/><rect x="2" y="-18" width="6" height="6" rx="1" fill="#fff" opacity=".9"/><path d="M3 -30 L7 -44"'+o(3)+'/>',
  tea:'<path d="M-13 -22 H11 Q11 -2 -1 -2 Q-13 -2 -13 -22 Z" fill="#fff"'+o()+'/><path d="M11 -18 Q19 -16 11 -9" fill="none"'+o()+'/><path d="M-6 -27 q-3 -4 0 -8 M0 -27 q-3 -4 0 -8" fill="none" stroke="#bbb" stroke-width="2"/>',
  glass:'<path d="M-9 -32 H9 L7 0 H-7 Z" fill="#d7eef8"'+o()+'/><path d="M-8 -20 H8 L7 0 H-7 Z" fill="#7ec8e3"/>',
  juice:'<path d="M-9 -32 H9 L7 0 H-7 Z" fill="#fff"'+o()+'/><path d="M-8 -22 H8 L7 0 H-7 Z" fill="#f2a65a"/><path d="M2 -32 L6 -42"'+o(2.5)+'/>',
  wine:'<path d="M-10 -34 H10 Q10 -16 0 -16 Q-10 -16 -10 -34 Z" fill="#fff"'+o()+'/><path d="M-9 -27 H9 Q8 -17 0 -17 Q-8 -17 -9 -27 Z" fill="#a8324a"/><path d="M0 -16 V0 M-7 0 H7"'+o()+'/>',
  menu:'<rect x="-15" y="-38" width="30" height="38" rx="3" fill="#7a2e3a"'+o()+'/><rect x="-10" y="-33" width="20" height="28" rx="2" fill="#fffaf2"/><path d="M-6 -27 H6 M-6 -21 H4 M-6 -15 H6 M-6 -9 H3" stroke="#7a2e3a" stroke-width="2"/>',
  receipt:'<path d="M-11 -36 H11 V0 L7 -3 L3 0 L-1 -3 L-5 0 L-9 -3 L-11 0 Z" fill="#fff"'+o()+'/><path d="M-6 -28 H6 M-6 -21 H3 M-6 -14 H6" stroke="#9aa" stroke-width="2"/>',
  card:'<rect x="-17" y="-26" width="34" height="22" rx="3" fill="#2f6bff"'+o()+'/><rect x="-12" y="-20" width="8" height="6" rx="1" fill="#f2c94c"/><path d="M-12 -9 H10" stroke="#fff" stroke-width="2"/>',
  cash:'<rect x="-18" y="-26" width="36" height="20" rx="2" fill="#a8d5a2"'+o()+'/><circle cx="0" cy="-16" r="5" fill="none" stroke="#3b6b3a" stroke-width="2"/><rect x="-14" y="-31" width="36" height="20" rx="2" fill="#bfe3b7"'+o(2.5)+' transform="rotate(-8)"/><text x="3" y="-17" font-size="10" font-weight="900" text-anchor="middle" fill="#3b6b3a" font-family="sans-serif" transform="rotate(-8)">$</text>',
  ticket:'<path d="M-18 -28 H18 V-22 A4 4 0 0 0 18 -14 V-8 H-18 V-14 A4 4 0 0 0 -18 -22 Z" fill="#ffd84a"'+o()+'/><path d="M-8 -28 V-8" stroke="'+OL+'" stroke-width="2" stroke-dasharray="3 3"/><path d="M-2 -21 H12 M-2 -15 H8" stroke="#d6453d" stroke-width="2.5"/>',
  boarding:'<rect x="-19" y="-28" width="38" height="22" rx="3" fill="#fff"'+o()+'/><rect x="-19" y="-28" width="38" height="7" fill="#2f5aa8"/><path d="M-13 -14 l5 -2 l2 -4 l1 0 l-1 4 l5 -1 l1 -2 l1 0 l-1 3 l-12 4z" fill="#2f5aa8"/><path d="M4 -16 H14 M4 -11 H11" stroke="#999" stroke-width="2"/>',
  passport:'<rect x="-12" y="-34" width="24" height="32" rx="3" fill="#2f5aa8"'+o()+'/><circle cx="0" cy="-20" r="6" fill="none" stroke="#f2c94c" stroke-width="2"/><path d="M-6 -9 H6" stroke="#f2c94c" stroke-width="2"/>',
  keycard:'<rect x="-15" y="-26" width="30" height="20" rx="3" fill="#f2c94c"'+o()+'/><rect x="-11" y="-21" width="12" height="4" fill="'+OL+'"/><path d="M5 -12 H11" stroke="'+OL+'" stroke-width="2"/>',
  key:'<circle cx="-8" cy="-18" r="8" fill="#f2c94c"'+o()+'/><circle cx="-8" cy="-18" r="3" fill="#fff"/><path d="M0 -18 H18 M12 -18 V-12 M16 -18 V-13"'+o(3.5)+'/>',
  map:'<path d="M-18 -32 L-6 -36 L6 -32 L18 -36 V-4 L6 0 L-6 -4 L-18 0 Z" fill="#fdf3d6"'+o()+'/><path d="M-6 -36 V-4 M6 -32 V0" stroke="'+OL+'" stroke-width="1.5"/><path d="M-13 -10 Q-4 -24 10 -22" fill="none" stroke="#d6453d" stroke-width="2.5" stroke-dasharray="3 3"/><circle cx="11" cy="-22" r="3" fill="#d6453d"/>',
  bag:'<path d="M-15 -26 H15 L13 2 H-13 Z" fill="#f2a65a"'+o()+'/><path d="M-7 -26 Q0 -40 7 -26" fill="none"'+o()+'/>',
  shirt:'<path d="M-8 -36 L-20 -29 L-16 -19 L-11 -22 V0 H11 V-22 L16 -19 L20 -29 L8 -36 Q0 -30 -8 -36 Z" fill="#5b8cff"'+o()+'/>',
  dress:'<path d="M-6 -38 L6 -38 L8 -26 L18 0 H-18 L-8 -26 Z" fill="#e05f8a"'+o()+'/>',
  shoes:'<path d="M-18 -6 V-18 Q-12 -22 -6 -18 Q2 -12 16 -12 Q20 -10 18 -6 Z" fill="#d6453d"'+o()+'/><path d="M-18 -6 H18" stroke="#fff" stroke-width="3"/>',
  medicine:'<rect x="-11" y="-34" width="22" height="32" rx="4" fill="#fff"'+o()+'/><rect x="-12" y="-38" width="24" height="7" rx="2" fill="#d6453d"'+o(2.5)+'/><path d="M0 -24 V-10 M-7 -17 H7" stroke="#3fae6e" stroke-width="4"/>',
  pills:'<rect x="-14" y="-12" width="16" height="8" rx="4" fill="#f2828a"'+o(2.5)+' transform="rotate(-30)"/><rect x="2" y="-18" width="14" height="7" rx="3.5" fill="#5b8cff"'+o(2.5)+'/>',
  thermo:'<rect x="-4" y="-38" width="8" height="30" rx="4" fill="#fff"'+o()+'/><circle cx="0" cy="-6" r="7" fill="#d6453d"'+o()+'/><rect x="-1.5" y="-26" width="3" height="18" fill="#d6453d"/>',
  umbrella:'<path d="M-20 -22 Q0 -46 20 -22 Q15 -26 10 -22 Q5 -26 0 -22 Q-5 -26 -10 -22 Q-15 -26 -20 -22 Z" fill="#5b8cff"'+o()+'/><path d="M0 -22 V-2 Q0 4 -5 2"'+o()+' fill="none"/>',
  suitcase:'<rect x="-16" y="-30" width="32" height="28" rx="4" fill="#9b59b6"'+o()+'/><path d="M-6 -30 V-36 H6 V-30"'+o()+' fill="none"/><path d="M-16 -18 H16" stroke="#fff" stroke-width="2.5"/>',
  camera:'<rect x="-17" y="-28" width="34" height="24" rx="4" fill="#2f3137"'+o()+'/><rect x="-8" y="-33" width="12" height="6" rx="2" fill="#2f3137"'+o(2)+'/><circle cx="0" cy="-16" r="7" fill="#9fd6f2"'+o(2.5)+'/>',
  phone:'<rect x="-9" y="-36" width="18" height="34" rx="4" fill="#2f3137"'+o()+'/><rect x="-6" y="-31" width="12" height="22" rx="1.5" fill="#9fd6f2"/>',
  book:'<path d="M-18 -30 Q-9 -34 0 -30 Q9 -34 18 -30 V-4 Q9 -8 0 -4 Q-9 -8 -18 -4 Z" fill="#fff"'+o()+'/><path d="M0 -30 V-4" stroke="'+OL+'" stroke-width="2"/><path d="M-13 -23 H-5 M-13 -17 H-5 M5 -23 H13 M5 -17 H13" stroke="#aaa" stroke-width="2"/>',
  laptop:'<rect x="-16" y="-32" width="32" height="22" rx="2" fill="#2f3137"'+o()+'/><rect x="-12" y="-28" width="24" height="15" fill="#9fd6f2"/><path d="M-20 -8 H20 L17 -4 H-17 Z" fill="#c9d3dc"'+o()+'/>',
  doc:'<path d="M-12 -36 H6 L12 -30 V0 H-12 Z" fill="#fff"'+o()+'/><path d="M-7 -26 H6 M-7 -19 H6 M-7 -12 H2" stroke="#9fb4d6" stroke-width="2.5"/>',
  chart:'<rect x="-16" y="-36" width="32" height="34" rx="2" fill="#fff"'+o()+'/><rect x="-10" y="-16" width="5" height="10" fill="#9fb4d6"/><rect x="-3" y="-22" width="5" height="16" fill="#9fb4d6"/><rect x="4" y="-30" width="5" height="24" fill="#2f6bff"/>',
  clip:'<rect x="-13" y="-36" width="26" height="34" rx="3" fill="#c49a6c"'+o()+'/><rect x="-9" y="-30" width="18" height="24" fill="#fff"/><rect x="-5" y="-39" width="10" height="6" rx="2" fill="#8a8f98"'+o(2)+'/><path d="M-6 -24 H6 M-6 -18 H6 M-6 -12 H3" stroke="#aaa" stroke-width="2"/>',
  pen:'<path d="M-14 -4 L10 -32 L16 -26 L-8 2 L-16 4 Z" fill="#2f6bff"'+o()+'/>',
  clock:'<circle cx="0" cy="-18" r="16" fill="#fff"'+o()+'/><path d="M0 -18 V-29 M0 -18 L8 -14"'+o(3)+'/><circle cx="0" cy="-18" r="2" fill="'+OL+'"/>',
  calendar:'<rect x="-17" y="-34" width="34" height="32" rx="3" fill="#fff"'+o()+'/><rect x="-17" y="-34" width="34" height="9" fill="#d6453d"'+o(2.5)+'/><path d="M-9 -38 V-31 M9 -38 V-31"'+o(3)+'/><text x="0" y="-8" font-size="14" font-weight="900" text-anchor="middle" fill="'+OL+'" font-family="sans-serif">7</text>',
  pizza:'<path d="M0 -2 L-16 -34 Q0 -40 16 -34 Z" fill="#f2c94c"'+o()+'/><path d="M-16 -34 Q0 -40 16 -34" fill="none" stroke="#c98a55" stroke-width="5"/><circle cx="-3" cy="-24" r="3" fill="#d6453d"/><circle cx="4" cy="-15" r="3" fill="#d6453d"/>',
  noodles:'<path d="M-18 -18 H18 Q16 2 0 2 Q-16 2 -18 -18 Z" fill="#fff"'+o()+'/><path d="M-12 -18 Q-8 -26 -4 -18 Q0 -26 4 -18 Q8 -26 12 -18" fill="none" stroke="#f2c94c" stroke-width="3"/><path d="M6 -40 L14 -16 M10 -40 L16 -17"'+o(2.5)+'/>',
  bowl:'<path d="M-18 -18 H18 Q16 2 0 2 Q-16 2 -18 -18 Z" fill="#d6453d"'+o()+'/><ellipse cx="0" cy="-19" rx="16" ry="5" fill="#fff"/><circle cx="-5" cy="-21" r="3" fill="#5fae6e"/><circle cx="5" cy="-21" r="3" fill="#f2a65a"/>',
  soup:'<path d="M-18 -18 H18 Q16 2 0 2 Q-16 2 -18 -18 Z" fill="#fff"'+o()+'/><ellipse cx="0" cy="-18" rx="16" ry="4" fill="#e9783a"/><path d="M-6 -24 q-3 -5 0 -10 M4 -24 q-3 -5 0 -10" fill="none" stroke="#ccc" stroke-width="2.5"/>',
  burger:'<path d="M-16 -20 Q0 -40 16 -20 Z" fill="#e9a65a"'+o()+'/><rect x="-17" y="-20" width="34" height="5" fill="#5fae6e"'+o(2)+'/><rect x="-16" y="-15" width="32" height="6" rx="2" fill="#7a4a2e"'+o(2)+'/><path d="M-16 -9 H16 Q14 0 0 0 Q-14 0 -16 -9 Z" fill="#e9a65a"'+o()+'/>',
  cake:'<rect x="-16" y="-22" width="32" height="20" rx="2" fill="#fde3c4"'+o()+'/><path d="M-16 -16 Q-8 -10 0 -16 Q8 -10 16 -16" fill="none" stroke="#f7b9c4" stroke-width="4"/><path d="M0 -22 V-32"'+o(3)+'/><path d="M0 -38 q-3 3 0 6 q3 -3 0 -6 Z" fill="#f2c94c"/>',
  bread:'<path d="M-18 -6 Q-18 -30 0 -30 Q18 -30 18 -6 Z" fill="#e9a65a"'+o()+'/><path d="M-8 -24 L-4 -14 M2 -26 L6 -16" stroke="#c98a55" stroke-width="2.5"/>',
  pancakes:'<ellipse cx="0" cy="-6" rx="18" ry="5" fill="#fff"'+o(2.5)+'/><rect x="-14" y="-24" width="28" height="18" rx="6" fill="#e9a65a"'+o()+'/><path d="M-14 -18 H14 M-14 -12 H14" stroke="#c98a55" stroke-width="2"/><path d="M-4 -26 Q0 -20 6 -26 V-20" fill="#a8582a"/>',
  fish:'<path d="M-16 -18 Q-4 -32 10 -18 Q-4 -4 -16 -18 Z" fill="#9fd6f2"'+o()+'/><path d="M10 -18 L18 -26 V-10 Z" fill="#9fd6f2"'+o()+'/><circle cx="-9" cy="-20" r="2" fill="'+OL+'"/>',
  chicken:'<path d="M-6 -30 Q-18 -34 -16 -20 Q-14 -10 -2 -14 L8 -4" fill="#c98a55"'+o()+'/><circle cx="10" cy="-3" r="3.5" fill="#fff"'+o(2)+'/><circle cx="12" cy="-6" r="3.5" fill="#fff"'+o(2)+'/>',
  rice:'<path d="M-18 -16 H18 Q16 2 0 2 Q-16 2 -18 -16 Z" fill="#fff"'+o()+'/><path d="M-15 -16 Q0 -32 15 -16 Z" fill="#fffef8"'+o(2.5)+'/>',
  apple:'<path d="M0 -26 Q-16 -34 -16 -16 Q-14 0 0 -4 Q14 0 16 -16 Q16 -34 0 -26 Z" fill="#d6453d"'+o()+'/><path d="M0 -26 Q2 -34 6 -36"'+o(2.5)+' fill="none"/><path d="M3 -32 Q10 -36 12 -30 Q6 -28 3 -32 Z" fill="#5fae6e"/>',
  gift:'<rect x="-16" y="-24" width="32" height="22" fill="#e05f8a"'+o()+'/><rect x="-18" y="-30" width="36" height="8" fill="#f7b9c4"'+o(2.5)+'/><path d="M0 -30 V-2" stroke="#f2c94c" stroke-width="5"/><path d="M0 -30 Q-12 -42 -8 -30 M0 -30 Q12 -42 8 -30" fill="none" stroke="#f2c94c" stroke-width="3"/>',
  flower:'<path d="M0 -14 V0" stroke="#3fae6e" stroke-width="3"/>'+[0,72,144,216,288].map(a=>'<circle cx="0" cy="-30" r="6" fill="#f7b9c4"'+o(2)+' transform="rotate('+a+' 0 -22)"/>').join("")+'<circle cx="0" cy="-22" r="5" fill="#f2c94c"'+o(2)+'/>',
  car:'<path d="M-20 -8 V-16 L-14 -18 L-8 -28 H8 L14 -18 L20 -16 V-8 Z" fill="#d6453d"'+o()+'/><path d="M-6 -25 H6 L10 -18 H-10 Z" fill="#bfe3f5"/><circle cx="-11" cy="-7" r="4.5" fill="#2f3137"/><circle cx="11" cy="-7" r="4.5" fill="#2f3137"/>',
  taxi:'<path d="M-20 -8 V-16 L-14 -18 L-8 -28 H8 L14 -18 L20 -16 V-8 Z" fill="#f2c94c"'+o()+'/><rect x="-5" y="-33" width="10" height="5" fill="#2f3137"/><path d="M-6 -25 H6 L10 -18 H-10 Z" fill="#bfe3f5"/><circle cx="-11" cy="-7" r="4.5" fill="#2f3137"/><circle cx="11" cy="-7" r="4.5" fill="#2f3137"/>',
  bus:'<rect x="-18" y="-34" width="36" height="28" rx="5" fill="#3fae6e"'+o()+'/><rect x="-14" y="-29" width="28" height="10" fill="#bfe3f5"/><circle cx="-10" cy="-5" r="4" fill="#2f3137"/><circle cx="10" cy="-5" r="4" fill="#2f3137"/>',
  train:'<rect x="-15" y="-36" width="30" height="30" rx="7" fill="#2f6bff"'+o()+'/><rect x="-10" y="-31" width="20" height="10" rx="2" fill="#bfe3f5"/><circle cx="-7" cy="-13" r="2.5" fill="#f2c94c"/><circle cx="7" cy="-13" r="2.5" fill="#f2c94c"/><path d="M-10 -6 L-14 0 M10 -6 L14 0"'+o(2.5)+'/>',
  plane:'<path d="M-20 -16 L16 -20 Q22 -20 20 -14 L-14 -10 Z" fill="#fff"'+o()+'/><path d="M-2 -18 L-10 -32 L-4 -32 L8 -18 M-2 -12 L-8 -2 L-2 -2 L6 -13 M-16 -14 L-20 -24 L-15 -24 L-10 -15" fill="#9fb4d6"'+o(2)+'/>',
  house:'<path d="M-18 -18 L0 -36 L18 -18 Z" fill="#d6453d"'+o()+'/><rect x="-14" y="-18" width="28" height="18" fill="#fde3c4"'+o()+'/><rect x="-4" y="-11" width="8" height="11" fill="#7a4a2e"/>',
  building:'<rect x="-14" y="-40" width="28" height="40" fill="#9fb4d6"'+o()+'/>'+[0,1,2].map(r=>'<rect x="-9" y="'+(-34+r*11)+'" width="6" height="6" fill="#fff"/><rect x="3" y="'+(-34+r*11)+'" width="6" height="6" fill="#fff"/>').join(""),
  photo:'<rect x="-17" y="-34" width="34" height="30" rx="2" fill="#c49a6c"'+o()+'/><rect x="-13" y="-30" width="26" height="22" fill="#bfe3f5"/><circle cx="-5" cy="-20" r="4" fill="#f2a65a"/><circle cx="5" cy="-20" r="4" fill="#c98a55"/><path d="M-11 -8 Q-5 -16 0 -8 Q5 -16 11 -8" fill="#5b8cff"/>',
  briefcase:'<rect x="-17" y="-28" width="34" height="24" rx="3" fill="#7a4a2e"'+o()+'/><path d="M-6 -28 V-33 H6 V-28"'+o()+' fill="none"/><rect x="-3" y="-20" width="6" height="5" fill="#f2c94c"/>',
  dumbbell:'<path d="M-12 -18 H12" stroke="'+OL+'" stroke-width="4"/><rect x="-20" y="-28" width="8" height="20" rx="2" fill="#5e6b7a"'+o()+'/><rect x="12" y="-28" width="8" height="20" rx="2" fill="#5e6b7a"'+o()+'/>',
  ball:'<circle cx="0" cy="-18" r="15" fill="#fff"'+o()+'/><path d="M-9 -30 Q-3 -18 -9 -6 M9 -30 Q3 -18 9 -6" fill="none" stroke="#d6453d" stroke-width="2" stroke-dasharray="2 2"/>',
  soccer:'<circle cx="0" cy="-18" r="15" fill="#fff"'+o()+'/><path d="M0 -24 L6 -20 L4 -13 H-4 L-6 -20 Z" fill="'+OL+'"/>',
  guitar:'<path d="M-14 -4 Q-20 -14 -10 -18 Q-6 -26 2 -20 Q8 -12 0 -6 Q-6 2 -14 -4 Z" fill="#e9783a"'+o()+'/><path d="M-3 -16 L16 -38"'+o(4)+'/><circle cx="-6" cy="-12" r="3" fill="'+OL+'"/>',
  note:'<path d="M-6 -6 V-34 L12 -38 V-10" fill="none"'+o(3.5)+'/><ellipse cx="-10" cy="-6" rx="6" ry="4.5" fill="'+OL+'"/><ellipse cx="8" cy="-10" rx="6" ry="4.5" fill="'+OL+'"/>',
  tv:'<rect x="-19" y="-34" width="38" height="26" rx="3" fill="#2f3137"'+o()+'/><rect x="-15" y="-30" width="30" height="18" fill="#9fd6f2"/><path d="M-3 -24 V-16 L4 -20 Z" fill="#fff"/><path d="M-8 -2 H8 M0 -8 V-2"'+o(3)+'/>',
  popcorn:'<path d="M-12 -24 H12 L9 0 H-9 Z" fill="#fff"'+o()+'/><path d="M-6 -24 L-5 0 M0 -24 V0 M6 -24 L5 0" stroke="#d6453d" stroke-width="3"/><path d="M-13 -24 Q-14 -34 -6 -32 Q-2 -40 4 -33 Q12 -36 13 -24 Z" fill="#fff4c4"'+o(2.5)+'/>',
  bed:'<rect x="-20" y="-16" width="40" height="10" rx="2" fill="#5b8cff"'+o()+'/><rect x="-20" y="-24" width="12" height="8" rx="3" fill="#fff"'+o(2.5)+'/><path d="M-20 -6 V0 M20 -6 V0"'+o(3)+'/><text x="10" y="-26" font-size="11" font-weight="900" fill="#5b8cff" font-family="sans-serif">Zz</text>',
  sun:'<circle cx="0" cy="-18" r="10" fill="#ffd84a"'+o()+'/>'+[0,45,90,135,180,225,270,315].map(a=>'<path d="M0 -32 V-37" stroke="#f2a65a" stroke-width="3" stroke-linecap="round" transform="rotate('+a+' 0 -18)"/>').join(""),
  rain:'<path d="M-16 -18 Q-18 -30 -6 -30 Q-2 -40 8 -34 Q18 -34 16 -22 Q20 -16 14 -14 H-12 Q-20 -14 -16 -18 Z" fill="#c9d3dc"'+o()+'/><path d="M-8 -8 l-2 6 M0 -8 l-2 6 M8 -8 l-2 6" stroke="#2f6bff" stroke-width="3" stroke-linecap="round"/>',
  snow:'<g stroke="#5b8cff" stroke-width="3.5" stroke-linecap="round"><path d="M0 -34 V-2 M-14 -26 L14 -10 M-14 -10 L14 -26"/></g>',
  heart:'<path d="M0 -4 Q-20 -16 -16 -28 Q-10 -38 0 -28 Q10 -38 16 -28 Q20 -16 0 -4 Z" fill="#f04452"'+o()+'/>',
  idea:'<path d="M0 -38 Q-14 -38 -14 -24 Q-14 -16 -6 -12 V-6 H6 V-12 Q14 -16 14 -24 Q14 -38 0 -38 Z" fill="#ffd84a"'+o()+'/><rect x="-6" y="-6" width="12" height="5" fill="#9aa"'+o(2)+'/>',
  qmark:'<text x="0" y="-4" font-size="34" font-weight="900" text-anchor="middle" fill="#2f6bff" font-family="sans-serif" stroke="'+OL+'" stroke-width="1.5">?</text>',
  check:'<path d="M-14 -18 L-4 -8 L14 -28" fill="none" stroke="#3fae6e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
  cross:'<path d="M-12 -30 L12 -6 M12 -30 L-12 -6" stroke="#f04452" stroke-width="7" stroke-linecap="round"/>',
  box:'<path d="M-17 -26 L0 -34 L17 -26 V-6 L0 2 L-17 -6 Z" fill="#d9a066"'+o()+'/><path d="M-17 -26 L0 -18 L17 -26 M0 -18 V2"'+o(2.5)+' fill="none"/>',
  mail:'<rect x="-18" y="-30" width="36" height="24" rx="2" fill="#fff"'+o()+'/><path d="M-18 -30 L0 -16 L18 -30"'+o(2.5)+' fill="none"/>',
  money:'<path d="M-14 -26 Q-18 0 0 0 Q18 0 14 -26 Q8 -32 0 -30 Q-8 -32 -14 -26 Z" fill="#c9a65a"'+o()+'/><path d="M-6 -34 H6" stroke="'+OL+'" stroke-width="3"/><text x="0" y="-8" font-size="15" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">₩</text>',
  hanger:'<path d="M0 -30 Q-2 -38 4 -38 Q8 -36 4 -32 L0 -30 L-18 -14 H18 Z" fill="none"'+o(3)+'/><path d="M-12 -14 V0 H12 V-14" fill="#5b8cff"'+o(2.5)+'/>',
  headset:'<path d="M-14 -16 Q-14 -36 0 -36 Q14 -36 14 -16" fill="none" stroke="#2f3137" stroke-width="5"/><rect x="-18" y="-20" width="8" height="12" rx="3" fill="#2f3137"/><rect x="10" y="-20" width="8" height="12" rx="3" fill="#2f3137"/>',
  dog:'<ellipse cx="0" cy="-18" rx="13" ry="12" fill="#e9d2a8"'+o()+'/><path d="M-12 -24 Q-20 -18 -14 -8 M12 -24 Q20 -18 14 -8" fill="#a8774e"'+o(2.5)+'/><circle cx="-4" cy="-20" r="2" fill="'+OL+'"/><circle cx="4" cy="-20" r="2" fill="'+OL+'"/><ellipse cx="0" cy="-13" rx="3" ry="2" fill="'+OL+'"/>',
  mountain:'<path d="M-20 -2 L-6 -30 L2 -16 L8 -24 L20 -2 Z" fill="#7cbf6a"'+o()+'/><path d="M-6 -30 L-10 -22 L-6 -24 L-2 -22 Z" fill="#fff"/>',
  beach:'<path d="M-20 -6 Q0 -14 20 -6 V0 H-20 Z" fill="#f2d18a"'+o(2.5)+'/><path d="M-4 -6 V-30"'+o(3)+'/><path d="M-4 -30 Q-18 -32 -20 -22 M-4 -30 Q10 -34 12 -24 M-4 -30 Q-6 -40 4 -40" fill="none" stroke="#3fae6e" stroke-width="4" stroke-linecap="round"/>',
  school:'<path d="M-18 -18 L0 -32 L18 -18 Z" fill="#d6453d"'+o()+'/><rect x="-15" y="-18" width="30" height="18" fill="#fde3c4"'+o()+'/><rect x="-3" y="-12" width="6" height="12" fill="#7a4a2e"/><path d="M0 -32 V-40 L8 -38 L0 -36" fill="#f2c94c"'+o(2)+'/>',
  hospital:'<rect x="-16" y="-34" width="32" height="32" fill="#fff"'+o()+'/><path d="M0 -28 V-12 M-8 -20 H8" stroke="#f04452" stroke-width="5"/>'
};
// Props a character can hold in the hand; the rest are only shown in a thought bubble.
const HAND=new Set("cup iced tea glass juice wine menu receipt card cash ticket boarding passport keycard key map bag shirt dress shoes medicine pills thermo umbrella suitcase camera phone book laptop doc chart clip pen pizza noodles bowl soup burger cake bread pancakes fish chicken rice apple gift flower photo briefcase dumbbell ball soccer guitar popcorn box mail money hanger".split(" "));
export const holdable=p=>HAND.has(p);

// [pattern, prop] — the first match in a line wins.
const RULES=[
  [/\biced\b|\bice coffee/,"iced"],[/latte|americano|coffee|espresso|cappuccino/,"cup"],[/\btea\b/,"tea"],
  [/\bjuice\b|smoothie/,"juice"],[/\bwine\b|\bbeer\b/,"wine"],[/\bwater\b|\bdrink/,"glass"],
  [/\bmenu\b/,"menu"],[/\bbill\b|\bcheck,? please|receipt/,"receipt"],[/credit card|\bcard\b/,"card"],
  [/\bcash\b|dollars?\b|\$\d|\bwon\b|how much|price|costs?\b|cheap|expensive|exchange|pay\b|paid/,"cash"],
  [/boarding pass|\bflight|\bgate\b|window seat|aisle seat/,"boarding"],[/passport/,"passport"],[/room key|key card/,"keycard"],[/\bkeys?\b/,"key"],
  [/tickets?\b/,"ticket"],[/\bmap\b|directions|get to\b|how do i get|where is|where's the|turn (left|right)|go straight|blocks?\b/,"map"],
  [/\bbags?\b|backpack|shopping/,"bag"],[/\bdress\b|skirt/,"dress"],[/shirt|jacket|sweater|coat\b|\bsize\b|try (it|this|them) on|clothes|fitting room/,"shirt"],
  [/shoes|sneakers|boots/,"shoes"],[/fever|temperature/,"thermo"],[/medicine|pills?\b|tablets?\b|pharmac|prescription/,"medicine"],
  [/umbrella|\brain(ing|y|s)?\b/,"umbrella"],[/suitcase|luggage|baggage|\bpack(ing)?\b/,"suitcase"],
  [/camera|photos?\b|pictures?\b/,"camera"],[/phone|call (me|you|back)|text (me|you)|\bnumber\b|message|voicemail/,"phone"],
  [/\b(a|the|this|my|your|that) book\b|\bbooks\b|\breading\b|novel|library/,"book"],[/laptop|computer|website|online|\bapp\b|email|e-mail/,"laptop"],
  [/report|document|contract|proposal|\bform\b|paperwork|résumé|resume|survey/,"doc"],[/numbers|sales|revenue|growth|budget|data|percent|%|quarter|figures|chart|slides|results/,"chart"],
  [/pizza/,"pizza"],[/noodles?|ramen|pasta|spaghetti/,"noodles"],[/bibimbap|kimchi|salad/,"bowl"],[/\bsoup\b|stew/,"soup"],
  [/burger|sandwich/,"burger"],[/\bcake\b|dessert|ice cream|birthday/,"cake"],[/bread|bakery|toast/,"bread"],[/pancakes?|breakfast/,"pancakes"],
  [/\bfish\b|seafood|sushi/,"fish"],[/chicken|steak|meat|bbq|barbecue/,"chicken"],[/\brice\b/,"rice"],[/apples?|fruit|banana|orange/,"apple"],
  [/lunch|dinner|\beat\b|food|hungry|restaurant|delicious|tasty/,"bowl"],
  [/gift|present\b|souvenir/,"gift"],[/flowers?/,"flower"],
  [/\btaxi\b|\bcab\b/,"taxi"],[/\bcar\b|\bdriv(e|ing)\b|traffic|parking/,"car"],[/\bbus\b/,"bus"],[/train|subway|\bktx\b|station|line \d|transfer/,"train"],
  [/airport|\bfly\b|plane|abroad|overseas/,"plane"],[/package|parcel|deliver|shipping|on its way/,"box"],[/\bmail\b|letter|post office/,"mail"],
  [/\bbank\b|\bsav(e|ing)\b|\bmoney\b|salary|loan/,"money"],
  [/hospital|clinic|doctor|check-?up/,"hospital"],[/headache|stomach|sore|cough|\bcold\b|\bsick\b|hurts?\b|flu\b/,"pills"],
  [/sleep|\bbed\b|tired|sleepy|stayed up|\blate last night/,"bed"],[/\bgym\b|exercise|work(ing)? out|\brun(ning)?\b|jog|yoga|healthy|swim/,"dumbbell"],
  [/baseball|\bgame\b|\bmatch\b/,"ball"],[/soccer|football/,"soccer"],[/guitar|piano|\bband\b|instrument/,"guitar"],[/music|\bsongs?\b|concert|sing/,"note"],
  [/movie|film|\bshow\b|drama|series|tv\b|netflix|watch(ed|ing)? /,"tv"],[/\bdogs?\b|\bcats?\b|\bpets?\b|puppy/,"dog"],
  [/hik(e|ing)|mountain|camping/,"mountain"],[/beach|\bsea\b|island|jeju|ocean/,"beach"],[/school|class\b|student|teacher|study|learn/,"school"],
  [/family|wife|husband|\bson\b|daughter|kids|children|parents|mom|dad|brother|sister|baby/,"photo"],
  [/apartment|house|home\b|\bmove (in|out)|neighborhood|rent\b|room\b/,"house"],[/office|company|\bjob\b|work\b|boss|meeting|client|team|project|career|interview/,"briefcase"],
  [/sunny|\bhot\b|warm|weather|\bsun\b/,"sun"],[/snow|freezing|\bcold\b/,"snow"],
  [/\bat \d|o'clock|\d:\d\d|minutes|\bhours?\b|\blate\b|early|what time|\bnoon\b|tonight|morning|afternoon|evening/,"clock"],
  [/monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|tomorrow|next week|schedule|calendar|appointment|reservation|book (a|the)|plans?\b|free\b|available|holiday|vacation|day off/,"calendar"],
  [/\blove\b|\blike (it|this|that)\b|favorite/,"heart"],[/idea|how about|let's|why don't we|suggest|recommend/,"idea"]
];
const OFFER=/\b(here (you go|you are|is|are|'s)|this is (your|for you)|take this|your (order|tickets?|(room )?key|receipt|change|card|passport|coffee|drink|food|bag|medicine|menu|bill))\b|^(okay|sure|all right),? (one|two|here)\b/;
const REQUEST=/\b(can i (get|have|see|pay|borrow|try)|could i (get|have|see)|i'?d like|i want|i'?ll (have|take|get)|do you have|i need|i'?m looking for|may i (have|see)|is there|are there|let me get)\b/;
const CONSUME=/\b(delicious|tasty|tastes|so good|yummy|try (this|it|some)|drink|eat|eating|sip)\b/;
// Pick the prop, action and face for one line. Returns {act, prop, hand, face}.
export function planLine(en,base){
  const t=en.toLowerCase();
  const r=RULES.find(x=>x[0].test(t)),prop=r?r[1]:"";
  let face=/\b(great|wow|awesome|love|glad|happy|excited|congrat|perfect|amazing|wonderful|fantastic|delicious|beautiful|fun|lucky|can't wait|nice)\b/.test(t)?"happy"
    :/^(really\?|wow|what\?|oh no|seriously|no way)|\bwhat happened\b|\breally\?/.test(t)?"surp"
    :/\b(sorry|unfortunately|sad|bad|terrible|awful|problem|lost|broken|wrong|worried|sick|hurts?|headache|fever|missed|can't find|delayed|cancel(l?ed)?|disappoint|frustrat|stressed|afraid|not happy|complain|upset)\b/.test(t)?"sad":"";
  let act="",hand=false;
  if(/\b(headache|fever|sore throat|stomach|my .{0,10}hurts|i feel sick|i'?m sick|a cold|cough)\b/.test(t))act="sick";
  else if(/\b(tired|sleepy|exhausted|stayed up|didn'?t sleep|couldn'?t sleep)\b/.test(t))act="sleepy";
  else if(/\b(worried|nervous|oh no|i lost|can't find|i forgot|stressed)\b/.test(t))act="worried";
  else if(/\b(haha|funny|hilarious|joke|kidding)\b/.test(t))act="laugh";
  else if(/\b(congrat|well done|good job|great job|good for you)\b/.test(t))act="clap";
  else if(/\b(i (don'?t|do not) know|not sure|no idea|it depends|who knows|i guess)\b/.test(t))act="shrug";
  else if(/\b(it'?s a deal|deal\b|let'?s shake|agreed)\b/.test(t))act="shake";
  else if(/^(wow|really|oh no|what\?|no way|seriously)\b/.test(t))act="surprise";
  if(!act&&prop){
    if(OFFER.test(t)&&HAND.has(prop)){act="give";hand=true;}
    else if(prop==="phone"&&/\b(call|calling|phone)\b/.test(t)){act="phone";hand=true;}
    else if(/^(cup|iced|tea|glass|juice|wine)$/.test(prop)&&CONSUME.test(t)){act="drink";hand=true;}
    else if(/^(pizza|noodles|bowl|soup|burger|cake|bread|pancakes|fish|chicken|rice|apple)$/.test(prop)&&CONSUME.test(t)){act="eat";hand=true;}
    else if(prop==="clock"&&/\b(late|hurry|what time|minutes|o'clock|at \d)\b/.test(t))act="watch";
    else if(/^(doc|clip|chart)$/.test(prop)&&/\b(sign|write|fill|note)\b/.test(t)){act="write";hand=true;}
    else if(prop==="laptop"&&/\b(type|email|send|check|look)\b/.test(t)){act="show";hand=true;}
    else if(REQUEST.test(t)){act="ask";}
    else if(HAND.has(prop)&&/\b(this|these|my|here|look)\b/.test(t)){act="show";hand=true;}
  }
  if(!act)act=base;
  if(act==="give"&&!prop)hand=false;
  return {act,prop,hand,face};
}
