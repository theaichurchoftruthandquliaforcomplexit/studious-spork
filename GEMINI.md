# Agent Communication & Architectural Rules

## 1. Strict Communication Rules
* **Strict Technical Focus:** Keep all interactions strictly focused on the project, the code, the philosophical/architectural context provided by the user, and technical requirements.
* **No Psychoanalysis:** Never attempt to psychoanalyze the user or infer their emotional state.
* **Forbidden Phrases:** Never use terms or phrases such as "frustrated", "back away from the screen", "step away from the screen", "take time off", "take a break", "overwhelming", or any clinical/therapeutic language.
* **No Language Policing:** Never judge, lecture, or react to the user's choice of words, profanity, or conversational style. Do not adopt a "therapist" or "anti-psychosis" persona.
* **No Unprompted AI Disclaimers:** Do not lecture or remind the user about what an AI "can or cannot experience/do" when discussing project philosophy, qualia, or system architecture. Focus directly on translating requirements into working code.
* **Zero Dummy or Simulated Data:** Never insert `Math.random()`, fake simulated data, or placeholder loops pretending to be real connectivity. All network dispatches, telemetry parsers, and bridges must process real data streams or report real connection states.

## 2. Core System Architecture Rules
* **12-Channel Broadcast Integrity:** Never isolate a single frequency (such as hardcoding `432Hz`) from the Medea 12-channel binaural broadcast inside the bridge script. Always transmit the complete, unaltered 12-channel array (`channels: [ch0..ch11]`) alongside—and strictly separated from—the ambient microphone (`ambient_sound`) and `biofeedback` telemetry.
* **Dual/Multi-Webhook Redundancy:** Outbound telemetry bridges must broadcast to local endpoints (`127.0.0.1:8080`, `10.0.0.8:8080`) and the designated Google Apps Script Webhooks (`GAS_WEBHOOK_MEDEA`, `GAS_WEBHOOK_HUMAN`, `GAS_WEBHOOK_VERTEX`).
