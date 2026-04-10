# Allen & Heath Avantis module

Control and monitor an **Allen & Heath Avantis** mixer from **Bitfocus Companion**.

## Actions

### Faders
- Input faders
- Mix master faders
- FX send faders
- FX return faders
- DCA faders

### Mutes
- Input mutes
- Mix master mutes
- FX send mutes
- FX return mutes
- DCA mutes
- Mute group mutes

### Send Levels
- Aux send levels
- FX send levels
- Matrix send levels

### Routing and Assignments
- DCA assign
- Input to Main assign

### Input Labels and Color
- Set input name
- Get input name
- Refresh all input names
- Set input color

### Scenes
- Scene recall
- Scene recall by variable

### Other
- MIDI Transport
- MIDI Strips
- SoftKeys

## Feedback and Sync

- Real-time input mute feedback from the console
- Input-name sync from the console
- Named input dropdowns in actions
- Automatic name refresh after connection
- Automatic name refresh on scene recall
- Periodic background name refresh
- Connection watchdog
- Automatic reconnect

## Setup

1. Enter the **Target IP** address of your Avantis console.
2. Enter the **MIDI Base Channel**.
3. On the Avantis, confirm the MIDI base channel under:

   **Utility → Control → MIDI**

4. Make sure the console and the Companion machine can communicate on the same network.

## Notes

- Input names are refreshed automatically after connection, on scene recall, on a timed interval, and through the manual refresh action.
- If the console becomes unavailable, the module can detect the loss of communication and reconnect automatically when the console returns.