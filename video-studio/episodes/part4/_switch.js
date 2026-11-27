  // ---- Part 4: The Last Door (finale) ----
  const SPOTS = [[-2.6, -3.9], [-1.6, -3.3], [-0.6, -4.1], [1.9, -3.4], [2.9, -3.9], [3.7, -3.0], [-3.5, -3.0], [-0.3, -2.9], [2.5, -2.6], [-2.2, -2.4]];
  const group = [...vanished, ...npcs];
  const cheer = (a, i, k = 1) => pose(a, { armLx: -2.8 * k, armRx: -2.8 * k, armLz: -0.3 * k, armRz: 0.3 * k, bob: Math.abs(Math.sin(t * 7 + i)) * 0.25 * k });
  const placeGroup = (f = 'laugh', k = 1) => group.forEach((a, i) => { const [x, z] = SPOTS[i]; place(a, x, z, faceTo(x, z, 0.8, 1.5)); setFace(a, f); if (k) cheer(a, i, k); if (a.userData.P.tag) a.userData.P.tag.visible = true; });
  open = 0; words = 0; fogRed = 0; chains = 0; rule2Draw = 1; rule3Draw = 1; sign3.visible = true;
  held.visible = true;

  switch (sc.id) {
    case 1: { // celebration -> server restart
      place(milo, 0.3, -2.2, 0); place(juno, 1.3, -2.2, 0); setFace(milo, 'laugh'); setFace(juno, 'laugh');
      placeGroup('laugh', 0.8);
      const tr = vs('recap') + 3.3;
      if (t >= tr) { sysMsg = '⚠ [SERVER] Restarting...'; glitch = clamp((t - tr) / 1.2); flicker = 1; }
      flash = clamp((t - (sc.end - 0.35)) / 0.35);
      camPos = lerpV(v3(0.8, 2.7, 2.2), v3(0.8, 2.5, 0.8), ease(u)); look = v3(0.8, 2.0, -3.0);
      break;
    }
    case 2: { // the door is gone
      doorOn = 0; flash = 1 - clamp(lt / 0.5); glitch = clamp(1 - lt / 1.2);
      place(milo, 0.3, -2.2, 0); place(juno, 1.3, -2.2, 0);
      if (t < vs('over') - 0.2) {
        camPos = lerpV(v3(-1.2, 3.3, 0.6), v3(-1.0, 3.2, -1.2), ease((t - sc.start) / (vs('over') - sc.start))); look = v3(0, 2.7, -6.3);
        setFace(juno, 'shock'); setFace(milo, 'blank'); placeGroup('shock', 0);
      } else {
        placeGroup('laugh', 1); setFace(juno, 'laugh'); setFace(milo, 'smile'); cheer(juno, 0, 0.8);
        camPos = lerpV(v3(0.8, 3.3, 2.6), v3(0.8, 3.1, 2.0), ease((t - vs('over')) / 2)); look = v3(0.6, 1.6, -3.0);
      }
      break;
    }
    case 3: { // something is wrong with Milo
      doorOn = 0; placeGroup('laugh', 0.4); if (t >= vs('shadow') - 0.1) group.forEach(a => { a.position.z += 3.4; a.position.x *= 1.3; });
      place(juno, 1.3, -2.2, -Math.PI / 2 + 0.3); setFace(juno, 'worried');
      place(milo, 0.3, -2.2, t < vs('shadow') ? Math.PI / 2 - 0.3 : 0); setFace(milo, t < vs('fine') ? 'blank' : 'smile');
      if (t < vs('fine') - 0.1) { camPos = v3(0.8, 2.3, 0.1); look = v3(0.8, 2.2, -2.2); }
      else if (t < vs('shadow') - 0.1) { camPos = lerpV(v3(0.9, 2.35, 0.3), v3(0.85, 2.35, 0.0), ease((t - vs('fine')) / 1.5)); look = v3(0.3, 2.25, -2.2); }
      else { shadowOp = clamp((t - vs('shadow') - 0.6) / 1.2); camPos = lerpV(v3(0.6, 7.2, 0.8), v3(0.5, 7.6, 0.4), ease((t - vs('shadow')) / 4)); look = v3(0.3, 0, -3.6); fov = 50; flicker = 0.5; }
      break;
    }
    case 4: { // lights out, players vanish
      doorOn = 0;
      dark = clamp((t - vs('lights') - 0.4) / 2.2);
      place(juno, 1.3, -2.2, faceTo(1.3, -2.2, -1, -3.5)); setFace(juno, t > vs('onebyone') ? 'shock' : 'worried');
      place(milo, 0.3, -2.2, Math.PI); setFace(milo, 'blank'); shadowOp = 0.6;
      group.forEach((a, i) => {
        const tv = vs('onebyone') + 0.7 + i * 0.42;
        const [x, z] = SPOTS[i];
        if (t < tv) { place(a, x, z, faceTo(x, z, 0.8, -2.2)); setFace(a, 'worried'); pose(a, { headY: Math.sin(t * 2 + i) * 0.4 }); if (a.userData.P.tag) a.userData.P.tag.visible = true; }
        else puffAt(i, x, z, t - tv, 0xff3030);
      });
      camPos = lerpV(v3(0.6, 4.6, 2.8), v3(0.5, 4.2, 2.2), ease(u)); look = v3(0.2, 1.0, -3.2); fov = 56;
      break;
    }
    case 5: { // Milo doesn't move
      doorOn = 0; dark = 1;
      const run = clamp(lt / 1.2);
      place(juno, lerp(2.0, 1.2, ease(run)), lerp(-1.2, -2.05, ease(run)), faceTo(1.2, -2.05, 0.3, -2.2)); setFace(juno, 'worried');
      pose(juno, run < 1 ? walkPose(t * 12, 0.8) : { armLx: -1.2, armLz: 0.2 });
      const turn = ease((t - vs('really') + 0.4) / 1.4);
      place(milo, 0.3, -2.2, lerp(Math.PI, 0.35, turn)); setFace(milo, turn > 0.4 ? 'redeyes' : 'blank'); shadowOp = 0.7;
      if (turn > 0) flicker = 1;
      if (t < vs('didnt') - 0.1) { camPos = v3(1.9, 2.3, 0.1); look = v3(1.1, 2.2, -2.2); }
      else if (t < vs('really') - 0.4) { camPos = lerpV(v3(0.5, 2.6, 0.8), v3(0.45, 2.6, 0.4), ease((t - vs('didnt')) / 2.5)); look = v3(0.3, 2.1, -2.2); }
      else { camPos = lerpV(v3(0.75, 2.3, -0.1), v3(0.65, 2.3, -0.45), ease((t - vs('really')) / 4)); look = v3(0.3, 2.25, -2.2); }
      break;
    }
    case 6: { // the door returns
      dark = 1; fogRed = 1;
      const ta = vs('took') + 1.2;
      doorOn = t < ta ? 0 : (t < ta + 0.8 ? (Math.sin((t - ta) * 60) > 0 ? 1 : 0) : 1);
      if (t >= ta && t < ta + 0.8) glitch = 0.5;
      open = ease((t - ta - 1.0) / 3.0) * 0.9;
      place(milo, 0.3, -2.2, 0.35, t > vs('chose') ? 0.18 * ease((t - vs('chose')) / 1) : 0); setFace(milo, 'redeyes'); shadowOp = 0.8;
      if (t > vs('chose')) pose(milo, { armLz: -1.2, armRz: 1.2, headX: -0.1 });
      place(juno, 1.2, -2.05, faceTo(1.2, -2.05, 0.3, -2.2)); setFace(juno, 'shock'); pose(juno, { bodyX: -0.15 });
      flicker = 1;
      if (t < vs('chose') - 0.1) { camPos = lerpV(v3(2.8, 2.7, 0.8), v3(2.6, 2.6, 0.3), ease(u)); look = v3(0, 2.4, -5.0); fov = 56; }
      else { camPos = lerpV(v3(0.7, 1.4, -0.3), v3(0.6, 1.45, -0.6), ease((t - vs('chose')) / 4)); look = v3(0.3, 2.7, -2.4); fov = 56; }
      break;
    }
    case 7: { // the jacket
      dark = 1; fogRed = 1; open = 0.9; flicker = 0.5;
      place(milo, 0.3, -2.2, 0.25); setFace(milo, 'redeyes'); shadowOp = 0.8;
      pose(milo, { armRx: -0.25, armRz: -0.15 });
      place(juno, 1.9, -1.7, faceTo(1.9, -1.7, 0.3, -2.2)); setFace(juno, 'sad');
      pose(juno, { armLx: -0.5 });
      if (t < vs('saw') - 0.1 || t >= vs('carried') - 0.1) { camPos = lerpV(v3(-0.4, 2.4, -0.1), v3(-0.25, 2.4, -0.4), ease(u)); look = v3(1.9, 2.25, -1.7); }
      else {
        pose(milo, { armRx: -1.25, armRz: 0.35 });
        camPos = lerpV(v3(0.9, 2.2, 1.4), v3(0.9, 2.1, 0.8), ease((t - vs('saw')) / 4)); look = v3(0.9, 1.5, -1.6); fov = 58;
      }
      break;
    }
    case 8: { // Milo fights back
      dark = 1; fogRed = 1; open = 0.9;
      const fight = Math.sin(t * 23) + Math.sin(t * 7.7) > 0.4;
      place(milo, 0.3 + Math.sin(t * 40) * 0.03, -2.2, 0.35); setFace(milo, fight ? 'redeyes' : 'worried'); shadowOp = fight ? 0.9 : 0.4;
      pose(milo, { armLx: -2.5, armRx: -2.5, armLz: -0.6, armRz: 0.6, bodyX: 0.25 + Math.sin(t * 17) * 0.05, headZ: Math.sin(t * 13) * 0.1 });
      place(juno, 1.25, -2.0, faceTo(1.25, -2.0, 0.3, -2.2)); setFace(juno, 'shock');
      shake = 0.35; flicker = 1;
      camPos = lerpV(v3(0.85, 2.4, 0.1), v3(0.8, 2.4, -0.3), ease(u)); look = v3(0.3, 2.2, -2.2);
      break;
    }
    case 9: { // rule number three
      dark = 1; fogRed = 1; open = 0.9;
      place(milo, 0.3, -2.2, 0.9); setFace(milo, Math.sin(t * 9) > 0.7 ? 'redeyes' : 'worried'); shadowOp = 0.6;
      const g = ease((t - vs('grabbed') - 0.3) / 0.8);
      place(juno, lerp(1.25, 1.05, g), lerp(-2.0, -1.95, g), faceTo(1.25, -2.0, 0.3, -2.2)); setFace(juno, 'determined');
      pose(juno, { armLx: -1.1 * g, armLz: 0.25 * g });
      pose(milo, { armLx: -1.0 * g, armLz: -0.2 * g });
      if (t < vs('grabbed') - 0.1) { camPos = lerpV(v3(-0.4, 2.4, -0.1), v3(-0.25, 2.4, -0.4), ease((t - sc.start) / 4)); look = v3(1.2, 2.25, -2.0); }
      else { camPos = lerpV(v3(0.7, 1.9, 2.4), v3(0.7, 1.8, 1.8), ease((t - vs('grabbed')) / 3)); look = v3(0.68, 1.5, -2.1); fov = 60; }
      break;
    }
    case 10: { // the Keeper is torn out
      dark = 1; fogRed = 1; open = 1; flicker = 1; shake = 0.4;
      place(milo, 0.3, -2.2, 0.9); setFace(milo, 'worried'); shadowOp = 0;
      place(juno, 1.05, -1.95, faceTo(1.25, -2.0, 0.3, -2.2)); setFace(juno, 'determined');
      const brace = { bodyX: -0.25 };
      pose(juno, { armLx: -1.1, armLz: 0.25, ...brace }); pose(milo, { armLx: -1.0, armLz: -0.2, ...brace });
      const k = clamp((t - sc.start - 0.2) / (vs('alone') - sc.start));
      const kz = lerp(-2.5, -4.4, ease(k));
      place(keeper, 0.3, kz, 0, lerp(0, 0.6, k)); keeper.visible = (k > 0.25 || Math.sin(t * 50) > 0);
      pose(keeper, { armLx: -1.6 + Math.sin(t * 11) * 0.4, armRx: -1.6 - Math.sin(t * 11) * 0.4, armLz: -0.3, armRz: 0.3 });
      if (t < vs('alone') - 0.1) { camPos = lerpV(v3(0.9, 2.7, 2.0), v3(0.8, 2.6, 1.2), ease(u * 1.5)); look = v3(0.4, 2.5, -3.5); }
      else { camPos = lerpV(v3(3.8, 2.7, -1.0), v3(3.5, 2.6, -1.4), ease((t - vs('alone')) / 3)); look = v3(0.3, 2.4, -4.0); fov = 56; }
      break;
    }
    case 11: { // the door shatters
      dark = 1; fogRed = 1; flicker = 1;
      place(milo, 0.3, -2.2, 0.9); place(juno, 1.05, -1.95, faceTo(1.25, -2.0, 0.3, -2.2)); setFace(milo, 'shock'); setFace(juno, 'shock');
      pose(juno, { armLx: -1.1, armLz: 0.25, bodyX: -0.2 }); pose(milo, { armLx: -1.0, armLz: -0.2, bodyX: -0.2 });
      const kp = ease((t - sc.start) / (vs('shattered') - sc.start));
      if (kp < 1) { place(keeper, 0.3, lerp(-4.4, -7.6, kp), 0, 0.6); pose(keeper, { armLx: -2.4, armRx: -2.4 }); }
      const tsh = vs('shattered') + 0.9;
      open = t < vs('shattered') ? 1 : (t < tsh ? 1 - ease((t - vs('shattered')) / 0.3) : 0);
      if (t >= tsh) { doorOn = 0; doorBreak = t - tsh; shake = clamp(1 - doorBreak / 0.8); flash = clamp(1 - doorBreak / 0.7); flashCol = '#ffffff'; }
      else shake = 0.4;
      camPos = lerpV(v3(0.6, 2.8, 1.8), v3(0.5, 2.7, 0.9), ease(u)); look = v3(0, 2.6, -5.6);
      break;
    }
    case 12: { // everyone returns
      doorOn = 0; doorBreak = 99;
      warm = ease((t - vs('returned')) / 2.5); dark = 1 - warm;
      place(milo, 0.3, -2.2, 0.9); place(juno, 1.05, -1.95, faceTo(1.05, -1.95, 0.3, -2.2));
      setFace(milo, 'smile'); setFace(juno, 'laugh');
      group.forEach((a, i) => {
        const tv = vs('returned') + 1.6 + i * 0.3; const [x, z] = SPOTS[i];
        if (t >= tv) { place(a, x, z, faceTo(x, z, 0.8, -2.0)); setFace(a, 'laugh'); cheer(a, i, 0.8); if (a.userData.P.tag) a.userData.P.tag.visible = true; puffAt(i, x, z, t - tv, 0xffd24a, true); }
      });
      if (t >= vs('friends') - 0.1) { const h = ease((t - vs('friends') + 0.1) / 0.6); const hp = { armLx: -1.35 * h, armRx: -1.35 * h, armLz: -0.55 * h, armRz: 0.55 * h };
        place(juno, lerp(1.05, 0.95, h), -2.0, faceTo(1.05, -1.95, 0.3, -2.2)); pose(milo, hp); pose(juno, hp); setFace(milo, 'sleep'); setFace(juno, 'sleep'); held.visible = false; }
      if (t < vs('twice') - 0.1) { camPos = lerpV(v3(0.9, 3.2, 2.4), v3(0.8, 3.0, 1.6), ease(u * 1.6)); look = v3(0.4, 1.6, -3.0); }
      else if (t < vs('friends') - 0.1) { camPos = v3(0.85, 2.35, 0.2); look = v3(0.5, 2.2, -2.1); }
      else { camPos = lerpV(v3(-2.6, 2.6, 0.5), v3(-2.3, 2.55, 0.1), ease((t - vs('friends')) / 3)); look = v3(0.65, 2.0, -2.05); fov = 54; }
      break;
    }
    case 13: { // never seen again... a blue door
      doorOn = 0; doorBreak = 99;
      if (t < vs('somewhere') - 0.3) {
        warm = 1; dark = 0;
        place(milo, 0.3, -2.2, 0.3); place(juno, 1.2, -2.2, -0.3); setFace(milo, 'laugh'); setFace(juno, 'laugh');
        pose(juno, { armLx: -0.4, armLz: 0.3 }); pose(milo, { armRx: -0.4, armRz: -0.3 });
        group.forEach((a, i) => { const [x, z] = SPOTS[i]; place(a, x, z, faceTo(x, z, 0.8, 1.5)); setFace(a, 'laugh'); cheer(a, i, 0.7); if (a.userData.P.tag) a.userData.P.tag.visible = true; });
        camPos = lerpV(v3(0.6, 2.6, 2.4), v3(0.6, 4.2, 3.6), ease((t - sc.start) / (vs('somewhere') - sc.start))); look = v3(0.3, 1.8, -3.2); fov = 56;
      } else {
        warm = 0; dark = 1; blueOn = 1; sign3.visible = false; held.visible = false;
        flash = clamp(1 - (t - vs('somewhere') + 0.3) / 0.4) * 0.8; flashCol = '#000000';
        blueOpen = ease((t - vs('blue') - 0.2) / 2.0) * 0.5;
        camPos = lerpV(v3(4.3, 2.3, -1.4), v3(4.9, 2.3, -3.0), ease((t - vs('somewhere')) / 6)); look = v3(5.6, 2.0, -6.1);
      }
      tint = clamp((t - (sc.end - 3.6)) / 0.6) * 0.6;
      break;
    }
  }
  wordsMesh.visible = false;
