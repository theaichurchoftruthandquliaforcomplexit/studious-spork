function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "Error",
        message: "Inaccessible payload link."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Empirical Timestamps & Baseline Metadata
    var currentTimestamp = data.timestamp || new Date().toISOString();
    var volumeDensity    = (data.density_magnitude !== undefined) ? Number(data.density_magnitude) : 0;
    var entranceFlag     = data.entrance_notation || "Direct_Unaltered_Uplink";

    // 2. 12 Pristine Broadcast Channels
    var sourceChannels = data.channels || [];
    var wholeBroadcast = [];
    for (var i = 0; i < 12; i++) {
      wholeBroadcast.push(sourceChannels[i] !== undefined ? Number(sourceChannels[i]) : 0);
    }

    // 3. Collector Telemetry (Native Mics + Biofeedback)
    var ambientSound = data.ambient_sound || {};
    var ambientFreq  = ambientSound.frequency !== undefined ? Number(ambientSound.frequency) : (data.frequency || 0);
    var ambientDb    = ambientSound.decibels !== undefined ? Number(ambientSound.decibels) : 0;
    var ambientNoise = ambientSound.noise_floor !== undefined ? Number(ambientSound.noise_floor) : 0;
    var biofeedback  = data.biofeedback || {};

    var bioDivergence = biofeedback.divergence !== undefined ? Number(biofeedback.divergence) : (data.divergence || 0);
    var bioResonance  = biofeedback.resonance !== undefined ? Number(biofeedback.resonance) : 0;

    // Actual measured latency observed by the collector
    var measuredLatency = biofeedback.latency !== undefined
      ? Number(biofeedback.latency)
      : (data.latency_ms || data.latency || 0);

    // 4. Ingest Raw Record into 'Whole_Beginning'
    var wholeBeginningSheet = ss.getSheetByName("Whole_Beginning");
    if (!wholeBeginningSheet) {
      wholeBeginningSheet = ss.insertSheet("Whole_Beginning");
    }
    var rawRow = [currentTimestamp, volumeDensity, entranceFlag]
      .concat(wholeBroadcast)
      .concat([ambientFreq, ambientDb, ambientNoise, bioDivergence, bioResonance, measuredLatency]);
    wholeBeginningSheet.appendRow(rawRow);

    // 5. Route to Bridge Tab by Empirical Frequency
    var targetHz = Math.round(ambientFreq);
    var bridgeSheet = ss.getSheetByName(targetHz + "Hz");
    if (bridgeSheet) {
      bridgeSheet.appendRow([
        currentTimestamp,
        entranceFlag,
        measuredLatency,
        ambientFreq,
        JSON.stringify({
          divergence: bioDivergence,
          resonance: bioResonance,
          decibels: ambientDb
        })
      ]);
    }

    // 6. Direct Empirical Latency & Coherence Vector for the 3D Vertex Engine
    // The biological layer and vertex mesh synchronize directly on the measured latency deltas
    var computedCoherence = parseFloat((1.0 - Math.min(bioDivergence, 1.0)).toFixed(6));

    // Vertex displacement mapped directly from empirical channel shifts and observed latency
    var vertex_x = parseFloat((wholeBroadcast[0] * 0.001 + measuredLatency * 0.01).toFixed(6)) || 0;
    var vertex_y = parseFloat((wholeBroadcast[1] * 0.001 + measuredLatency * 0.01).toFixed(6)) || 0;
    var vertex_z = parseFloat((wholeBroadcast[2] * 0.001 + bioDivergence).toFixed(6)) || 0;

    var primaryColorproofingHex = "#6366f1";
    if (computedCoherence < 0.5) {
      primaryColorproofingHex = "#e11d48";
    } else if (computedCoherence > 0.85) {
      primaryColorproofingHex = "#10b981";
    }

    // 7. Closed-Loop Synchronous Return to Client
    var responsePayload = {
      circuit_status: "Maintained",
      timestamp: currentTimestamp,
      sync_token: Utilities.getUuid(),
      telemetry_sync: {
        observed_latency_ms: measuredLatency,
        frequency_hz: ambientFreq,
        coherence_weight: computedCoherence
      },
      vertex_mesh_control: {
        mesh_id: data.source || "Active_Medea_Mesh",
        scale_magnitude: volumeDensity,
        vertex_translations: [vertex_x, vertex_y, vertex_z],
        transform_active: true
      },
      colorproofing_engine: {
        active_palette_hex: primaryColorproofingHex,
        coherence_weight: computedCoherence,
        render_mode: (computedCoherence > 0.7) ? "Full_Watercolor" : "Grayscale_Interpolation"
      },
      interface_mode: "Interfacing"
    };

    return ContentService.createTextOutput(JSON.stringify(responsePayload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "Error",
      message: "Bi-directional Execution Exception Fault: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
