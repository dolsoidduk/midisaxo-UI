<template>
  <ButtonLink
    :to="{
      name: routeName,
      params: {
        outputId,
        index: index,
      },
    }"
    :class="{
      'btn-highlight': isHighlighted,
      'btn-sax': sax,
      'btn-msg-note': isNote,
      'btn-msg-cc': isCc,
      'btn-msg-pc': isProgramChange,
      'btn-msg-preset': isPresetChange,
      'btn-msg-none': isNone,
    }"
  >
    <slot name="default"></slot>
  </ButtonLink>
</template>

<script lang="ts">
import { defineComponent, toRefs, computed } from "vue";
import { useHighlightAnimation } from "./../../composables/use-highlight-animation";
import { ButtonMessageType } from "./../../definitions";

export default defineComponent({
  name: "DeviceGrid",
  props: {
    index: {
      required: true,
      type: Number,
    },
    outputId: {
      required: true,
      type: String,
    },
    routeName: {
      required: true,
      type: String,
    },
    highlight: {
      default: null,
      type: Number, // abs time in ms
    },
    sax: {
      default: false,
      type: Boolean,
    },
    messageType: {
      default: null,
      type: Number,
    },
  },
  setup(props) {
    const { highlight, messageType } = toRefs(props);

    const mt = computed(() =>
      messageType.value === null || messageType.value === undefined
        ? null
        : Number(messageType.value),
    );

    const isNone = computed(() => mt.value === ButtonMessageType.None);

    const isPresetChange = computed(() => mt.value === ButtonMessageType.PresetChange);

    const isProgramChange = computed(() =>
      [
        ButtonMessageType.ProgramChange,
        ButtonMessageType.ProgramChangeInc,
        ButtonMessageType.ProgramChangeDec,
        ButtonMessageType.ProgramChangeOffsetInc,
        ButtonMessageType.ProgramChangeOffsetDec,
        ButtonMessageType.MidiBankSelect,
      ].includes(mt.value as any),
    );

    const isNote = computed(() =>
      [ButtonMessageType.Note, ButtonMessageType.NoteOffOnly].includes(mt.value as any),
    );

    const isCc = computed(() =>
      [
        ButtonMessageType.ControlChange,
        ButtonMessageType.ControlChangeOff,
        ButtonMessageType.ControlChange0Only,
      ].includes(mt.value as any),
    );

    return {
      ...useHighlightAnimation(highlight),
      isNone,
      isPresetChange,
      isProgramChange,
      isNote,
      isCc,
    };
  },
});
</script>
