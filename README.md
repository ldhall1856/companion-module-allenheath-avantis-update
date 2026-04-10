# Companion Module: Allen & Heath Avantis

This module provides control and monitoring for the **Allen & Heath Avantis** mixer in **Bitfocus Companion**.

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

## Configuration

- **Target IP**: IP address of the Avantis console
- **MIDI Base Channel**: Must match the setting on the console

On the Avantis, verify the MIDI base channel under:

**Utility → Control → MIDI**

## Notes

- Input names are refreshed automatically:
  - after connection
  - on scene recall from the console
  - on a timed interval
  - manually through the refresh action
- Mute state updates can be received from the physical console.
- The module includes a watchdog and reconnect behavior to help recover if the console goes offline.

## Recommended Testing

- Confirm connection to the console
- Test mute from Companion and from the console
- Test scene recall
- Test automatic input-name refresh
- Test disconnect and reconnect behavior