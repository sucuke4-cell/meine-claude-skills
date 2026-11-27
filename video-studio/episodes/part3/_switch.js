  // lobby crowd (5 regular players) and the group helpers
  const CROWD = [[-2.6, 0.8], [-1.4, 1.6], [1.5, 1.4], [2.7, 0.6], [0.1, 2.6]];
  const groupSpots = [[-2.4, -0.2], [-1.5, 0.5], [-0.6, -0.3], [1.5, 0.3], [2.4, -0.2], [3.2, 0.6], [-3.3, 0.6], [-0.2, 0.8], [1.1, 1.1], [2.2, 1.2]];
  const groupAll = () => [...vanished, ...npcs];
  const cheer = (a, i, k = 1) => pose(a, { armLx: -2.8 * k, armRx: -2.8 * k, armLz: -0.3 * k, armRz: 0.3 * k, bob: Math.abs(Math.sin(t * 7 + i)) * 0.25 * k });
  open = 0; words = 0; fogRed = 0;
  const chainsOn = sc.id >= 3 && sc.id <= 8;
  chains = chainsOn ? 1 : 0;

  switch (sc.id) {
    case 1: { // recap
      miloTag.visible = true;
      if (lt < 3.2) { camPos = lerpV(v3(0.6, 2.6, 0.6), v3(0.4, 2.6, -1.3), ease(lt / 3.2)); look = v3(0, 2.5, -6); edge = 0.3; }
      else {
        place(juno, 1.9, -3.7, faceTo(1.9, -3.7, 0.9, -2.4)); setFace(juno, 'shock');
        place(admin, 0.9, -2.4, faceTo(0.9, -2.4, 1.9, -3.7));
        setFace(admin, t >= vs('welcome') - 0.1 ? 'redeyes' : 'smirk');
        camPos = lerpV(v3(1.3, 2.7, -5.6), v3(1.15, 2.6, -5.0), ease((lt - 3.2) / (dur - 3.2))); look = v3(0.9, 2.25, -2.4);
        if (t >= vs('welcome')) flicker = 0.6;
      }
      break;
    }
    case 2: { // Juno runs, admin smiles
      miloTag.visible = true;
      const k = clamp(lt / 3.0);
      const jx = lerp(1.9, -3.6, ease(k)), jz = lerp(-3.7, 0.6, ease(k));
      place(juno, jx, jz, faceTo(1.9, -3.7, -3.6, 0.6)); pose(juno, k < 1 ? walkPose(lt * 15, 0.95, { bodyX: 0.2 }) : {}); setFace(juno, 'shock');
      const ar = faceTo(0.9, -2.4, jx, jz);
      place(admin, 0.9, -2.4, ar); setFace(admin, 'smirk');
      if (t < vs('smiled') - 0.1) { camPos = v3(3.6, 3.4, 1.8); look = v3(-0.6, 1.2, -1.8); fov = 58; }
      else { const d = v3(Math.sin(ar), 0, Math.cos(ar)); camPos = v3(0.9 + d.x * 2.7, 2.4, -2.4 + d.z * 2.7); look = v3(0.9, 2.25, -2.4); }
      break;
    }
    case 3: { // the door is chained
      miloTag.visible = true;
      const k = clamp(lt / 2.6);
      const jx = lerp(-3.6, 1.2, ease(k)), jz = lerp(0.6, -4.25, ease(k));
      place(juno, jx, jz, k < 1 ? faceTo(-3.6, 0.6, 1.2, -4.25) : Math.PI);
      setFace(juno, 'worried');
      if (k < 1) pose(juno, walkPose(lt * 15, 0.95, { bodyX: 0.2 }));
      else { const bang = Math.max(0, Math.sin((t - vs('hear') + 1.0) * 7)); pose(juno, { armLx: -1.6 - bang * 0.3, armRx: -1.6 + bang * 0.3, bodyX: 0.1 }); shake = t < vs('hear') + 0.6 ? bang * 0.5 : 0; }
      if (t < vs('hear') - 0.2) { camPos = lerpV(v3(3.0, 2.8, -0.4), v3(2.6, 2.7, -1.2), ease(u)); look = v3(0.2, 2.3, -5.4); }
      else { camPos = lerpV(v3(-0.9, 2.7, -2.0), v3(-0.8, 2.65, -2.4), ease((t - vs('hear')) / 2)); look = v3(0.7, 2.4, -5.4); fov = 56; }
      edge = 0.25;
      break;
    }
    case 4: { // Milo's voice through the door
      place(juno, 1.25, -5.55, Math.PI / 2); setFace(juno, t > ve('crown') ? 'determined' : 'shock');
      pose(juno, { armLx: -0.9, armLz: 0.2, headZ: -0.15 });
      const talking = t >= vs('crown') && t < ve('crown') + 0.3;
      edge = talking ? 0.55 + 0.35 * Math.sin(t * 14) : clamp(0.6 - (t - ve('crown') - 0.3)) * 0.6;
      camPos = lerpV(v3(3.9, 2.6, -3.1), v3(4.1, 2.7, -2.6), ease(u)); look = v3(1.0, 2.3, -5.6); fov = 56;
      break;
    }
    case 5: { // rallying the players
      const wk = clamp(lt / 2.2);
      const jz = lerp(-4.2, -2.0, ease(wk)), jx = lerp(1.2, 0.2, ease(wk));
      place(juno, jx, jz, 0); pose(juno, wk < 1 ? walkPose(lt * 8, 0.5) : { armLx: -0.4, armRx: -0.4 });
      setFace(juno, t < vs('help') ? 'sad' : 'determined');
      CROWD.forEach(([x, z], i) => {
        const st = vs('forward') + i * 0.45, k = clamp((t - st) / 1.3);
        const ang = -0.9 + i * 0.45, tx = jx + Math.sin(ang) * 1.9, tz = jz + Math.cos(ang) * 1.9;
        const px = lerp(x, tx, ease(k)), pz = lerp(z, tz, ease(k));
        place(npcs[i], px, pz, faceTo(px, pz, jx, jz)); setFace(npcs[i], k > 0 ? 'determined' : 'worried');
        pose(npcs[i], k > 0 && k < 1 ? walkPose(t * 9 + i, 0.5) : {});
      });
      if (t < vs('help') - 0.1) { camPos = lerpV(v3(0.5, 2.3, 0.5), v3(0.45, 2.3, 0.1), ease(u * 2)); look = v3(0.2, 2.15, -2.0); }
      else if (t < vs('forward') - 0.1) { camPos = lerpV(v3(0.35, 2.3, -0.6), v3(0.3, 2.3, -0.85), ease((t - vs('help')) / 4)); look = v3(0.2, 2.25, -2.0); }
      else { camPos = lerpV(v3(0.7, 5.4, -5.6), v3(0.6, 5.6, -5.2), ease((t - vs('forward')) / 3)); look = v3(0.1, 0.8, 0.6); fov = 56; }
      break;
    }
    case 6: { // the heist
      const AX = 2.6, AZ = 0.2;
      const turned = ease((t - vs('hey') - 0.2) / 0.6);
      place(admin, AX, AZ, lerp(Math.PI, Math.PI / 2, turned)); setFace(admin, 'stern');
      const PL = [[5.0, 1.6], [5.6, 0.3], [4.7, -0.9], [5.9, 1.2], [4.6, 2.4]];
      PL.forEach(([x, z], i) => { place(npcs[i], x, z, faceTo(x, z, AX, AZ)); setFace(npcs[i], 'laugh');
        const w = Math.sin(t * 9 + i * 1.3);
        pose(npcs[i], t > vs('hey') - 0.3 ? { armRx: -2.9, armRz: 0.4 + w * 0.4, armLx: -2.5 * (i % 2), bob: Math.abs(w) * 0.12 } : {}); });
      const sk = clamp((t - vs('distract')) / 2.6);
      const jx = lerp(-1.6, AX - 0.85, ease(sk)), jz = lerp(-1.2, AZ + 0.05, ease(sk));
      place(juno, jx, jz, sk < 1 ? faceTo(-1.6, -1.2, AX - 0.85, AZ) : Math.PI / 2);
      setFace(juno, 'determined');
      const tg = vs('grab') + 0.5, gr = clamp((t - tg + 0.6) / 0.6);
      if (sk < 1) pose(juno, walkPose(t * 6, 0.35, { bodyX: 0.35 }));
      else pose(juno, { armRx: lerp(-0.2, -2.9, gr) + (t > tg ? 2.2 * ease((t - tg - 1.2) / 0.6) : 0), bodyX: 0.1 });
      const taken = t > tg;
      admin.userData.P.crown.visible = !taken; heldCrown.visible = taken; crownGlow = taken ? 0.4 : 0;
      if (t < vs('hey') - 0.2) { camPos = lerpV(v3(0.5, 7.0, 6.8), v3(0.8, 6.5, 6.0), ease(u * 3)); look = v3(1.8, 0.4, 0.2); fov = 58; }
      else if (t < vs('distract') - 0.1) { camPos = v3(2.4, 2.4, 3.6); look = v3(5.0, 2.0, 0.8); }
      else if (t < vs('grab') - 0.1) { camPos = lerpV(v3(-0.6, 1.4, 2.6), v3(-0.2, 1.5, 2.3), ease((t - vs('distract')) / 2.5)); look = v3(1.4, 1.5, 0.0); }
      else { camPos = lerpV(v3(1.4, 3.3, -3.9), v3(1.5, 3.2, -3.5), ease((t - vs('grab')) / 2.5)); look = v3(2.2, 2.6, 0.2); fov = 58; }
      break;
    }
    case 7: { // the admin changes
      const AX = 2.6, AZ = 0.2;
      heldCrown.visible = true; crownGlow = 0.5;
      const tx = vs('changed') + 2.3, d = t - tx;
      const showKeeper = d > 0.6 || (d > 0 && Math.sin(d * 75) > 0);
      if (showKeeper) { place(keeper, AX, AZ, -Math.PI / 2, 0.05 + Math.sin(t * 1.7) * 0.05); pose(keeper, { armLz: -0.15, armRz: 0.15, headZ: 0.08 }); }
      else { admin.userData.P.crown.visible = false; place(admin, AX, AZ, lerp(Math.PI / 2, -Math.PI / 2, ease((t - vs('changed')) / 0.7))); setFace(admin, d > -0.8 ? 'redeyes' : 'stern'); }
      const back = ease((t - vs('changed') - 0.3) / 1.2);
      place(juno, lerp(AX - 0.85, AX - 1.8, back), AZ + 0.05, Math.PI / 2); setFace(juno, 'shock');
      pose(juno, { armRx: -0.6, armLx: -0.5, bodyX: -0.1 });
      if (d > 0 && d < 0.7) { flash = 0.5 * (1 - d / 0.7); flashCol = '#ff2020'; shake = 0.6; }
      flicker = d > 0 ? 1 : 0;
      if (t < vs('shouldnot') - 0.2) { camPos = lerpV(v3(0.6, 2.4, 3.2), v3(0.7, 2.45, 2.7), ease(u * 1.5)); look = v3(2.3, 2.4, 0.2); }
      else { camPos = lerpV(v3(1.1, 1.55, 0.75), v3(1.25, 1.65, 0.55), ease((t - vs('shouldnot')) / 3)); look = v3(AX, 3.05, AZ); fov = 56; }
      break;
    }
    case 8: { // the crown opens the door
      const run = clamp(lt / 2.4);
      const jx = lerp(0.8, 1.2, ease(run)), jz = lerp(0.25, -4.3, ease(run));
      place(juno, jx, jz, Math.PI); setFace(juno, 'determined');
      const tp = vs('pressed') + 2.0, tb = vs('shattered') - 0.2;
      const onDoor = t >= tp;
      heldCrown.visible = !onDoor; doorCrown.visible = onDoor && t < tb + 2.5;
      crownGlow = onDoor ? clamp(0.5 + (t - tp) / (tb - tp) * 0.5) * (t < tb + 2.5 ? 1 : 0) : 0.5;
      if (run < 1) pose(juno, walkPose(lt * 13, 0.85, { bodyX: 0.15 }));
      else pose(juno, { armRx: t < tb ? -1.6 : -0.7, armLx: -0.3, bodyX: t < tb ? 0.12 : -0.15 });
      if (t >= tb) { chainT = t - tb; shake = clamp(1 - chainT / 0.7); open = ease((t - tb - 0.5) / 2.2); fogRed = 1; }
      place(keeper, lerp(2.6, 2.3, u), lerp(0.2, -0.6, u), Math.PI + 0.4, 0.05); pose(keeper, walkPose(t * 3, 0.2));
      if (t < tp - 0.4) { camPos = lerpV(v3(2.2, 2.7, -0.6), v3(2.0, 2.6, -1.6), ease(lt / (tp - 0.4 - sc.start))); look = v3(0.8, 2.3, -6); }
      else if (t < tb + 0.1) { camPos = lerpV(v3(-0.3, 2.5, -3.0), v3(-0.2, 2.45, -3.4), ease((t - tp) / (tb - tp))); look = v3(1.0, 2.2, -5.9); }
      else { camPos = lerpV(v3(4.4, 3.3, 0.5), v3(4.0, 3.2, -0.2), ease(chainT / 3)); look = v3(0, 2.3, -5.6); fov = 56; }
      break;
    }
    case 9: { // Milo returns
      open = 1; fogRed = 1;
      const wk = clamp((t - vs('stepped') - 0.6) / 2.6);
      const mz = lerp(-7.2, -4.4, ease(wk));
      const hug = ease((t - vs('never') + 0.3) / 0.7);
      const mx = lerp(0.3, 0.55, hug), mzz = lerp(mz, -4.15, hug);
      place(milo, mx, mzz, wk < 1 ? 0 : faceTo(0.3, -4.4, 1.4, -3.4)); setFace(milo, wk < 1 ? 'worried' : 'laugh');
      if (wk > 0 && wk < 1) pose(milo, walkPose(t * 6, 0.45));
      const jx = lerp(1.4, 1.15, hug), jz = lerp(-3.4, -3.6, hug);
      place(juno, jx, jz, faceTo(1.4, -3.4, 0.3, -4.4)); setFace(juno, t > vs('cameback') ? 'laugh' : 'shock');
      if (hug > 0) { const h = { armLx: -1.35 * hug, armRx: -1.35 * hug, armLz: -0.55 * hug, armRz: 0.55 * hug }; pose(milo, h); pose(juno, h); setFace(milo, 'sleep'); setFace(juno, 'sleep'); }
      if (t < vs('cameback') - 0.1) { camPos = lerpV(v3(1.3, 2.1, -0.5), v3(1.1, 2.1, -1.2), ease(u * 1.6)); look = v3(0.25, 2.0, -6); }
      else if (t < vs('never') - 0.4) { camPos = v3(2.5, 2.4, -4.05); look = v3(0.3, 2.25, -4.4); }
      else { camPos = lerpV(v3(-2.3, 2.5, -0.5), v3(-2.0, 2.45, -0.85), ease((t - vs('never')) / 3)); look = v3(0.85, 2.0, -3.87); fov = 54; }
      break;
    }
    case 10: { // everyone is free
      open = 1; fogRed = 1;
      place(milo, 1.7, -2.9, faceTo(1.7, -2.9, 0, -5)); place(juno, 2.5, -2.5, faceTo(2.5, -2.5, 0, -5));
      setFace(milo, 'laugh'); setFace(juno, 'laugh');
      const targets = [[-0.6, -2.4], [0.4, -2.0], [-1.2, -1.4], [0.9, -1.0], [-0.2, -0.7]];
      vanished.forEach((v, i) => {
        const k = clamp((t - vs('alone') - 0.3 - i * 0.6) / 2.2);
        const x = lerp(0.2, targets[i][0], ease(k)), z = lerp(-7.0, targets[i][1], ease(k));
        place(v, x, z, k < 1 ? faceTo(0.2, -7, targets[i][0], targets[i][1]) : faceTo(x, z, 2, 1));
        v.userData.P.tag.visible = k > 0.3; setFace(v, k < 1 ? 'shock' : 'laugh');
        pose(v, k > 0 && k < 1 ? walkPose(t * 7 + i, 0.5) : (k >= 1 ? { armLx: -2.6, armRx: -2.6, bob: Math.abs(Math.sin(t * 6 + i)) * 0.15 } : {}));
      });
      camPos = lerpV(v3(0.8, 4.4, 2.8), v3(0.7, 5.2, 3.6), ease(u)); look = v3(0.1, 1.2, -4.0); fov = 56;
      break;
    }
    case 11: { // they push the Keeper through the door
      fogRed = 1;
      const tpush = vs('pushed') + 0.6, pk = ease((t - tpush) / 2.4);
      const tslam = tpush + 2.6;
      open = t < tslam ? 1 : 1 - ease((t - tslam) / 0.25);
      if (t >= tslam) { shake = clamp(1 - (t - tslam) / 0.8); flash = 0.6 * clamp(1 - (t - tslam) / 0.5); flashCol = '#ffffff'; }
      const kz = lerp(-3.6, -7.4, pk);
      if (kz > -6.9) { place(keeper, 0.3, kz, 0, 0.05); pose(keeper, t < vs('notthis') ? { armLz: -1.3, armRz: 1.3, armLx: -0.4, armRx: -0.4 } : { armLx: -0.8 - Math.sin(t * 12) * 0.5, armRx: -0.8 + Math.sin(t * 12) * 0.5, bodyX: -0.2 * pk }); }
      const members = [juno, milo, ...groupAll()];
      const base = [[0.4, -0.6], [1.3, -0.4], ...groupSpots];
      members.forEach((a, i) => {
        const [x, z] = base[i]; const zz = z - 2.1 * pk;
        place(a, x, zz, faceTo(x, z, 0.3, -6)); if (i >= 2) setFace(a, 'determined');
        pose(a, pk > 0 ? { armLx: -1.5, armRx: -1.5, ...walkPose(t * 7 + i, pk < 1 ? 0.4 : 0), armLx: -1.5, armRx: -1.5 } : {});
      });
      setFace(juno, 'determined'); setFace(milo, 'determined');
      if (t < vs('notthis') - 0.1) { camPos = lerpV(v3(0.9, 1.5, -1.2), v3(0.8, 1.55, -1.6), ease(u * 2)); look = v3(0.3, 3.0, -3.6); fov = 56; flicker = 1; }
      else if (t < vs('pushed') - 0.1) { camPos = v3(0.5, 2.3, -2.0); look = v3(0.4, 2.25, -0.6); }
      else { camPos = lerpV(v3(6.0, 3.8, 1.6), v3(5.6, 3.6, 1.0), ease((t - vs('pushed')) / 4)); look = v3(0, 1.6, -4.2); fov = 58; }
      break;
    }
    case 12: { // new rule
      sign3.visible = true;
      rule3Draw = clamp((t - vs('slammed') - 2.4) / 2.4);
      const members = [juno, milo, ...groupAll()];
      const base = [[1.4, -2.7], [2.3, -2.5], ...groupSpots.map(([x, z]) => [x + 2.2, z - 1.6])];
      members.forEach((a, i) => { const [x, z] = base[i]; place(a, x, z, faceTo(x, z, -2.85, -5)); setFace(a, 'laugh'); if (rule3Draw > 0.3) cheer(a, i); });
      if (lt < 2.0) { camPos = lerpV(v3(0.6, 2.6, 0.2), v3(0.5, 2.6, -0.6), ease(lt / 2)); look = v3(0, 2.5, -6); shake = clamp(0.5 - lt / 2); }
      else { camPos = lerpV(v3(-1.1, 2.4, -2.2), v3(-1.7, 2.1, -3.2), ease((lt - 2) / (dur - 2))); look = v3(-2.8, 2.1, -4.95); }
      break;
    }
    case 13: { // everything is okay... or is it?
      rule3Draw = 1; sign3.visible = true;
      place(milo, 0.3, -2.2, 0); place(juno, 1.3, -2.2, 0); setFace(milo, 'laugh'); setFace(juno, 'laugh');
      pose(juno, { armLx: -0.4, armLz: 0.3 }); pose(milo, { armRx: -0.4, armRz: -0.3 });
      groupAll().forEach((a, i) => { const [x, z] = groupSpots[i]; place(a, x * 1.2, z - 4.3, faceTo(x, z - 4.3, 0.8, 1)); setFace(a, 'laugh'); cheer(a, i, 0.7); });
      const tsys = vs('okay') + 3.2;
      if (t >= tsys && t < vs('orwas') + 0.2) { sysMsg = '⚠ [SERVER] Restarting...'; flicker = 1; }
      if (t < vs('orwas') - 0.2) { camPos = lerpV(v3(0.8, 2.2, 1.2), v3(0.8, 2.2, 0.4), ease(u * 1.6)); look = v3(0.8, 2.0, -2.2); }
      else { camPos = lerpV(v3(0.35, 2.3, -0.7), v3(0.33, 2.3, -1.05), ease((t - vs('orwas')) / 3)); look = v3(0.3, 2.28, -2.2); }
      const re = t - (ve('orwas') + 0.5);
      if (re > 0 && re < 0.28) { setFace(milo, 'redeyes'); flicker = 1; }
      else if (re >= 0.28) setFace(milo, 'smile');
      tint = clamp((t - (sc.end - 3.0)) / 0.6) * 0.55;
      break;
    }
  }
  wordsMesh.visible = false;
