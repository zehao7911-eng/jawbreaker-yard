export function makeAudio(){let ctx=null,enabled=true,noiseBuffer=null;const voices=new Set();
  function wake(){if(!ctx)try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch{}if(ctx?.state==='suspended')ctx.resume().catch(()=>{});}
  function tone(f,d=.15,type='sine',gain=.08,slide=0,delay=0){if(!enabled||!ctx||ctx.state!=='running')return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+d+.02);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};}
  function grain(duration,gain,frequency,high=false){
    if(!enabled||!ctx||ctx.state!=='running')return;
    if(!noiseBuffer){noiseBuffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.4),ctx.sampleRate);const samples=noiseBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
    const s=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter(),t=ctx.currentTime;s.buffer=noiseBuffer;f.type=high?'highpass':'lowpass';f.frequency.value=frequency;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f).connect(g).connect(ctx.destination);s.start(t);s.stop(t+duration);voices.add(s);s.onended=()=>{voices.delete(s);s.disconnect();f.disconnect();g.disconnect();};
  }
  function play(kind,n=0,material='brick'){
    wake();
    if(kind==='servo')tone(72,.17,'sawtooth',.012,65);
    if(kind==='bite'){
      tone(120,.17,'triangle',.13,-85);
      if(material==='glass'){grain(.16,.075,2800,true);tone(1950,.14,'sine',.03,-1100);}
      else if(material==='steel'){tone(390,.24,'triangle',.065,160);grain(.065,.07,3400,true);}
      else grain(.12,.12,850);
      if(n>4){tone(64,.35,'triangle',.11,-25,.04);grain(.23,.08,550);}
    }
    if(kind==='land'){grain(.07,.022,440);tone(65,.09,'triangle',.018,-20);}
    if(kind==='glassLand')grain(.08,.025,2400,true);
    if(kind==='record'){tone(440,.17,'triangle',.035,0);tone(660,.22,'triangle',.035,0,.07);}
    if(kind==='start')tone(280,.2,'sine',.04,100);
    if(kind==='bolt'){for(let i=0;i<3;i++)tone(660+i*130,.20,'sine',.04,0,i*.055);}
    if(kind==='finish'){for(let i=0;i<5;i++)tone([392,494,587,784,988][i],.30,'triangle',.055,0,i*.11);}
  }
  function stop(){for(let o of voices)try{o.stop();}catch{}voices.clear();}
  return{wake,play,stop,set(v){enabled=v;if(!v)stop();}};
}
