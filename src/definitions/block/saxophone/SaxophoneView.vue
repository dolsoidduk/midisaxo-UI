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
          :disabled="!isConnected || isCalibrationBusy"
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
            <FormToggle
              :value="analog1Enabled"
              class="toggle-sm labeled"
              @changed="onAnalog1EnabledChanged"
            >
              enabled
            </FormToggle>
            <span class="text-sm text-gray-200">
              <span class="faded">Cal</span>
              <span class="ml-2">{{ pbEnableText }}</span>
            </span>
          </div>

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
              :disabled="!isConnected || isCalibrationBusy"
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
              :disabled="!isConnected || isCalibrationBusy"
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
              :disabled="!isConnected || isCalibrationBusy"
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
              :disabled="!isConnected || isCalibrationBusy"
              @click.prevent="capturePitchBendCenter"
            >
              Capture center
            </Button>
            <Button
              :disabled="!isConnected || isCalibrationBusy"
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
            <FormToggle
              :value="analog0Enabled"
              class="toggle-sm labeled"
              @changed="onAnalog0EnabledChanged"
            >
              enabled
            </FormToggle>
          </div>

          <div class="mt-4">
            <label class="label">Breath CC</label>
            <FormSelect
              :value="breathCcMode"
              :options="breathCcModeOptions"
              :disabled="!isConnected || isCalibrationBusy"
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
              :disabled="!isConnected || isCalibrationBusy"
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
              :disabled="!isConnected || isCalibrationBusy"
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
import { Block, Request } from "../../../definitions";
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

    const isLoadingEntries = computed(() => saxophoneState.isLoadingEntries);
    const receivedCount = computed(
      () => Object.keys(saxophoneState.receivedEntries || {}).length,
    );

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
      if (currentMask.value === null || currentMask.value === undefined) {
        return "-";
      }
      const hex = (currentMask.value >>> 0).toString(16).padStart(8, "0");
      return `0x${hex}`;
    });

    const canSet = computed(
      () =>
        isConnected.value &&
        currentMask.value !== null &&
        Number.isFinite(note.value) &&
        note.value >= 0 &&
        note.value <= 127,
    );

    const canDelete = computed(
      () => isConnected.value && currentMask.value !== null,
    );

    const requestMask = () => saxophoneActions.requestCurrentMask();

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

    const isCalibrationBusy = ref(false);
    const analog0Enabled = ref<number | null>(null);
    const analog1Enabled = ref<number | null>(null);
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

    const readSystemSetting = async (index: number): Promise<number> => {
      let value: number = null;

      await sendMessage({
        command: Request.GetValue,
        handler: (res: number[]): void => {
          value = res?.[0];
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

    const ANALOG_ENABLE_SECTION = 0;

    const readAnalogEnabled = async (analogIndex: number): Promise<number> => {
      let value: number = null;

      await sendMessage({
        command: Request.GetValue,
        handler: (res: number[]): void => {
          value = res?.[0];
        },
        config: {
          block: Block.Analog,
          section: ANALOG_ENABLE_SECTION,
          index: analogIndex,
        },
      });

      return value;
    };

    const writeAnalogEnabled = async (
      analogIndex: number,
      value: number,
    ): Promise<void> => {
      await sendMessage({
        command: Request.SetValue,
        handler: (): void => {},
        config: {
          block: Block.Analog,
          section: ANALOG_ENABLE_SECTION,
          index: analogIndex,
          value,
        },
      });
    };

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
        a0Enabled,
        a1Enabled,
        breathLink,
        a0MidiIdLsb,
      ] = await Promise.all([
        readSystemSetting(SS_PB_CAL_ENABLE),
        readSystemSetting(SS_PB_CAL_MIN),
        readSystemSetting(SS_PB_CAL_CENTER),
        readSystemSetting(SS_BREATH_CAL_ZERO),
        readSystemSetting(SS_TRANSPOSE_PRESET),
        readSystemSetting(SS_PB_DEADZONE),
        readAnalogEnabled(0),
        readAnalogEnabled(1),
        readSystemSetting(SS_BREATH_LINK_CC2_CC11),
        readAnalogValue(0, ANALOG_MIDI_ID_LSB_SECTION),
      ]);

      pbEnable.value = Number.isFinite(enable) ? enable : null;
      pbMin.value = Number.isFinite(min) ? min : null;
      pbCenter.value = Number.isFinite(center) ? center : null;
      pbDeadzone.value = Number.isFinite(deadzone) ? deadzone : null;
      breathZero.value = Number.isFinite(zero) ? zero : null;

      analog0Enabled.value = Number.isFinite(a0Enabled) ? a0Enabled : null;
      analog1Enabled.value = Number.isFinite(a1Enabled) ? a1Enabled : null;

      // 0=CC02, 1=CC11, 2=CC02+CC11 (mirrored)
      if (Number.isFinite(breathLink) && breathLink) {
        breathCcMode.value = 2;
      } else if (Number.isFinite(a0MidiIdLsb) && Number(a0MidiIdLsb) === 11) {
        breathCcMode.value = 1;
      } else if (Number.isFinite(a0MidiIdLsb) && Number(a0MidiIdLsb) === 2) {
        breathCcMode.value = 0;
      } else {
        breathCcMode.value = null;
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
        const p = Number(preset);
        transposePreset.value = Number.isFinite(p) && p >= 0 && p <= 4 ? p : null;
      } finally {
        isTransposeBusy.value = false;
      }
    };

    const onTransposePresetChanged = async (value: string) => {
      if (!isConnected.value || isTransposeBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 4) {
        return;
      }

      isTransposeBusy.value = true;
      try {
        await writeSystemSetting(SS_TRANSPOSE_PRESET, parsed);
        transposePreset.value = parsed;
      } finally {
        isTransposeBusy.value = false;
      }
    };

    watch(
      isConnected,
      (v) => {
        if (v) {
          loadTransposePreset();
        } else {
          transposePreset.value = null;
          analog0Enabled.value = null;
          analog1Enabled.value = null;
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

    const refreshCalibration = async (): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      isCalibrationBusy.value = true;
      try {
        await refreshCalibrationImpl();
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const onAnalog0EnabledChanged = async (value: number): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      const v = value ? 1 : 0;

      isCalibrationBusy.value = true;
      try {
        await writeAnalogEnabled(0, v);
        analog0Enabled.value = v;
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const onAnalog1EnabledChanged = async (value: number): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      const v = value ? 1 : 0;

      isCalibrationBusy.value = true;
      try {
        await writeAnalogEnabled(1, v);
        analog1Enabled.value = v;
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const onPbDeadzoneChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return;
      }

      const v = clamp(parsed, 0, 2048);

      isCalibrationBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_DEADZONE, v);
        pbDeadzone.value = v;
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const onPbCenterChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return;
      }

      const v = clamp(parsed, 0, 16383);

      isCalibrationBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_CAL_CENTER, v);
        pbCenter.value = v;
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const onPbMinChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return;
      }

      const v = clamp(parsed, 0, 16383);

      isCalibrationBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_CAL_MIN, v);
        pbMin.value = v;
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const onBreathZeroChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return;
      }

      const v = clamp(parsed, 0, 16383);

      isCalibrationBusy.value = true;
      try {
        await writeSystemSetting(SS_BREATH_CAL_ZERO, v);
        breathZero.value = v;
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const breathCcModeOptions = () => [
      { value: 0, text: "CC02" },
      { value: 1, text: "CC11" },
      { value: 2, text: "CC02 + CC11" },
    ];

    const onBreathCcModeChanged = async (value: string): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
        return;
      }

      isCalibrationBusy.value = true;
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
        isCalibrationBusy.value = false;
      }
    };

    const capturePitchBendCenter = async (): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      isCalibrationBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_CAL_CAPTURE_CENTER, 1);
        await delay(150);
        await refreshCalibrationImpl();
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const capturePitchBendMin = async (): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      isCalibrationBusy.value = true;
      try {
        await writeSystemSetting(SS_PB_CAL_CAPTURE_MIN, 1);
        await delay(150);
        await refreshCalibrationImpl();
      } finally {
        isCalibrationBusy.value = false;
      }
    };

    const captureBreathZero = async (): Promise<void> => {
      if (!isConnected.value || isCalibrationBusy.value) {
        return;
      }

      isCalibrationBusy.value = true;
      try {
        await writeSystemSetting(SS_BREATH_CAL_CAPTURE_ZERO, 1);
        await delay(150);
        await refreshCalibrationImpl();
      } finally {
        isCalibrationBusy.value = false;
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
      saxophoneActions.setMapping(currentMask.value, note.value);
    };

    const deleteMapping = () => {
      if (!canDelete.value) {
        return;
      }
      saxophoneActions.deleteMapping(currentMask.value);
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
      isCalibrationBusy,
      analog0Enabled,
      analog1Enabled,
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
      onAnalog0EnabledChanged,
      onAnalog1EnabledChanged,
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
    };
  },
});
</script>
