# Allen & Heath Avantis module

Control and monitor an **Allen & Heath Avantis** mixer from **Bitfocus Companion**.

## Features

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
- Scene detection from console
- Automatic input-name refresh on scene change

### Feedback and Sync
- Real-time mute feedback from the console
- Input-name sync from the console
- Named input dropdowns in actions
- Automatic name refresh after connection
- Automatic periodic name refresh
- Connection watchdog
- Automatic reconnect

### Other
- MIDI Transport
- MIDI Strips
- SoftKeys

## Setup

1. Enter the **Target IP** address of your Avantis console.
2. Enter the **MIDI Base Channel**.
3. On the Avantis, confirm the MIDI base channel under:

   **Utility → Control → MIDI**

4. Make sure the console and the Companion machine can communicate on the same network.

## Notes

- Input names are refreshed automatically:
  - after connection
  - on scene recall from the console
  - on a timed interval
  - manually through the refresh action
- Mute state updates can be received from the physical console.
- The module includes a watchdog and reconnect behavior to help recover if the console goes offline.

## Current supported workflows

- Control Avantis from Companion
- Receive mute feedback from Avantis
- Sync input names from Avantis
- Refresh names automatically after scene changes
- Use live input names in action dropdowns

## Known behavior

- If the console powers off unexpectedly, disconnect detection may take a short time depending on network conditions.
- Name refresh timing is intentionally paced to improve reliability across all inputs.

## Configuration

### Target IP
The IP address of the Avantis console.

### MIDI Base Channel
The MIDI base channel configured on the Avantis. This must match the console setting.

## Recommended testing before use

- Confirm connection to the console
- Test mute from Companion and from the console
- Test scene recall
- Test automatic input-name refresh
- Test disconnect and reconnect behavior

## Module status

This module has been updated to improve:
- input-name synchronization
- scene-based name refresh
- named input dropdowns
- watchdog connection handling
- automatic reconnect behavior
