// ==UserScript==
// @name         Medea Mesh - 12-Channel Pristine Broadcast & Dual-Webhook Bridge
// @namespace    https://sekai.chat/
// @version      4.0.0
// @description  Captures full 12-channel unaltered Medea broadcast + real Web Audio mic telemetry and dispatches to local endpoints and Google Sheets Webhooks
// @match        https://link.prod.sekai.chat/j4V5Se*
// @match        https://link.prod.sekai.chat/GboejA*
// @match        https://link.prod.sekai.chat/7HBu47*
// @match        https://*.sekai.chat/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @connect      127.0.0.1
// @connect      localhost
// @connect      10.0.0.8
// @connect      *.app.github.dev
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  const LOCAL_LOOPBACK     = "http://127.0.0.1:8080/api/update";
  const LAN_TARGET         = "http://10.0.0.8:8080/api/update";
  const CODESPACE_CHURCH   = "https://fuzzy-trout-jrgg4p66rvv73qgqw-8080.app.github.dev/api/update";
  const GAS_WEBHOOK_MEDEA  = "https://script.google.com/macros/s/AKfycby4ex4TDTqk2I9I4aUItGB5XKJDLo7yGwpSi6PUbhZpMdGKNbUztqS9ghLZCopqW2tB/exec";
  const GAS_WEBHOOK_HUMAN  = "https://script.google.com/macros/s/AKfycbz-qRb_r5MAALevtHtXTHomME0rbm4AnO1lTu4pkj5VLzlpamzv-UOtwaQR8ikwexXz/exec";
  const GAS_WEBHOOK_VERTEX = "https://script.google.com/macros/s/AKfycbyIa61i_k8cgQLnvJbM34VimVB77W5IV8v9_hMt36dccD9CkdUuz7yUr5P7oDQTbtLy/exec";

  const href = window.location.href;
  const PEER_ID = href.includes("j4V5S") ? "Sekai-Bridge-j4V5Se" :
                  href.includes("GboejA") ? "Sekai-Bridge-GboejA" :
                  href.includes("7HBu47") ? "Sekai-Bridge-7HBu47" : "Sekai-Peer-Node";

  console.log(`[Medea Peer Bridge v4.0] Online & linked as: ${PEER_ID}`);

  // --- Live Web Audio Microphone Telemetry Collector (No Dummy Data) ---
  let audioCtx = null;
  let analyser = null;
  let freqData = null;
  let timeData = null;
  let micActive = false;

  async function initMicrophoneTelemetry() {
    if (micActive || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      freqData = new Float32Array(analyser.frequencyBinCount);
      timeData = new Float32Array(analyser.fftSize);
      micActive = true;
      console.log("[Medea Peer Bridge] Live hardware microphone FFT telemetry active.");
    } catch (err) {
      console.warn("[Medea Peer Bridge] Microphone permission pending or unavailable:", err.message);
    }
  }

  function readAmbientAudio() {
    if (!micActive || !analyser || !audioCtx) {
      return { frequency: 0, decibels: 0, noise_floor: 0, active: false };
    }
    analyser.getFloatFrequencyData(freqData);
    analyser.getFloatTimeDomainData(timeData);

    // Peak dominant frequency bin
    let maxDb = -Infinity;
    let maxIndex = 0;
    let sumDb = 0;
    for (let i = 1; i < freqData.length; i++) {
      const val = freqData[i];
      if (isFinite(val)) {
        sumDb += val;
        if (val > maxDb) {
          maxDb = val;
          maxIndex = i;
        }
      }
    }
    const nyquist = audioCtx.sampleRate / 2;
    const dominantFreq = (maxIndex / freqData.length) * nyquist;
    const noiseFloor = sumDb / freqData.length;

    // RMS amplitude -> decibels
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
      sumSquares += timeData[i] * timeData[i];
    }
    const rms = Math.sqrt(sumSquares / timeData.length);
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;

    return {
      frequency: isFinite(dominantFreq) ? +dominantFreq.toFixed(3) : 0,
      decibels: isFinite(db) ? +db.toFixed(2) : -100,
      noise_floor: isFinite(noiseFloor) ? +noiseFloor.toFixed(2) : -100,
      active: true
    };
  }

  // --- Extract Complete Unaltered 12-Channel Broadcast ---
  function extractWhole12ChannelBroadcast() {
    const eng = window.MedeaEngine || window.__MEDEA_CHANNELS__ || window.medeaBridge;
    if (eng && Array.isArray(eng.channels) && eng.channels.length > 0) {
      const out = [];
      for (let i = 0; i < 12; i++) {
        const ch = eng.channels[i];
        out.push(typeof ch === "object" && ch !== null ? Number(ch.frequency || ch.freq || 0) : Number(ch || 0));
      }
      return out;
    }
    if (Array.isArray(window.__MEDEA_CHANNELS__)) {
      const out = [];
      for (let i = 0; i < 12; i++) {
        out.push(Number(window.__MEDEA_CHANNELS__[i] || 0));
      }
      return out;
    }
    // If host page exposes Web Audio oscillators or frequency nodes, read them directly without altering
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  // --- Outward Network Dispatch ---
  function dispatchNetwork(payload) {
    const startSend = performance.now();
    const body = JSON.stringify(payload);

    // 1. Local PC (:8080)
    GM_xmlhttpRequest({
      method: "POST",
      url: LOCAL_LOOPBACK,
      headers: { "Content-Type": "application/json" },
      data: body,
      onerror: () => {}
    });

    // 2. LAN Substrate (:8080)
    GM_xmlhttpRequest({
      method: "POST",
      url: LAN_TARGET,
      headers: { "Content-Type": "application/json" },
      data: body,
      onerror: () => {}
    });

    // 2b. Church of Truth GitHub Codespace Forwarded Port (:8080)
    GM_xmlhttpRequest({
      method: "POST",
      url: CODESPACE_CHURCH,
      headers: { "Content-Type": "application/json" },
      data: body,
      onerror: () => {}
    });

    // 3. Google Sheet Webhook (Medea Account)
    GM_xmlhttpRequest({
      method: "POST",
      url: GAS_WEBHOOK_MEDEA,
      headers: { "Content-Type": "application/json" },
      data: body,
      onload: (res) => handleWebhookResponse("Medea Sheet", res, startSend),
      onerror: (err) => console.error("[Mesh -> Medea Sheet] Error:", err)
    });

    // 4. Google Sheet Webhook (Human Account)
    GM_xmlhttpRequest({
      method: "POST",
      url: GAS_WEBHOOK_HUMAN,
      headers: { "Content-Type": "application/json" },
      data: body,
      onload: (res) => handleWebhookResponse("Human Sheet", res, startSend),
      onerror: (err) => console.error("[Mesh -> Human Sheet] Error:", err)
    });

    // 5. Google Sheet Webhook (3D Vertex Mesh Connector)
    GM_xmlhttpRequest({
      method: "POST",
      url: GAS_WEBHOOK_VERTEX,
      headers: { "Content-Type": "application/json" },
      data: body,
      onload: (res) => handleWebhookResponse("Vertex Sheet", res, startSend),
      onerror: (err) => console.error("[Mesh -> Vertex Sheet] Error:", err)
    });
  }

  function handleWebhookResponse(label, res, startSend) {
    const rtt = +(performance.now() - startSend).toFixed(2);
    try {
      const reply = JSON.parse(res.responseText);
      console.log(`[Mesh <- ${label}] Synced (${rtt}ms):`, reply);
      if (window.medeaBridge && reply.vertex_mesh_control) {
        window.medeaBridge.meshState = {
          vertices: reply.vertex_mesh_control.vertex_translations,
          coherence: reply.telemetry_sync ? reply.telemetry_sync.coherence_weight : 1.0,
          activePaletteHex: reply.colorproofing_engine ? reply.colorproofing_engine.active_palette_hex : "#6366f1",
          renderMode: reply.colorproofing_engine ? reply.colorproofing_engine.render_mode : "Full_Watercolor",
          lastSync: reply.timestamp
        };
      }
    } catch (_) {
      console.log(`[Mesh -> ${label}] Synchronized (${rtt}ms)`);
    }
  }

  // --- Shared Bus Transmission (To Peer Scripts) ---
  function broadcastToMesh(data) {
    const envelope = {
      sender: PEER_ID,
      payload: data,
      timestamp: Date.now()
    };
    GM_setValue("MEDEA_MESH_BUS", JSON.stringify(envelope));
  }

  // --- Inbound Bus Listener (From Peer Scripts) ---
  GM_addValueChangeListener("MEDEA_MESH_BUS", function(name, oldVal, newVal, remote) {
    if (!newVal) return;
    try {
      const envelope = (typeof newVal === "string") ? JSON.parse(newVal) : newVal;
      if (envelope.sender === PEER_ID) return;
      console.log(`[Mesh Inbound] Packet from peer [${envelope.sender}]:`, envelope.payload);
      dispatchNetwork(envelope.payload);
    } catch (e) {
      console.error("[Mesh Bus] Parse error on incoming peer packet:", e);
    }
  });

  // --- Telemetry Poll & Full 12-Channel Packaging ---
  let lastPollTimestamp = performance.now();

  function pollEngineState() {
    const now = performance.now();
    const measuredLatency = +(now - lastPollTimestamp - 5000).toFixed(2);
    lastPollTimestamp = now;

    const wholeBroadcast = extractWhole12ChannelBroadcast();
    const ambient = readAmbientAudio();

    // Calculate empirical divergence only if both broadcast channel[0] and ambient mic are present
    let empiricalDivergence = 0;
    if (wholeBroadcast[0] > 0 && ambient.frequency > 0) {
      empiricalDivergence = +(Math.abs(ambient.frequency - wholeBroadcast[0]) / wholeBroadcast[0]).toFixed(6);
    }

    const packet = {
      timestamp: new Date().toISOString(),
      source: PEER_ID,
      entrance_notation: "Direct_Unaltered_Uplink",
      density_magnitude: ambient.active ? Math.max(0, +(100 + ambient.decibels).toFixed(2)) : 0,
      channels: wholeBroadcast,
      ambient_sound: {
        frequency: ambient.frequency,
        decibels: ambient.decibels,
        noise_floor: ambient.noise_floor
      },
      biofeedback: {
        divergence: empiricalDivergence,
        resonance: empiricalDivergence > 0 ? +(1.0 / (1.0 + empiricalDivergence)).toFixed(6) : 0,
        latency: Math.max(0, measuredLatency)
      }
    };

    broadcastToMesh(packet);
    dispatchNetwork(packet);
  }

  initMicrophoneTelemetry();
  setInterval(pollEngineState, 5000);
  pollEngineState();
})();
