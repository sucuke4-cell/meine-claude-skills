  bigSun.visible = false; sunCage.visible = false; hallLight.intensity = 0; aimFlash(false); theoCard.visible = false; maraTag.visible = false;
  hangers.forEach(h => h.visible = false); maraShadow.visible = false;
  const H = (x, y, z) => v3(HALL.x + x, y, HALL.z + z);
  const inHall = sc.id >= 6;
  if (inHall) { hallLight.intensity = 70; moonBoost = 1; hangers.forEach(h => hang(h, h.userData.hook, t)); hang(maraShadow, MARA_HOOK, t); maraTag.visible = true; }
  switch (sc.id) {
    case 1: { // the top-hat shadow
      tod = 'night'; lampBoost = 0.25;
      place(theo, 2.3, -4.4, faceTo(2.3, -4.4, 1.5, -5.3)); setFace(theo, 'worried'); setCast(theo, false); pose(theo, { headX: 0.5 });
      placeShadow(foreman, 2.3, -4.4, Math.PI * 0.75, 0); foremanEyeOp = 1;
      camPos = lerpV(v3(1.3, 6.0, 0.4), v3(1.1, 5.4, -0.4), ease(u)); look = v3(0.7, 0, -2.6); fov = 50;
      break;
    }
    case 2: { // one second too late / whispers at night
      if (t < vs('whispered') - 0.2) {
        tod = 'morning'; focus = v3(-2, 0, 3);
        const px = tt => -7 + (tt - sc.start) * 0.9;
        place(theo, px(t), 3.0, Math.PI / 2); setCast(theo, false); setFace(theo, 'worried'); pose(theo, walkPose(t * 6, 0.45));
        placeShadow(foreman, px(t - 1.0) + 0.3, 2.7, 1.07, 0, (t - 1.0) * 6, 0.45); foremanEyeOp = 0;
        camPos = v3(px(t) - 1.2, 1.9, 7.6); look = v3(px(t) - 0.6, 0.4, 2.6); fov = 56;
      } else {
        tod = 'night'; roomLight = 0.15; wallK = 1; dK = [1, 1, 1, 1];
        place(theo, ROOM.x - 2.6, ROOM.z + 0.2, 0, 0.75); theo.rotation.x = -Math.PI / 2; setCast(theo, false); setFace(theo, 'worried');
        placeShadow(foreman, ROOM.x - 1.2, ROOM.z - 2.78, 0, 1); foreman.userData.av.scale.z = 0.18; foremanEyeOp = 1;
        camPos = lerpV(v3(ROOM.x - 0.4, 2.6, ROOM.z + 3.6), v3(ROOM.x - 0.6, 2.7, ROOM.z + 2.9), ease((t - vs('whispered')) / 5)); look = v3(ROOM.x - 1.6, 2.2, ROOM.z - 2.6);
      }
      break;
    }
    case 3: { // I'm taking you with me
      tod = 'night'; roomLight = 0.15; wallK = 1; dK = [1, 1, 1, 1]; flicker = 0.4;
      const sit = ease((t - vs('takingyou') - 0.3) / 0.8);
      place(theo, ROOM.x - 2.6, ROOM.z + 0.2, 0, lerp(0.75, 0.6, sit)); theo.rotation.x = lerp(-Math.PI / 2, 0, sit); setCast(theo, false); setFace(theo, 'shock');
      placeShadow(foreman, ROOM.x - 1.2, ROOM.z - 2.78, 0, 1); foreman.userData.av.scale.z = 0.18; foremanEyeOp = 1;
      const fs = foreman.userData.av; fs.scale.setScalar(1.5 + 0.4 * ease((t - vs('takingyou')) / 2)); fs.scale.z = 0.18;
      if (t < vs('takingyou') - 0.1) { camPos = lerpV(v3(ROOM.x - 0.6, 3.6, ROOM.z + 1.0), v3(ROOM.x - 0.8, 3.7, ROOM.z + 0.3), ease(u * 2)); look = v3(ROOM.x - 1.2, 3.8, ROOM.z - 2.7); }
      else { camPos = v3(ROOM.x - 0.2, 2.3, ROOM.z + 3.0); look = v3(ROOM.x - 1.8, 1.8, ROOM.z - 0.8); }
      break;
    }
    case 4: { // Mom believes him
      tod = 'night'; roomLight = 0.7; wallK = 1; dK = [1, 1, 1, 1];
      place(theo, ROOM.x - 0.6, ROOM.z + 1.2, faceTo(-0.6, 1.2, 1.4, 1.8)); setCast(theo, false); setFace(theo, t < vs('timeclock') ? 'worried' : 'determined');
      place(mom, ROOM.x + 1.4, ROOM.z + 1.8, faceTo(1.4, 1.8, -0.6, 1.2)); setCast(mom, false); setFace(mom, t < vs('believe') ? 'worried' : 'determined');
      placeShadow(foreman, ROOM.x - 0.6, ROOM.z + 1.2, Math.PI * 0.8, 0); foremanEyeOp = 0;
      if (t < vs('believe') - 0.1) { camPos = v3(ROOM.x + 0.6, 2.3, ROOM.z + 3.6); look = v3(ROOM.x - 0.6, 2.2, ROOM.z + 1.2); }
      else if (t < vs('timeclock') - 0.1) { camPos = v3(ROOM.x - 0.2, 2.3, ROOM.z + 3.2); look = v3(ROOM.x + 1.4, 2.2, ROOM.z + 1.8); }
      else { camPos = lerpV(v3(ROOM.x + 0.4, 2.5, ROOM.z + 4.6), v3(ROOM.x + 0.4, 2.4, ROOM.z + 4.0), ease((t - vs('timeclock')) / 6)); look = v3(ROOM.x + 0.4, 1.9, ROOM.z + 1.5); }
      break;
    }
    case 5: { // into the factory
      tod = 'night'; moonBoost = 1;
      if (t < vs('door') - 0.2) {
        focus = v3(22, 0, -8);
        const k = ease((t - sc.start) / 4.2);
        place(theo, lerp(18, 25.0, k), -6.6, Math.PI / 2 - 0.3); setCast(theo, true); setFace(theo, 'worried'); pose(theo, walkPose(t * 5, 0.35, { bodyX: 0.3 }));
        place(mom, lerp(16.8, 23.8, k), -6.2, Math.PI / 2 - 0.3); setFace(mom, 'worried'); pose(mom, walkPose(t * 5 + 1, 0.35, { armRx: -1.4 }));
        aimFlash(true, v3(26, 1.6, -8.4));
        camPos = v3(lerp(14, 19, k), 2.4, -1.6); look = v3(lerp(20, 25, k), 1.8, -7.2);
      } else {
        focus = FAC.clone();
        const k = ease((t - vs('door')) / 3.5);
        place(theo, FAC.x + 0.6, FAC.z + lerp(4, 0, k), Math.PI); setCast(theo, false); pose(theo, walkPose(t * 5, 0.3));
        place(mom, FAC.x - 0.6, FAC.z + lerp(4.6, 0.6, k), Math.PI); pose(mom, { ...walkPose(t * 5 + 1, 0.3), armRx: -1.4 });
        aimFlash(true, v3(FAC.x - 2.5, 1.8, FAC.z - 8.7));
        camPos = lerpV(v3(FAC.x + 1.8, 2.6, FAC.z + 9.0), v3(FAC.x + 1.2, 2.4, FAC.z + 6.5), k); look = v3(FAC.x - 1.2, 2.0, FAC.z - 8.7);
      }
      break;
    }
    case 6: { // the hall of hanging shadows
      tod = 'night'; focus = HALL.clone();
      hang(theoShadow, THEO_HOOK, t);
      const k = ease((t - sc.start) / 3.0);
      place(theo, HALL.x + 1.2, HALL.z + lerp(9.5, 6.0, k), Math.PI); setCast(theo, false); setFace(theo, t < vs('there') ? 'shock' : 'determined');
      if (t >= vs('there') - 0.2) { theo.rotation.y = faceTo(1.2, 6.0, THEO_HOOK.x, THEO_HOOK.z); pose(theo, { armRx: -1.6, armRz: 0.2 }); } else pose(theo, k < 1 ? walkPose(t * 5, 0.3) : {});
      place(mom, HALL.x - 0.4, HALL.z + lerp(10, 6.6, k), Math.PI); setFace(mom, 'shock'); pose(mom, { armRx: -1.4 });
      aimFlash(true, H(lerp(-4, 2.7, ease((t - vs('hooks')) / 5)), 2.0, 3.0));
      if (t < vs('there') - 0.2) { camPos = lerpV(v3(HALL.x + 0.4, 3.0, HALL.z + 12.5), v3(HALL.x + 0.2, 3.2, HALL.z + 10.0), ease(u * 1.5)); look = H(0, 2.2, -1); fov = 56; }
      else { camPos = v3(HALL.x + 3.6, 2.6, HALL.z + 7.6); look = H(2.7, 2.4, 3.0); }
      break;
    }
    case 7: { // the top-hat shadow stands up and drags Theo
      tod = 'night'; focus = HALL.clone(); hang(theoShadow, THEO_HOOK, t);
      const up = ease((t - vs('stoodup') - 0.8) / 1.2);
      const dr = ease((t - vs('nobody') - 0.2) / 2.4);
      const tz = lerp(5.2, 8.6, dr);
      place(theo, HALL.x + 2.0, HALL.z + tz, Math.PI); setCast(theo, false); setFace(theo, 'shock');
      pose(theo, dr > 0 ? { armLx: -1.6, armRx: -1.6, bodyX: -0.35, legL: -0.3, legR: -0.3 } : { armRx: -1.0 });
      placeShadow(foreman, HALL.x + 2.0, HALL.z + tz + 0.9 * up + 0.01, Math.PI, up); foremanEyeOp = 1;
      if (up >= 1) pose(foreman.userData.av, { armLx: -1.2, armRx: -1.2 });
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, 2.0, tz)); setFace(mom, 'shock'); pose(mom, { armRx: -0.5 });
      shake = dr > 0 && dr < 1 ? 0.3 : 0;
      if (t < vs('nobody') - 0.1) { camPos = lerpV(v3(HALL.x + 6.8, 3.0, HALL.z + 2.6), v3(HALL.x + 6.4, 3.2, HALL.z + 3.2), ease(u * 1.5)); look = H(2.0, 2.4, 6.2); fov = 58; }
      else { camPos = lerpV(v3(HALL.x + 7.2, 3.4, HALL.z + 4.2), v3(HALL.x + 7.2, 3.4, HALL.z + 6.8), dr); look = H(2.0, 2.4, tz + 0.4); fov = 58; }
      break;
    }
    case 8: { // the flashlight
      tod = 'night'; focus = HALL.clone(); hang(theoShadow, THEO_HOOK, t);
      const fl = ease((t - sc.start - 0.3) / 0.6);
      const back = ease((t - vs('hate')) / 2.5);
      place(theo, HALL.x + 2.0, HALL.z + 8.6, Math.PI); setCast(theo, false); setFace(theo, 'shock'); pose(theo, { bodyX: 0.2 });
      placeShadow(foreman, HALL.x + 2.0 + back * 4, HALL.z + 9.5 + back * 2.5, Math.PI, 1);
      const fa = foreman.userData.av; fa.scale.setScalar(1.5 - 0.5 * fl); pose(fa, { armLx: -2.4, armRx: -2.4, armLz: -0.5, armRz: 0.5, bodyX: -0.3 });
      foremanEyeOp = 1;
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, 2.0, 9.5)); setFace(mom, 'determined'); pose(mom, { armRx: -1.5 });
      aimFlash(fl > 0, H(2.0 + back * 4, 2.6, 9.5 + back * 2.5));
      if (t < vs('hate') - 0.1) { camPos = v3(HALL.x - 1.8, 2.4, HALL.z + 5.0); look = H(0.6, 2.2, 8.2); }
      else { camPos = lerpV(v3(HALL.x + 0.2, 2.0, HALL.z + 5.0), v3(HALL.x + 0.6, 2.2, HALL.z + 5.6), ease((t - vs('hate')) / 3)); look = H(2.6 + back * 3, 2.6, 9.6 + back * 2); }
      break;
    }
    case 9: { // punch the card
      tod = 'night'; focus = HALL.clone(); hang(theoShadow, THEO_HOOK, t);
      const run = ease((t - sc.start) / 1.6);
      place(theo, HALL.x + lerp(2.0, 8.9, run), HALL.z + lerp(8.6, 6.2, run), run < 1 ? faceTo(2.0, 8.6, 8.9, 6.2) : Math.PI / 2); setCast(theo, false); setFace(theo, 'determined');
      pose(theo, run < 1 ? walkPose(t * 14, 0.9) : { armRx: -1.4 });
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, 8.9, 6.2)); setFace(mom, 'worried'); pose(mom, { armRx: -1.3 });
      aimFlash(true, H(9.5, 1.6, 6.5));
      theoCard.visible = true;
      const ck = ease((t - vs('punched') - 0.6) / 1.0);
      theoCard.position.set(HALL.x + 9.75 - 0.6 * (1 - ck), lerp(2.05, 1.32, ck), HALL.z + lerp(4.6, 6.5, ck)); theoCard.rotation.set(0, -Math.PI / 2, 0);
      const tp = vs('punched') + 1.7;
      if (t >= tp) { flash = clamp(1 - (t - tp) / 0.5) * 0.6; flashCol = '#fff6d0'; shake = clamp(0.6 - (t - tp)); }
      camPos = lerpV(v3(HALL.x + 5.2, 2.6, HALL.z + 10.0), v3(HALL.x + 5.8, 2.4, HALL.z + 9.4), ease(u)); look = H(9.4, 1.7, 6.3);
      break;
    }
    case 10: { // his real shadow comes home
      tod = 'night'; focus = HALL.clone();
      const wake = ease((t - sc.start - 0.2) / 0.6), runK = clamp((t - sc.start - 1.0) / 2.2);
      place(theo, HALL.x + 8.6, HALL.z + 6.2, -Math.PI / 2); setCast(theo, false); setFace(theo, t > vs('back') - 0.2 ? 'laugh' : 'shock');
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, 6.0, 5.0)); setFace(mom, 'smile'); pose(mom, { armRx: -1.3 });
      aimFlash(true, H(7.0, 0.4, 6.0));
      if (runK <= 0) hang(theoShadow, THEO_HOOK, t, wake);
      else if (runK < 1) { const x = lerp(THEO_HOOK.x, 7.4, runK), z = lerp(THEO_HOOK.z, 6.2, runK); placeShadow(theoShadow, HALL.x + x, HALL.z + z, faceTo(THEO_HOOK.x, THEO_HOOK.z, 7.4, 6.2), 1, t * 14, 0.9); }
      else { const lie = ease((t - sc.start - 3.2) / 0.6); placeShadow(theoShadow, HALL.x + 8.3, HALL.z + 6.2, Math.PI / 2, 1 - lie); }
      if (t > vs('waved') - 0.1) { pose(theoShadow.userData.av, { armRx: -2.7, armRz: 0.3 + Math.sin(t * 10) * 0.3 }); pose(theo, { armRx: -2.7, armRz: 0.3 + Math.sin(t * 10) * 0.3 }); }
      if (t < vs('back') - 0.2) { camPos = lerpV(v3(HALL.x + 5.2, 3.0, HALL.z + 9.8), v3(HALL.x + 5.0, 3.2, HALL.z + 9.4), ease(u)); look = H(5.0, 1.4, 4.6); fov = 56; }
      else if (t < vs('waved') - 0.2) { camPos = v3(HALL.x + 6.4, 2.3, HALL.z + 6.4); look = H(8.6, 2.2, 6.2); }
      else { camPos = lerpV(v3(HALL.x + 6.6, 5.4, HALL.z + 7.4), v3(HALL.x + 6.8, 5.0, HALL.z + 7.0), ease((t - vs('waved')) / 3)); look = H(8.2, 0, 6.2); fov = 52; }
      break;
    }
    case 11: { // Mara's hook
      tod = 'night'; focus = HALL.clone();
      placeShadow(theoShadow, HALL.x + 8.3, HALL.z + 6.2, Math.PI / 2, 0);
      place(theo, HALL.x + 8.6, HALL.z + 6.2, faceTo(8.6, 6.2, -0.6, 6.8)); setCast(theo, false); setFace(theo, t < vs('mom') ? 'worried' : 'shock');
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, MARA_HOOK.x, MARA_HOOK.z)); setFace(mom, t < vs('tag') + 1 ? 'worried' : 'shock'); pose(mom, { armRx: -1.4 });
      aimFlash(true, H(MARA_HOOK.x, 2.0, MARA_HOOK.z));
      if (t < vs('mom') - 0.2) { camPos = lerpV(v3(HALL.x - 3.4, 2.8, HALL.z - 0.2), v3(HALL.x - 4.8, 2.9, HALL.z - 1.8), ease((t - sc.start) / 6)); look = H(MARA_HOOK.x, 2.4, MARA_HOOK.z); }
      else if (t < vs('whose') - 0.2) { camPos = v3(HALL.x - 2.2, 2.3, HALL.z + 4.4); look = H(-0.6, 2.2, 6.8); }
      else {
        placeShadow(momShadow, HALL.x - 2.4, HALL.z + 8.4, Math.PI, 1); const ms = momShadow.userData.av; ms.scale.z = 0.14; momShadow.position.y = 0.02;
        smileOp = clamp((t - vs('whose') - 1.6) / 0.6);
        camPos = lerpV(v3(HALL.x - 0.4, 2.4, HALL.z + 4.0), v3(HALL.x - 0.5, 2.5, HALL.z + 4.6), ease((t - vs('whose')) / 4)); look = H(-1.5, 2.5, 7.6);
      }
      tint = clamp((t - (sc.end - 3.0)) / 0.6) * 0.55;
      if (t >= sc.end - 3.0) { big = 'PART 4?'; bigColor = '#ffffff'; sub = 'Whose shadow is<br>following <span style="color:#ffb3c7">Mom</span>? 👇'; bop = clamp((t - (sc.end - 3.0)) / 0.3); }
      break;
    }
  }
