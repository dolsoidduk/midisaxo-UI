<template>
  <Section :showContent="!!showSaxSection" wide class="w-full">
    <template #title>
      <h3 class="section-heading">
        <div class="section-heading-inner flex items-center justify-between">
          <span>Saxophone</span>
          <FormToggle
            :value="showSaxSection"
            class="toggle-sm labeled"
            @changed="(v) => (showSaxSection = v)"
          >
            open
          </FormToggle>
        </div>
      </h3>
    </template>
    <div class="pb-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 gap-y-4">
        <div class="form-field">
          <label class="label">Transpose preset</label>
          <FormSelect
            :value="transposePreset"
            :options="transposePresetOptions"
            :disabled="!isConnected || isTransposeBusy"
            @changed="onTransposePresetChanged"
          />
          <p class="help-text">
            C/A/T/S/B preset saved in System Settings (applies globally). Current offset: {{ transposeOffsetText }}.
          </p>
        </div>

        <div class="form-field">
          <label class="label">Current fingering</label>
          <div class="flex items-center gap-4">
            <Button :disabled="!isConnected" @click.prevent="requestMask">
              Read current fingering
            </Button>
            <div class="text-sm text-gray-200">
              <span class="faded">Mask</span>
              <span class="ml-2 font-mono">{{ maskHex }}</span>
              <span v-if="lastUpdated" class="ml-2 text-gray-400">
                (updated)
              </span>
            </div>
          </div>
          <p class="help-text">
            Requests current 26-bit fingering mask from device (SysEx 0x7E).
          </p>

          <div class="mt-3">
            <table class="mask-bit-table">
              <tbody>
                <tr v-for="row in 2" :key="row">
                  <td v-for="col in 13" :key="col">
                    <button
                      v-if="(row - 1) * 13 + (col - 1) < 26"
                      type="button"
                      class="h-8 w-8 rounded border text-xs font-mono flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-gray-400"
                      :class="
                        isMaskBitSet((row - 1) * 13 + (col - 1))
                          ? 'bg-gray-200 text-gray-900 border-gray-300'
                          : 'bg-transparent text-gray-200 border-gray-600 hover:border-gray-300 hover:text-gray-100'
                      "
                      :disabled="!isConnected"
                      @click.prevent="toggleMaskBit((row - 1) * 13 + (col - 1))"
                    >
                      {{ (row - 1) * 13 + (col - 1) }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="help-text">
              Click bits to edit the mask used by Set/Delete.
            </p>
          </div>
        </div>

        <div class="form-field">
          <label class="label">Mapping</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div>
              <label class="label">
                Note number
                <small class="instructions">0 - 127</small>
              </label>
              <FormInput
                :value="note"
                type="number"
                name="sax-note"
                @changed="onNoteChanged"
              />
              <p class="help-text">
                MIDI note number to assign to current mask.
              </p>
            </div>

            <div>
              <div class="flex items-center gap-2">
                <Button :disabled="!canSet" @click.prevent="setMapping">
                  Set
                </Button>
                <Button :disabled="!canDelete" @click.prevent="deleteMapping">
                  Delete
                </Button>
              </div>
              <p class="help-text">Stores mapping in device flash.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Section>

  <Section :showContent="!!showCalibrationSection" wide class="w-full">
    <template #title>
      <h3 class="section-heading">
        <div class="section-heading-inner flex items-center justify-between">
          <span>Analog / Calibration</span>
          <FormToggle
            :value="showCalibrationSection"
            class="toggle-sm labeled"
            @changed="(v) => (showCalibrationSection = v)"
          >
            open
          </FormToggle>
        </div>
      </h3>
    </template>
    <div class="pb-8">
      <div class="form-field">
        <Button
          :disabled="!isConnected || isCalibrationAnyBusy"
          @click.prevent="refreshCalibration"
        >
          Refresh calibration values
        </Button>
        <p class="help-text">
          Reads calibration-related system settings (SysExConf).
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 gap-y-4">
        <div class="form-field">
          <label class="label">Pitch Bend (analog1)</label>
          <div class="mt-2 flex items-center gap-3">
            <span class="text-sm text-gray-200">
              <span class="faded">Pin</span>
              <span class="ml-2 font-mono">{{ analog1PinText }}</span>
            </span>
            <span class="text-sm text-gray-200">
              <span class="faded">Cal</span>
              <span class="ml-2">{{ pbEnableText }}</span>
            </span>
          </div>
          <p v-if="adcPinMapStatus" class="mt-2 text-sm text-gray-400">
            {{ adcPinMapStatus }}
          </p>

          <div class="mt-4">
            <label class="label">
              Deadzone (snap)
              <small class="instructions">0 - 2048</small>
            </label>
            <input
              class="mt-1 block w-full max-w-sm"
              type="range"
              min="0"
              max="2048"
              step="1"
              :disabled="!isConnected || isCalibrationWriteBusy"
              :value="pbDeadzone ?? 0"
              @change="(e) => onPbDeadzoneChanged(e.target.value)"
            />
            <div class="text-sm text-gray-200">
              <span class="faded">Deadzone</span>
              <span class="ml-2 font-mono">{{ pbDeadzoneText }}</span>
            </div>
          </div>

          <div class="mt-4">
            <label class="label">
              Center (offset)
              <small class="instructions">0 - 16383</small>
            </label>
            <input
              class="mt-1 block w-full max-w-sm"
              type="range"
              min="0"
              max="16383"
              step="1"
              :disabled="!isConnected || isCalibrationWriteBusy"
              :value="pbCenter ?? 0"
              @change="(e) => onPbCenterChanged(e.target.value)"
            />
            <div class="text-sm text-gray-200">
              <span class="faded">Center</span>
              <span class="ml-2 font-mono">{{ pbCenterText }}</span>
            </div>
          </div>

          <div class="mt-4">
            <label class="label">
              Min
              <small class="instructions">0 - 16383</small>
            </label>
            <input
              class="mt-1 block w-full max-w-sm"
              type="range"
              min="0"
              max="16383"
              step="1"
              :disabled="!isConnected || isCalibrationWriteBusy"
              :value="pbMin ?? 0"
              @change="(e) => onPbMinChanged(e.target.value)"
            />
            <div class="text-sm text-gray-200">
              <span class="faded">Min</span>
              <span class="ml-2 font-mono">{{ pbMinText }}</span>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-2">
            <Button
              :disabled="!isConnected || isCalibrationAnyBusy"
              @click.prevent="capturePitchBendCenter"
            >
              Capture center
            </Button>
            <Button
              :disabled="!isConnected || isCalibrationAnyBusy"
              @click.prevent="capturePitchBendMin"
            >
              Capture min
            </Button>
          </div>
          <p class="help-text">
            Captures current analog1 value into calibration settings.
          </p>
        </div>

        <div class="form-field">
          <label class="label">Breath (analog0)</label>
          <div class="mt-2 flex items-center gap-3">
            <span class="text-sm text-gray-200">
              <span class="faded">Pin</span>
              <span class="ml-2 font-mono">{{ analog0PinText }}</span>
            </span>
          </div>
          <p v-if="adcPinMapStatus" class="mt-2 text-sm text-gray-400">
            {{ adcPinMapStatus }}
          </p>

          <div class="mt-4">
            <label class="label">Breath CC</label>
            <FormSelect
              :value="breathCcMode"
              :options="breathCcModeOptions"
              :disabled="!isConnected || isCalibrationWriteBusy"
              @changed="onBreathCcModeChanged"
            />
            <p class="help-text">
              Selects which MIDI CC to send for breath: CC02, CC11, or both (mirrored).
            </p>
          </div>

          <div class="mt-4">
            <label class="label">
              Offset (zero)
              <small class="instructions">0 - 16383</small>
            </label>
            <input
              class="mt-1 block w-full max-w-sm"
              type="range"
              min="0"
              max="16383"
              step="1"
              :disabled="!isConnected || isCalibrationWriteBusy"
              :value="breathZero ?? 0"
              @change="(e) => onBreathZeroChanged(e.target.value)"
            />
            <div class="text-sm text-gray-200">
              <span class="faded">Zero</span>
              <span class="ml-2 font-mono">{{ breathZeroText }}</span>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-2">
            <Button
              :disabled="!isConnected || isCalibrationAnyBusy"
              @click.prevent="captureBreathZero"
            >
              Capture zero
            </Button>
          </div>
          <p class="help-text">
            Captures no-breath baseline; values below become 0.
          </p>
        </div>
      </div>
    </div>
  </Section>

  <Section :showContent="!!showMappingsSection" wide class="w-full">
    <template #title>
      <h3 class="section-heading">
        <div class="section-heading-inner flex items-center justify-between">
          <span>Stored mappings</span>
          <FormToggle
            :value="showMappingsSection"
            class="toggle-sm labeled"
            @changed="(v) => (showMappingsSection = v)"
          >
            open
          </FormToggle>
        </div>
      </h3>
    </template>
    <div class="pb-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 gap-y-4 items-end">
        <div class="form-field">
          <label class="label">Mappings</label>
          <div class="flex items-center gap-2">
            <Button
              :disabled="!isConnected || isLoadingEntries"
              @click.prevent="loadMappings"
            >
              Load mappings
            </Button>
            <span class="text-sm text-gray-200">
              <span class="faded">Received</span>
              <span class="ml-2">{{ receivedCount }} / 128</span>
            </span>
          </div>
          <p class="help-text">Reads all 128 mapping slots from device.</p>
        </div>

        <div class="form-field">
          <label class="label">Backup</label>
          <div class="flex items-center gap-2">
            <Button
              :disabled="!isConnected || isBackupBusy"
              @click.prevent="exportMappingsJson"
            >
              Export JSON
            </Button>
            <Button
              :disabled="!isConnected || isBackupBusy"
              @click.prevent="triggerImportJson"
            >
              Import JSON
            </Button>
            <Button
              :disabled="!isConnected || isBackupBusy"
              @click.prevent="exportMappingsSyx"
            >
              Export SYX
            </Button>
            <Button
              :disabled="!isConnected || isBackupBusy"
              @click.prevent="triggerImportSyx"
            >
              Import SYX
            </Button>
            <input
              ref="importInput"
              class="hidden"
              type="file"
              accept=".json,application/json"
              @change="onImportFileChanged"
            />
            <input
              ref="importSyxInput"
              class="hidden"
              type="file"
              accept=".syx,application/octet-stream"
              @change="onImportSyxFileChanged"
            />
          </div>
          <p class="help-text">
            Saves/restores fingering mappings as a JSON file on this computer.
          </p>
          <p v-if="backupStatus" class="mt-2 text-sm text-gray-200">
            <span class="faded">Backup</span>
            <span class="ml-2">{{ backupStatus }}</span>
          </p>
        </div>
      </div>
    </div>

    <div class="mt-4">
      <div v-if="!nonEmptyEntries.length" class="text-sm text-gray-400">
        No entries loaded (or all empty).
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm text-gray-200">
        <thead>
          <tr class="text-gray-400">
            <th class="text-left pr-4 py-2">#</th>
            <th class="text-left pr-4 py-2">Mask</th>
            <th class="text-left pr-4 py-2">Note</th>
            <th class="text-left pr-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in nonEmptyEntries" :key="row.index">
            <td class="pr-4 py-2">{{ row.index }}</td>
            <td class="pr-4 py-2 font-mono">{{ row.maskHex }}</td>
            <td class="pr-4 py-2">{{ row.note }}</td>
            <td class="pr-4 py-2">
              <div class="flex items-center gap-2">
                <Button :disabled="!isConnected" @click.prevent="useEntry(row.index)">
                  Use
                </Button>
                <Button
                  :disabled="!isConnected"
                  @click.prevent="deleteEntry(row.index)"
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>
  </Section>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from "vue";
import { deviceStoreMapped } from "../../../store";
import { Block, ErrorCode, Request } from "../../../definitions";
import {
  saxophoneActions,
  saxophoneState,
} from "../../device/device-store/saxophone";
import { sendMessage } from "../../device/device-store/request-qeueue";
import FormInput from "../../../components/form/FormInput.vue";
import FormSelect from "../../../components/form/FormSelect.vue";
import FormToggle from "../../../components/form/FormToggle.vue";
import { delay } from "../../../util";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export default defineComponent({
  name: "SaxophoneView",
  components: {
    FormInput,
    FormSelect,
    FormToggle,
  },
  setup() {
    const { isConnected } = deviceStoreMapped;

    const showSaxSection = ref(1);
    const showCalibrationSection = ref(1);
    const showMappingsSection = ref(1);

    const note = ref(60);

    const currentMask = computed(() => saxophoneState.currentMask);
    const lastUpdated = computed(() => saxophoneState.lastUpdated);

    const isMaskDirty = ref(false);
    const editMask = ref<number | null>(null);

    const effectiveMask = computed(() => {
      if (editMask.value !== null && editMask.value !== undefined) {
        return editMask.value;
      }

      return currentMask.value;
    });

    const isLoadingEntries = computed(() => saxophoneState.isLoadingEntries);
    const receivedCount = computed(
      () => Object.keys(saxophoneState.receivedEntries || {}).length,
    );

    const isBackupBusy = ref(false);
    const backupStatus = ref<string | null>(null);
    const importInput = ref<HTMLInputElement | null>(null);
    const importSyxInput = ref<HTMLInputElement | null>(null);

    const SAX_SYSEX_TAG = 0x7e;
    const CMD_SET = 0x01;

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

    const waitForReceivedEntries = async (expected: number, timeoutMs: number) => {
      const started = Date.now();
      while (receivedCount.value < expected && Date.now() - started < timeoutMs) {
        backupStatus.value = `Reading mappings... (${receivedCount.value} / ${expected})`;
        await delay(100);
      }
      return receivedCount.value;
    };

    const refreshMappingsForBackup = async (): Promise<number> => {
      if (!isConnected.value) {
        backupStatus.value = "Not connected";
        return 0;
      }

      await saxophoneActions.loadAllEntries();
      const got = await waitForReceivedEntries(128, 6000);
      backupStatus.value = `Received ${got} / 128`;
      return got;
    };

    const exportMappingsJson = async (): Promise<void> => {
      if (!isConnected.value) {
        backupStatus.value = "Not connected";
        return;
      }

      try {
        isBackupBusy.value = true;
        backupStatus.value = "Preparing export...";

        await refreshMappingsForBackup();

        const mappings = saxophoneState.entries
          .filter((e) => !!e && e.used)
          .map((e) => ({ mask: (e!.mask >>> 0) as number, note: (e!.note & 0x7f) as number }));

        const payload = {
          version: 1,
          createdAt: new Date().toISOString(),
          mappings,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const ts = new Date()
          .toISOString()
          .replaceAll(":", "")
          .replaceAll("-", "")
          .replace("T", "_")
          .replace("Z", "");
        a.href = url;
        a.download = `midisaxo-fingering-mappings-${ts}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        backupStatus.value = `Exported ${mappings.length} mapping(s)`;
      } catch (e) {
        backupStatus.value = "Export failed";
      } finally {
        isBackupBusy.value = false;
      }
    };

    const exportMappingsSyx = async (): Promise<void> => {
      if (!isConnected.value) {
        backupStatus.value = "Not connected";
        return;
      }

      try {
        isBackupBusy.value = true;
        backupStatus.value = "Preparing SYX export...";

        await refreshMappingsForBackup();

        const used = saxophoneState.entries
          .filter((e) => !!e && e.used)
          .map((e) => ({ mask: (e!.mask >>> 0) as number, note: (e!.note & 0x7f) as number }));

        const bytes: number[] = [];
        for (const m of used) {
          const [m0, m1, m2, m3] = packMask(m.mask >>> 0);
          // F0 00 53 43 7E 01 m0 m1 m2 m3 note F7
          bytes.push(
            0xf0,
            0x00,
            0x53,
            0x43,
            SAX_SYSEX_TAG,
            CMD_SET,
            m0,
            m1,
            m2,
            m3,
            m.note & 0x7f,
            0xf7,
          );
        }

        const blob = new Blob([new Uint8Array(bytes)], {
          type: "application/octet-stream",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const ts = new Date()
          .toISOString()
          .replaceAll(":", "")
          .replaceAll("-", "")
          .replace("T", "_")
          .replace("Z", "");
        a.href = url;
        a.download = `midisaxo-fingering-mappings-${ts}.syx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        backupStatus.value = `Exported SYX (${used.length} message(s))`;
      } catch (e) {
        backupStatus.value = "SYX export failed";
      } finally {
        isBackupBusy.value = false;
      }
    };

    const triggerImportJson = (): void => {
      if (!isConnected.value) {
        backupStatus.value = "Not connected";
        return;
      }

      importInput.value?.click();
    };

    const triggerImportSyx = (): void => {
      if (!isConnected.value) {
        backupStatus.value = "Not connected";
        return;
      }

      importSyxInput.value?.click();
    };

    const onImportFileChanged = async (event: Event): Promise<void> => {
      const input = event.target as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (!file) {
        return;
      }

      // Allow selecting the same file again
      if (input) {
        input.value = "";
      }

      try {
        isBackupBusy.value = true;
        backupStatus.value = "Importing...";

        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;

        const rawMappings = Array.isArray(parsed)
          ? parsed
          : (parsed as { mappings?: unknown }).mappings;

        if (!Array.isArray(rawMappings)) {
          backupStatus.value = "Invalid JSON (missing mappings[])";
          return;
        }

        const normalized: Array<{ mask: number; note: number }> = [];
        let invalid = 0;
        for (const m of rawMappings) {
          const mm = m as { mask?: unknown; note?: unknown };
          const mask = Number(mm.mask);
          const note = Number(mm.note);
          const maskOk = Number.isInteger(mask) && mask >= 0 && mask < (1 << 26);
          const noteOk = Number.isInteger(note) && note >= 0 && note <= 127;
          if (!maskOk || !noteOk) {
            invalid++;
            continue;
          }
          normalized.push({ mask: mask >>> 0, note: note & 0x7f });
          if (normalized.length >= 128) {
            break;
          }
        }

        if (!normalized.length) {
          backupStatus.value = invalid
            ? `No valid mappings (invalid: ${invalid})`
            : "No mappings in file";
          return;
        }

        // Refresh current device state so we can skip existing masks
        await refreshMappingsForBackup();
        const existingMasks = new Set<number>();
        for (const entry of saxophoneState.entries) {
          if (entry && entry.used) {
            existingMasks.add(entry.mask >>> 0);
          }
        }

        let imported = 0;
        let skipped = 0;
        for (const m of normalized) {
          if (existingMasks.has(m.mask)) {
            skipped++;
            continue;
          }
          saxophoneActions.setMapping(m.mask >>> 0, m.note & 0x7f);
          existingMasks.add(m.mask);
          imported++;
          await delay(10);
        }

        backupStatus.value = `Imported ${imported}, skipped ${skipped}, invalid ${invalid}`;
      } catch (e) {
        backupStatus.value = "Import failed";
      } finally {
        isBackupBusy.value = false;
      }
    };

    const parseSyxMessages = (data: Uint8Array): Uint8Array[] => {
      const messages: Uint8Array[] = [];
      let i = 0;
      while (i < data.length) {
        while (i < data.length && data[i] !== 0xf0) {
          i++;
        }
        if (i >= data.length) {
          break;
        }
        const start = i;
        while (i < data.length && data[i] !== 0xf7) {
          i++;
        }
        if (i >= data.length) {
          break;
        }
        const end = i;
        messages.push(data.slice(start, end + 1));
        i = end + 1;
      }
      return messages;
    };

    const onImportSyxFileChanged = async (event: Event): Promise<void> => {
      const input = event.target as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (!file) {
        return;
      }

      if (input) {
        input.value = "";
      }

      try {
        isBackupBusy.value = true;
        backupStatus.value = "Importing SYX...";

        const buf = await file.arrayBuffer();
        const data = new Uint8Array(buf);
        const messages = parseSyxMessages(data);

        // Refresh current device state so we can skip existing masks
        await refreshMappingsForBackup();
        const existingMasks = new Set<number>();
        for (const entry of saxophoneState.entries) {
          if (entry && entry.used) {
            existingMasks.add(entry.mask >>> 0);
          }
        }

        let found = 0;
        let imported = 0;
        let skipped = 0;
        let invalid = 0;
        for (const msg of messages) {
          // Expected: F0 00 53 43 7E 01 m0 m1 m2 m3 note F7
          if (msg.length !== 12) {
            continue;
          }
          if (
            msg[0] !== 0xf0 ||
            msg[1] !== 0x00 ||
            msg[2] !== 0x53 ||
            msg[3] !== 0x43 ||
            msg[4] !== SAX_SYSEX_TAG ||
            msg[5] !== CMD_SET ||
            msg[11] !== 0xf7
          ) {
            continue;
          }

          found++;
          const mask = unpackMask(msg[6], msg[7], msg[8], msg[9]) >>> 0;
          const note = msg[10] & 0x7f;
          const maskOk = Number.isInteger(mask) && mask >= 0 && mask < (1 << 26);
          const noteOk = Number.isInteger(note) && note >= 0 && note <= 127;
          if (!maskOk || !noteOk) {
            invalid++;
            continue;
          }

          if (existingMasks.has(mask)) {
            skipped++;
            continue;
          }

          saxophoneActions.setMapping(mask >>> 0, note & 0x7f);
          existingMasks.add(mask);
          imported++;

          if (imported % 8 === 0) {
            backupStatus.value = `Importing SYX... (${imported} ok, ${skipped} skipped)`;
          }

          await delay(10);
        }

        if (!found) {
          backupStatus.value = "No supported messages found in SYX";
          return;
        }

        backupStatus.value = `Imported SYX ${imported}, skipped ${skipped}, invalid ${invalid}`;
      } catch (e) {
        backupStatus.value = "SYX import failed";
      } finally {
        isBackupBusy.value = false;
      }
    };

    const nonEmptyEntries = computed(() => {
      const rows = [] as Array<{ index: number; maskHex: string; note: number }>;
      saxophoneState.entries.forEach((entry, index) => {
        if (!entry || !entry.used) {
          return;
        }
        const hex = (entry.mask >>> 0).toString(16).padStart(8, "0");
        rows.push({ index, maskHex: `0x${hex}`, note: entry.note });
      });
      return rows;
    });

    const maskHex = computed(() => {
      const mask = effectiveMask.value;
      if (mask === null || mask === undefined) {
        return "-";
      }

      const hex = (mask >>> 0).toString(16).padStart(8, "0");
      return `0x${hex}`;
    });

    const canSet = computed(
      () =>
        isConnected.value &&
        effectiveMask.value !== null &&
        Number.isFinite(note.value) &&
        note.value >= 0 &&
        note.value <= 127,
    );

    const canDelete = computed(() => isConnected.value && effectiveMask.value !== null);

    const isMaskBitSet = (bit: number): boolean => {
      const mask = effectiveMask.value;
      if (mask === null || mask === undefined) {
        return false;
      }

      return ((mask >>> 0) & (1 << bit)) !== 0;
    };

    const toggleMaskBit = (bit: number): void => {
      if (!isConnected.value) {
        return;
      }

      const base = effectiveMask.value ?? 0;
      const next = (base >>> 0) ^ (1 << bit);
      editMask.value = next;
      isMaskDirty.value = true;
    };

    const requestMask = () => {
      isMaskDirty.value = false;
      saxophoneActions.requestCurrentMask();
    };

    // SysExConf system settings indices (see firmware sys::Config::systemSetting_t)
    const SYS_SETTINGS_SECTION = 2;
    const SS_BREATH_LINK_CC2_CC11 = 4;
    const SS_PB_CAL_ENABLE = 5;
    const SS_PB_CAL_MIN = 6;
    const SS_PB_CAL_CENTER = 7;
    const SS_PB_CAL_CAPTURE_MIN = 8;
    const SS_PB_CAL_CAPTURE_CENTER = 9;
    const SS_BREATH_CAL_ZERO = 10;
    const SS_BREATH_CAL_CAPTURE_ZERO = 11;
    const SS_TRANSPOSE_PRESET = 12;
    const SS_PB_DEADZONE = 13;

    const isCalibrationWriteBusy = ref(false);
    const isCalibrationCaptureBusy = ref(false);
    const isCalibrationRefreshBusy = ref(false);

    const isCalibrationAnyBusy = computed(
      () =>
        isCalibrationWriteBusy.value ||
        isCalibrationCaptureBusy.value ||
        isCalibrationRefreshBusy.value,
    );

    const isAdcPinMapBusy = ref(false);
    const adcPinMap = ref<Array<{ port: number; index: number }> | null>(null);
    const adcPinMapStatus = ref<string | null>(null);

    const breathCcMode = ref<number | null>(null);
    const pbEnable = ref<number | null>(null);
    const pbMin = ref<number | null>(null);
    const pbCenter = ref<number | null>(null);
    const pbDeadzone = ref<number | null>(null);
    const breathZero = ref<number | null>(null);

    const isTransposeBusy = ref(false);
    const transposePreset = ref<number | null>(null);

    const transposePresetOptions = () => [
      { value: 0, text: "C (Concert)" },
      { value: 1, text: "A (Alto / Eb)" },
      { value: 2, text: "T (Tenor / Bb)" },
      { value: 3, text: "S (Soprano / Bb)" },
      { value: 4, text: "B (Baritone / Eb)" },
    ];

    const transposeOffsetText = computed(() => {
      switch (transposePreset.value) {
        case 0:
          return "0";
        case 1:
          return "-9";
        case 2:
          return "-14";
        case 3:
          return "-2";
        case 4:
          return "-21";
        default:
          return "-";
      }
    });

    const pbEnableText = computed(() => {
      if (pbEnable.value === null || pbEnable.value === undefined) {
        return "-";
      }
      return pbEnable.value ? "On" : "Off";
    });

    const pbMinText = computed(() =>
      pbMin.value === null || pbMin.value === undefined ? "-" : String(pbMin.value),
    );

    const pbCenterText = computed(() =>
      pbCenter.value === null || pbCenter.value === undefined
        ? "-"
        : String(pbCenter.value),
    );

    const pbDeadzoneText = computed(() =>
      pbDeadzone.value === null || pbDeadzone.value === undefined
        ? "-"
        : String(pbDeadzone.value),
    );

    const breathZeroText = computed(() =>
      breathZero.value === null || breathZero.value === undefined
        ? "-"
        : String(breathZero.value),
    );

    const readSystemSetting = async (index: number): Promise<number | null> => {
      let value: number | null = null;

      await sendMessage({
        command: Request.GetValue,
        handler: (res: number[]): void => {
          const v = res?.[0];
          value = Number.isFinite(v) ? v : null;
        },
        config: {
          block: Block.Global,
          section: SYS_SETTINGS_SECTION,
          index,
        },
      });

      return value;
    };

    const writeSystemSetting = async (
      index: number,
      value: number,
    ): Promise<void> => {
      await sendMessage({
        command: Request.SetValue,
        handler: (): void => {},
        config: {
          block: Block.Global,
          section: SYS_SETTINGS_SECTION,
          index,
          value,
        },
      });
    };

    const loadAdcPinMap = async (): Promise<void> => {
      if (!isConnected.value || isAdcPinMapBusy.value) {
        return;
      }

      isAdcPinMapBusy.value = true;
      adcPinMapStatus.value = "Loading pin map...";

      try {
        await sendMessage({
          command: Request.GetAdcPinMap,
          handler: (res: number[]): void => {
            if (!Array.isArray(res) || res.length < 1) {
              adcPinMap.value = null;
              adcPinMapStatus.value = "Pin map unavailable";
              return;
            }

            const count = Number(res[0]);
            if (!Number.isFinite(count) || count <= 0) {
              adcPinMap.value = [];
              adcPinMapStatus.value = "Pin map not provided by firmware";
              return;
            }

            const pins: Array<{ port: number; index: number }> = [];
            for (let i = 0; i < count; i++) {
              const port = Number(res[1 + i * 2]);
              const index = Number(res[1 + i * 2 + 1]);

              if (!Number.isFinite(port) || !Number.isFinite(index)) {
                break;
              }

              pins.push({ port, index });
            }

            adcPinMap.value = pins;
            adcPinMapStatus.value = null;
          },
        });
      } catch (err) {
        console.error("Failed to load ADC pin map", err);
        adcPinMap.value = null;
        if (err === ErrorCode.NOT_SUPPORTED) {
          adcPinMapStatus.value = "Pin map not supported (update firmware)";
        } else {
          adcPinMapStatus.value = "Pin map request failed";
        }
      } finally {
        isAdcPinMapBusy.value = false;
      }
    };

    const pinTextForAnalog = (analogIndex: number): string => {
      const pin = adcPinMap.value?.[analogIndex];
      if (!pin) {
        return "-";
      }

      // RP2040 style: port=0, index is GPIO number (e.g., 26,27,28)
      if (pin.port === 0) {
        return `GPIO${pin.index}`;
      }

      return `P${pin.port}:${pin.index}`;
    };

    const analog0PinText = computed(() => pinTextForAnalog(0));
    const analog1PinText = computed(() => pinTextForAnalog(1));

    const ANALOG_MIDI_ID_LSB_SECTION = 3;
    const ANALOG_MIDI_ID_MSB_SECTION = 4;

    const readAnalogValue = async (
      analogIndex: number,
      section: number,
    ): Promise<number> => {
      let value: number = null;

      await sendMessage({
        command: Request.GetValue,
        handler: (res: number[]): void => {
          value = res?.[0];
        },
        config: {
          block: Block.Analog,
          section,
          index: analogIndex,
        },
      });

      return value;
    };

    const writeAnalogValue = async (
      analogIndex: number,
      section: number,
      value: number,
    ): Promise<void> => {
      await sendMessage({
        command: Request.SetValue,
        handler: (): void => {},
        config: {
          block: Block.Analog,
          section,
          index: analogIndex,
          value,
        },
      });
    };

    const refreshCalibrationImpl = async (): Promise<void> => {
      const [
        enable,
        min,
        center,
        zero,
        preset,
        deadzone,
        breathLink,
        a0MidiIdLsb,
      ] = await Promise.all([
        readSystemSetting(SS_PB_CAL_ENABLE),
        readSystemSetting(SS_PB_CAL_MIN),
        readSystemSetting(SS_PB_CAL_CENTER),
        readSystemSetting(SS_BREATH_CAL_ZERO),
        readSystemSetting(SS_TRANSPOSE_PRESET),
        readSystemSetting(SS_PB_DEADZONE),
        readSystemSetting(SS_BREATH_LINK_CC2_CC11),
        readAnalogValue(0, ANALOG_MIDI_ID_LSB_SECTION),
      ]);

      pbEnable.value = Number.isFinite(enable) ? enable : null;
      pbMin.value = Number.isFinite(min) ? min : null;
      pbCenter.value = Number.isFinite(center) ? center : null;
      pbDeadzone.value = Number.isFinite(deadzone) ? deadzone : null;
      breathZero.value = Number.isFinite(zero) ? zero : null;

      // 0=CC02, 1=CC11, 2=CC02+CC11 (mirrored)
      if (Number.isFinite(breathLink) && breathLink) {
        breathCcMode.value = 2;
      } else if (Number.isFinite(a0MidiIdLsb) && Number(a0MidiIdLsb) === 11) {
        breathCcMode.value = 1;
      } else if (Number.isFinite(a0MidiIdLsb) && Number(a0MidiIdLsb) === 2) {
        breathCcMode.value = 0;
      } else {
        // Fallback: keep UI usable even if firmware/config doesn't expose the current mode.
        breathCcMode.value = 2;
      }

      const p = Number(preset);
      transposePreset.value = Number.isFinite(p) && p >= 0 && p <= 4 ? p : null;
    };

    const loadTransposePreset = async (): Promise<void> => {
      if (!isConnected.value || isTransposeBusy.value) {
        return;
      }

      isTransposeBusy.value = true;
      try {
        const preset = await readSystemSetting(SS_TRANSPOSE_PRESET);
        if (preset === null || preset === undefined) {
          transposePreset.value = null;
          return;
        }

        const p = Number(preset);
        transposePreset.value = Number.isFinite(p) && p >= 0 && p <= 4 ? p : null;
      } catch (err) {
        // Avoid unhandled promise rejections that can make UI controls appear unresponsive.
        // Keep current UI value if request fails.
        console.error("Failed to load sax transpose preset", err);
      } finally {
        isTransposeBusy.value = false;
      }
    };

    const onTransposePresetChanged = async (value: string | number) => {
      if (!isConnected.value || isTransposeBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 4) {
        return;
      }

      let shouldReloadFromDevice = false;
      isTransposeBusy.value = true;
      try {
        await writeSystemSetting(SS_TRANSPOSE_PRESET, parsed);
        transposePreset.value = parsed;
      } catch (err) {
        console.error("Failed to set sax transpose preset", err);
        shouldReloadFromDevice = true;
      } finally {
        isTransposeBusy.value = false;
      }

      if (shouldReloadFromDevice) {
        await loadTransposePreset();
      }
    };

    watch(
      isConnected,
      (v) => {
        if (v) {
          loadTransposePreset();
          loadAdcPinMap();
        } else {
          transposePreset.value = null;
          adcPinMap.value = null;
          editMask.value = null;
          isMaskDirty.value = false;
          breathCcMode.value = null;
          pbDeadzone.value = null;
          pbEnable.value = null;
          pbMin.value = null;
          pbCenter.value = null;
          breathZero.value = null;
        }
      },
      { immediate: true },
    );

    watch(
      currentMask,
      (v) => {
        if (isMaskDirty.value) {
          return;
        }

        editMask.value = v;
      },
      { immediate: true },
    );

    const refreshCalibration = async (): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      isCalibrationRefreshBusy.value = true;
      try {
        await refreshCalibrationImpl();
      } finally {
        isCalibrationRefreshBusy.value = false;
      }
    };

    const onPbDeadzoneChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return;
      }

      const v = clamp(parsed, 0, 2048);

      isCalibrationWriteBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_DEADZONE, v);
        pbDeadzone.value = v;
      } finally {
        isCalibrationWriteBusy.value = false;
      }
    };

    const onPbCenterChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return;
      }

      const v = clamp(parsed, 0, 16383);

      isCalibrationWriteBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_CAL_CENTER, v);
        pbCenter.value = v;
      } finally {
        isCalibrationWriteBusy.value = false;
      }
    };

    const onPbMinChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return;
      }

      const v = clamp(parsed, 0, 16383);

      isCalibrationWriteBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_CAL_MIN, v);
        pbMin.value = v;
      } finally {
        isCalibrationWriteBusy.value = false;
      }
    };

    const onBreathZeroChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return;
      }

      const v = clamp(parsed, 0, 16383);

      isCalibrationWriteBusy.value = true;
      try {
        await writeSystemSetting(SS_BREATH_CAL_ZERO, v);
        breathZero.value = v;
      } finally {
        isCalibrationWriteBusy.value = false;
      }
    };

    const breathCcModeOptions = () => [
      { value: 0, text: "CC02" },
      { value: 1, text: "CC11" },
      { value: 2, text: "CC02 + CC11" },
    ];

    const onBreathCcModeChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
        return;
      }

      isCalibrationWriteBusy.value = true;
      try {
        if (parsed === 0) {
          // CC02 only
          await writeAnalogValue(0, ANALOG_MIDI_ID_LSB_SECTION, 2);
          await writeAnalogValue(0, ANALOG_MIDI_ID_MSB_SECTION, 0);
          await writeSystemSetting(SS_BREATH_LINK_CC2_CC11, 0);
        } else if (parsed === 1) {
          // CC11 only
          await writeAnalogValue(0, ANALOG_MIDI_ID_LSB_SECTION, 11);
          await writeAnalogValue(0, ANALOG_MIDI_ID_MSB_SECTION, 0);
          await writeSystemSetting(SS_BREATH_LINK_CC2_CC11, 0);
        } else {
          // CC02 + CC11 (mirrored)
          await writeAnalogValue(0, ANALOG_MIDI_ID_LSB_SECTION, 2);
          await writeAnalogValue(0, ANALOG_MIDI_ID_MSB_SECTION, 0);
          await writeSystemSetting(SS_BREATH_LINK_CC2_CC11, 1);
        }

        breathCcMode.value = parsed;
      } finally {
        isCalibrationWriteBusy.value = false;
      }
    };

    const capturePitchBendCenter = async (): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      isCalibrationCaptureBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_CAL_CAPTURE_CENTER, 1);
        await delay(150);
        await refreshCalibrationImpl();
      } finally {
        isCalibrationCaptureBusy.value = false;
      }
    };

    const capturePitchBendMin = async (): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      isCalibrationCaptureBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_CAL_CAPTURE_MIN, 1);
        await delay(150);
        await refreshCalibrationImpl();
      } finally {
        isCalibrationCaptureBusy.value = false;
      }
    };

    const captureBreathZero = async (): Promise<void> => {
      if (!isConnected.value || isCalibrationAnyBusy.value) {
        return;
      }

      isCalibrationCaptureBusy.value = true;
      try {
        await writeSystemSetting(SS_BREATH_CAL_CAPTURE_ZERO, 1);
        await delay(150);
        await refreshCalibrationImpl();
      } finally {
        isCalibrationCaptureBusy.value = false;
      }
    };

    const onNoteChanged = (value: string) => {
      const parsed = Number(value);
      note.value = Number.isFinite(parsed) ? clamp(parsed, 0, 127) : 0;
    };

    const setMapping = () => {
      if (!canSet.value) {
        return;
      }

      const mask = effectiveMask.value;
      if (mask === null || mask === undefined) {
        return;
      }

      saxophoneActions.setMapping(mask, note.value);
    };

    const deleteMapping = () => {
      if (!canDelete.value) {
        return;
      }

      const mask = effectiveMask.value;
      if (mask === null || mask === undefined) {
        return;
      }

      saxophoneActions.deleteMapping(mask);
    };

    const loadMappings = async () => {
      if (!isConnected.value) {
        return;
      }
      await saxophoneActions.loadAllEntries();
    };

    const useEntry = (index: number) => {
      const entry = saxophoneState.entries[index];
      if (!entry || !entry.used) {
        return;
      }

      // Use selected entry as current edit target
      editMask.value = entry.mask;
      isMaskDirty.value = false;
      saxophoneState.currentMask = entry.mask;
      saxophoneState.lastUpdated = new Date();
      note.value = entry.note;
    };

    const deleteEntry = async (index: number) => {
      const entry = saxophoneState.entries[index];
      if (!entry || !entry.used) {
        return;
      }

      saxophoneActions.deleteMapping(entry.mask);

      // Optimistic UI update
      saxophoneState.entries[index] = {
        used: false,
        mask: entry.mask,
        note: entry.note,
      };

      // Confirm actual device state
      await delay(20);
      saxophoneActions.requestEntry(index);
    };

    return {
      isConnected,
      showSaxSection,
      showCalibrationSection,
      showMappingsSection,
      note,
      isTransposeBusy,
      transposePreset,
      transposePresetOptions,
      transposeOffsetText,
      maskHex,
      lastUpdated,
      canSet,
      canDelete,
      isLoadingEntries,
      receivedCount,
      nonEmptyEntries,
      requestMask,
      isMaskBitSet,
      toggleMaskBit,
      isCalibrationAnyBusy,
      isCalibrationWriteBusy,
      analog0PinText,
      analog1PinText,
      adcPinMapStatus,
      pbEnable,
      pbMin,
      pbCenter,
      pbDeadzone,
      breathZero,
      pbEnableText,
      pbMinText,
      pbCenterText,
      pbDeadzoneText,
      breathZeroText,
      refreshCalibration,
      breathCcMode,
      breathCcModeOptions,
      onBreathCcModeChanged,
      onPbDeadzoneChanged,
      onPbCenterChanged,
      onPbMinChanged,
      onBreathZeroChanged,
      capturePitchBendCenter,
      capturePitchBendMin,
      captureBreathZero,
      onTransposePresetChanged,
      onNoteChanged,
      setMapping,
      deleteMapping,
      loadMappings,
      useEntry,
      deleteEntry,

      // Backup/restore (PC-side JSON)
      isBackupBusy,
      backupStatus,
      importInput,
      importSyxInput,
      exportMappingsJson,
      triggerImportJson,
      onImportFileChanged,
      exportMappingsSyx,
      triggerImportSyx,
      onImportSyxFileChanged,
    };
  },
});
</script>

<style scoped>
.mask-bit-table {
  border-collapse: separate;
  border-spacing: 0.25rem;
}

.mask-bit-table td {
  padding: 0;
}
</style>
