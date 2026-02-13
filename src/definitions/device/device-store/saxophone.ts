import { reactive } from "vue";
import { openDeckManufacturerId } from "../../interface";
import { deviceState } from "./state";
import { delay } from "../../../util";

// Matches firmware custom saxophone SysEx messages:
// F0 00 53 43 7E <cmd> ... F7

const SAX_SYSEX_TAG = 0x7e;

const CMD_SET = 0x01;
const CMD_DELETE = 0x02;
const CMD_GET_MASK_REQUEST = 0x03;
const CMD_GET_MASK_RESPONSE = 0x04;
const CMD_GET_ENTRY_REQUEST = 0x05;
const CMD_GET_ENTRY_RESPONSE = 0x06;
const CMD_SET_RESPONSE = 0x07;
const CMD_DELETE_RESPONSE = 0x08;

const unpackMask = (m0: number, m1: number, m2: number, m3: number): number =>
  (m0 & 0x7f) |
  ((m1 & 0x7f) << 7) |
  ((m2 & 0x7f) << 14) |
  ((m3 & 0x7f) << 21);

const packMask = (mask: number): [number, number, number, number] => [
  mask & 0x7f,
  (mask >> 7) & 0x7f,
  (mask >> 14) & 0x7f,
  (mask >> 21) & 0x7f,
];

export const saxophoneState = reactive({
  currentMask: null as number | null,
  lastUpdated: null as Date | null,
  entries: Array.from({ length: 128 }, () => null) as Array<
    | null
    | {
        used: boolean;
        mask: number;
        note: number;
      }
  >,
  receivedEntries: {} as Record<number, boolean>,
  isLoadingEntries: false,
});

export const saxophoneActions = {
  requestCurrentMask(): void {
    if (!deviceState.output) {
      return;
    }

    deviceState.output.sendSysex(openDeckManufacturerId, [
      SAX_SYSEX_TAG,
      CMD_GET_MASK_REQUEST,
    ]);
  },

  requestEntry(index: number): void {
    if (!deviceState.output) {
      return;
    }

    const idx = index & 0x7f;
    deviceState.output.sendSysex(openDeckManufacturerId, [
      SAX_SYSEX_TAG,
      CMD_GET_ENTRY_REQUEST,
      idx,
    ]);
  },

  async loadAllEntries(): Promise<void> {
    saxophoneState.isLoadingEntries = true;
    saxophoneState.receivedEntries = {};
    saxophoneState.entries = Array.from({ length: 128 }, () => null);

    for (let i = 0; i < 128; i++) {
      saxophoneActions.requestEntry(i);
      // Small delay to avoid flooding USB-MIDI/SysEx buffers
      await delay(5);
    }

    saxophoneState.isLoadingEntries = false;
  },

  setMapping(mask: number, note: number): void {
    if (!deviceState.output) {
      return;
    }

    const [m0, m1, m2, m3] = packMask(mask >>> 0);
    deviceState.output.sendSysex(openDeckManufacturerId, [
      SAX_SYSEX_TAG,
      CMD_SET,
      m0,
      m1,
      m2,
      m3,
      note & 0x7f,
    ]);
  },

  deleteMapping(mask: number): void {
    if (!deviceState.output) {
      return;
    }

    const [m0, m1, m2, m3] = packMask(mask >>> 0);
    deviceState.output.sendSysex(openDeckManufacturerId, [
      SAX_SYSEX_TAG,
      CMD_DELETE,
      m0,
      m1,
      m2,
      m3,
    ]);
  },
};

export const handleSaxSysExEvent = (eventData: Uint8Array): boolean => {
  // Expected format from WebMidi: [F0, 00,53,43, tag, cmd, ..., F7]
  if (!eventData || eventData.length < 7) {
    return false;
  }

  if (eventData[0] !== 0xf0) {
    return false;
  }

  // Manufacturer id check (00 53 43)
  if (eventData[1] !== 0x00 || eventData[2] !== 0x53 || eventData[3] !== 0x43) {
    return false;
  }

  if (eventData[4] !== SAX_SYSEX_TAG) {
    return false;
  }

  const cmd = eventData[5];
  if (cmd === CMD_GET_MASK_RESPONSE) {
    // F0 00 53 43 7E 04 m0 m1 m2 m3 F7
    if (eventData.length < 11) {
      return true;
    }

    const mask = unpackMask(eventData[6], eventData[7], eventData[8], eventData[9]);
    saxophoneState.currentMask = mask;
    saxophoneState.lastUpdated = new Date();
    return true;
  }

  if (cmd === CMD_GET_ENTRY_RESPONSE) {
    // F0 00 53 43 7E 06 index used m0 m1 m2 m3 note F7
    if (eventData.length < 14) {
      return true;
    }

    const index = eventData[6] & 0x7f;
    const used = (eventData[7] & 0x7f) === 1;
    const mask = unpackMask(eventData[8], eventData[9], eventData[10], eventData[11]);
    const note = eventData[12] & 0x7f;

    saxophoneState.entries[index] = {
      used,
      mask,
      note,
    };
    saxophoneState.receivedEntries[index] = true;
    return true;
  }

  if (cmd === CMD_SET_RESPONSE || cmd === CMD_DELETE_RESPONSE) {
    // F0 00 53 43 7E <07|08> index ok m0 m1 m2 m3 note F7
    if (eventData.length < 14) {
      return true;
    }

    const index = eventData[6] & 0x7f;
    const ok = (eventData[7] & 0x7f) === 1;
    const mask = unpackMask(eventData[8], eventData[9], eventData[10], eventData[11]);
    const note = eventData[12] & 0x7f;

    if (ok && index < saxophoneState.entries.length) {
      saxophoneState.entries[index] = {
        used: cmd === CMD_SET_RESPONSE,
        mask,
        note,
      };
      saxophoneState.receivedEntries[index] = true;

      // Confirm device state for this slot
      saxophoneActions.requestEntry(index);
    }

    return true;
  }

  // Swallow other sax messages so they don't interfere with the OpenDeck request queue.
  return true;
};
