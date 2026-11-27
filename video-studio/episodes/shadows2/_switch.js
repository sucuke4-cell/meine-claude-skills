  switch (sc.id) {
    case 1: { // recap: the writing on the wall
      tod = 'night'; roomLight = 0.6; wallK = 1; fadeHand = 1;
      place(theo, ROOM.x - 0.6, ROOM.z + 0.9, Math.PI); setCast(theo, false); setFace(theo, 'worried');
      placeShadow(theoShadow, ROOM.x - 2.4, ROOM.z - 0.8, Math.PI, 1);
      camPos = lerpV(v3(ROOM.x + 1.8, 3.3, ROOM.z + 3.8), v3(ROOM.x + 1.4, 3.2, ROOM.z + 3.0), ease(u)); look = v3(ROOM.x - 1.5, 2.7, ROOM.z - 2.9);
      break;
    }
    case 2: { // the drawings
      tod = 'night'; roomLight = 0.6; wallK = 1; fadeHand = 1;
      place(theo, ROOM.x - 0.9, ROOM.z + 1.2, faceTo(-0.9, 1.2, -3.9, -1.1)); setCast(theo, false);
      setFace(theo, t < vs('blacksun') ? 'worried' : 'shock');
      placeShadow(theoShadow, ROOM.x - 3.0, ROOM.z - 0.2, -Math.PI / 2, 1);
      const drawing = (t > vs('drew') + 0.3 && t < vs('fades') + 0.5) || (t > vs('tonight') && t < vs('tonight') + 1.5);
      pose(theoShadow.userData.av, drawing ? { armRx: -1.9 + Math.sin(t * 9) * 0.3, armRz: Math.sin(t * 6) * 0.3 } : {});
      dK = [clamp((t - vs('drew') - 0.5) / 1.4), clamp((t - vs('blacksun') + 0.6) / 1.0), clamp((t - vs('fades') + 0.3) / 3.0), clamp((t - vs('tonight') - 0.1) / 1.2)];
      if (t < vs('never') - 0.2) { camPos = lerpV(v3(ROOM.x + 0.9, 2.3, ROOM.z + 0.2), v3(ROOM.x + 0.6, 2.3, ROOM.z - 0.2), ease((t - sc.start) / 5)); look = v3(ROOM.x - 3.9, 2.4, ROOM.z - 1.1); }
      else if (t < vs('tonight') - 0.2) { camPos = lerpV(v3(ROOM.x + 0.4, 2.4, ROOM.z - 0.8), v3(ROOM.x + 0.2, 2.4, ROOM.z - 1.0), ease((t - vs('never')) / 7)); look = v3(ROOM.x - 3.9, 2.4, ROOM.z - 1.1); }
      else { camPos = v3(ROOM.x + 0.5, 2.3, ROOM.z + 3.2); look = v3(ROOM.x - 0.9, 2.2, ROOM.z + 1.2); }
      break;
    }
    case 3: { // Mom and her shadow
      tod = 'night'; roomLight = 0.7; wallK = 1; fadeHand = 1; dK = [1, 1, 1, 1];
      place(theo, ROOM.x - 0.9, ROOM.z + 1.2, faceTo(-0.9, 1.2, 2.4, 2.0)); setCast(theo, false); setFace(theo, t < vs('turned') ? 'worried' : 'shock');
      place(mom, ROOM.x + 2.4, ROOM.z + 2.0, faceTo(2.4, 2.0, -0.9, 1.2)); setFace(mom, 'smile'); setCast(mom, false);
      placeShadow(momShadow, ROOM.x + 3.75, ROOM.z + 1.6, -Math.PI / 2, 1);
      const ms = momShadow.userData.av; ms.scale.z = 0.12;
      const turn = ease((t - vs('turned') - 1.2) / 1.2);
      ms.userData.P.head.rotation.y = -1.1 * turn;
      smileOp = clamp((t - vs('smiled') - 1.0) / 0.8);
      if (t < vs('turned') - 0.2) { camPos = lerpV(v3(ROOM.x - 0.4, 2.3, ROOM.z + 4.4), v3(ROOM.x - 0.2, 2.3, ROOM.z + 4.0), ease(u * 2)); look = v3(ROOM.x + 1.8, 2.1, ROOM.z + 1.8); }
      else { camPos = lerpV(v3(ROOM.x + 0.2, 2.5, ROOM.z - 0.2), v3(ROOM.x + 0.9, 2.6, ROOM.z + 0.3), ease((t - vs('turned')) / 5)); look = v3(ROOM.x + 3.6, 2.8, ROOM.z + 1.7); flicker = 0.5; }
      break;
    }
    case 4: { // nine o'clock: the black sun rises
      tod = 'night'; towerH = 9; towerM = 0;
      sunY = lerp(-2, 13, ease((t - vs('rose')) / 4.5));
      if (t < vs('rose') - 0.2) { camPos = lerpV(v3(-4.5, 8.0, -9.0), v3(-4.8, 8.4, -10.5), ease((t - sc.start) / 3)); look = v3(-6, 8.6, -13.4); }
      else { camPos = lerpV(v3(4, 2.0, 9), v3(6, 2.4, 8), ease((t - vs('rose')) / 5)); look = v3(24, 7, -13); fov = 48; }
      break;
    }
    case 5: { // lights die, people fade
      tod = 'night'; sunY = 13; lampsOut = clamp((t - vs('died')) / 2.6) * 4;
      town.forEach((a, i) => { if (i > 2) return; const [x, z] = [[-4.5, 2.9], [4.0, 3.1], [-9, -2.9]][i]; place(a, x, z, faceTo(x, z, 0, 0)); setFace(a, 'shock'); pose(a, { armLx: -1.2, armRx: -1.2, headX: 0.4 }); setOpacity(a, 1 - 0.6 * clamp((t - vs('died') - 1 - i * 0.4) / 2)); });
      place(mom, 1.5, -5.3, 0); setFace(mom, 'worried'); pose(mom, { armLx: -1.3, armRx: -1.3, headX: 0.4 });
      setOpacity(mom, 1 - 0.65 * clamp((t - vs('hands') + 0.5) / 2));
      place(theo, 2.3, -4.6, faceTo(2.3, -4.6, 1.5, -5.3)); setFace(theo, 'shock'); setCast(theo, false); fadeHand = 1;
      if (t < vs('hands') - 0.2) { camPos = lerpV(v3(-2, 3.0, 9), v3(-1, 2.8, 8), ease((t - sc.start) / 4)); look = v3(0, 2.2, -2); fov = 56; }
      else if (t < vs('holdon') - 0.1) { camPos = v3(2.7, 2.3, -2.2); look = v3(1.5, 2.0, -5.2); }
      else { camPos = v3(0.6, 2.3, -2.6); look = v3(2.3, 2.25, -4.6); }
      break;
    }
    case 6: { // the plan, running to the tower
      tod = 'night'; sunY = 13; lampsOut = 4;
      const k = clamp(lt / dur);
      const WP = [[1.5, 1.6], [-3.75, -3.0], [-3.75, -11.0], [-5.0, -11.9]], seg = [0, 0.4, 0.85, 1];
      let si = k < 0.4 ? 0 : k < 0.85 ? 1 : 2; const kk = (k - seg[si]) / (seg[si + 1] - seg[si]);
      const px = lerp(WP[si][0], WP[si + 1][0], kk), pz = lerp(WP[si][1], WP[si + 1][1], kk);
      const dir = faceTo(WP[si][0], WP[si][1], WP[si + 1][0], WP[si + 1][1]);
      place(theo, px, pz, dir); setCast(theo, false); setFace(theo, 'determined'); fadeHand = 1;
      pose(theo, walkPose(t * 14, 0.9, { bodyX: 0.2 }));
      placeShadow(theoShadow, px + Math.cos(dir) * 1.1, pz - Math.sin(dir) * 1.1, dir, 1, t * 14 + 1, 0.9); moonBoost = 1;
      camPos = v3(px - Math.sin(dir) * 4.2, 2.6, pz - Math.cos(dir) * 4.2); look = v3(px + Math.sin(dir) * 2, 1.6, pz + Math.cos(dir) * 2); fov = 56;
      break;
    }
    case 7: { // the Foreman at the tower
      tod = 'night'; sunY = 13; lampsOut = 4; moonBoost = 1;
      place(theo, -5.0, -11.9, faceTo(-5.0, -11.9, -5.1, -13.4)); setCast(theo, false); setFace(theo, 'shock'); fadeHand = 1;
      const fk = ease((t - sc.start) / 1.4);
      const tj = vs('jumped') + 0.6, jk = ease((t - tj) / 0.6);
      placeShadow(foreman, lerp(-9.0, -7.0, fk) - jk * 0.6, -12.0 - jk * 0.6, faceTo(-7.0, -12.0, -5.0, -11.9), 1);
      placeShadow(theoShadow, lerp(-4.0, -6.6, jk), lerp(-11.2, -12.2, jk), faceTo(-4.0, -11.2, -7.0, -12.0), 1);
      if (jk > 0) { pose(theoShadow.userData.av, { armLx: -1.6, armRx: -1.6, bodyX: 0.4 }); pose(foreman.userData.av, { armLx: -1.2 + Math.sin(t * 13) * 0.4, armRx: -1.2 - Math.sin(t * 13) * 0.4, bodyX: -0.3 }); shake = 0.5; }
      if (t > vs('now') - 0.2) { setFace(theo, 'determined'); theo.rotation.y = faceTo(-5.0, -11.9, -5.1, -13.4); pose(theo, { armRx: -2.4 }); }
      if (t < vs('jumped') - 0.2) { camPos = lerpV(v3(-3.2, 2.8, -12.6), v3(-3.5, 2.9, -13.0), ease(u * 2)); look = v3(-7.0, 3.3, -12.0); }
      else if (t < vs('now') - 0.2) { camPos = v3(-2.0, 3.0, -13.6); look = v3(-6.4, 1.8, -12.2); fov = 58; }
      else { camPos = v3(-3.6, 2.2, -10.0); look = v3(-5.1, 1.6, -13.3); }
      break;
    }
    case 8: { // the lever: the whole town turns to light
      tod = 'night'; sunY = 13;
      place(theo, -5.0, -11.9, Math.PI); setCast(theo, false); setFace(theo, 'determined'); fadeHand = 1; pose(theo, { armRx: -2.0 });
      leverK = ease((t - vs('lever') - 0.3) / 0.5);
      const tl = vs('lever') + 0.8;
      if (t >= tl) { lampBoost = clamp(1 - (t - tl - 1.5) / 3); flash = clamp(1 - (t - tl) / 0.8) * 0.9; flashCol = '#fffbe8'; lampsOut = 0; } else lampsOut = 4;
      if (t < tl) { camPos = v3(-4.0, 1.9, -10.6); look = v3(-5.1, 1.5, -13.3); }
      else { camPos = lerpV(v3(-3, 10, -6), v3(-1, 11, -3), ease((t - tl) / 5)); look = v3(8, 0, 0); fov = 58; }
      break;
    }
    case 9: { // the black sun cracks, shadows pulled home
      tod = 'night'; lampBoost = clamp(0.6 - lt / 10);
      const tc = sc.start + 0.4;
      crackT = t - tc; sunY = 13;
      town.forEach((a, i) => { if (i > 2) return; const [x, z] = [[-4.5, 2.9], [4.0, 3.1], [-9, -2.9]][i]; place(a, x, z, faceTo(x, z, 0, 0)); setFace(a, 'shock');
        const pk = clamp((t - vs('cracked') - 1.4 - i * 0.25) / 0.9);
        if (pk < 1) placeShadow(townShadows[i], lerp(x + 8, x + 0.9, ease(pk)), lerp(z - 6, z - 0.2, ease(pk)), Math.PI / 2, 1 - ease(pk)); });
      if (t < vs('cracked') + 1.3) { camPos = v3(6, 2.4, 8); look = v3(24, 10, -13); fov = 48; }
      else { camPos = lerpV(v3(0, 6, 11), v3(0, 5, 9), ease((t - vs('cracked') - 1.3) / 4)); look = v3(-2, 0.5, 1.5); fov = 56; }
      break;
    }
    case 10: { // Mom can feel her hands again
      tod = 'night'; lampBoost = 0.25;
      place(mom, 1.5, -5.3, 0); setFace(mom, 'laugh'); pose(mom, t < vs('didit') ? { armLx: -1.3, armRx: -1.3, headX: 0.4 } : { armLx: -0.4, armLz: 0.3 });
      place(theo, 2.3, -4.4, faceTo(2.3, -4.4, 1.5, -5.3)); setFace(theo, t < vs('down') ? 'laugh' : 'smile'); setCast(theo, false);
      placeShadow(foreman, 2.3, -4.4, Math.PI * 0.75, 0); foremanEyeOp = 0;
      if (t < vs('down') - 0.2) { camPos = lerpV(v3(3.2, 2.4, -1.2), v3(2.9, 2.3, -1.8), ease(u * 1.5)); look = v3(1.7, 2.1, -5.0); }
      else { camPos = lerpV(v3(4.8, 2.9, -1.0), v3(4.5, 2.8, -1.5), ease((t - vs('down')) / 4)); look = v3(2.3, 1.9, -4.4); pose(theo, { headX: 0.5 }); }
      break;
    }
    case 11: { // the top hat
      tod = 'night'; lampBoost = 0.25;
      place(theo, 2.3, -4.4, faceTo(2.3, -4.4, 1.5, -5.3)); setFace(theo, t < vs('tophat') + 1.5 ? 'smile' : 'shock'); setCast(theo, false); pose(theo, { headX: 0.5 });
      placeShadow(foreman, 2.3, -4.4, Math.PI * 0.75, 0);
      foremanEyeOp = clamp((t - ve('tophat') - 0.3) / 0.4);
      camPos = lerpV(v3(1.6, 6.8, 1.2), v3(1.3, 6.0, 0.4), ease(u)); look = v3(0.7, 0, -2.6); fov = 50;
      tint = clamp((t - (sc.end - 3.2)) / 0.6) * 0.5;
      if (t >= sc.end - 3.2) { big = 'PART 3?'; bigColor = '#ffffff'; sub = 'Where is Theo\'s<br>REAL shadow? 👇'; bop = clamp((t - (sc.end - 3.2)) / 0.3); }
      break;
    }
  }
