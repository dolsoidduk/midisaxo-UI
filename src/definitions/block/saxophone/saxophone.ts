import { markRaw } from "vue";
import { Block, IBlockDefinition } from "../../interface";

import RouteWrapper from "../../../components/RouteWrapper.vue";
import GlobalIcon from "../global/GlobalIcon.vue";
import SaxophoneView from "./SaxophoneView.vue";

export const SaxophoneBlock: IBlockDefinition = {
  block: Block.Saxophone,
  title: "Saxophone",
  routeName: "device-saxophone",
  iconComponent: markRaw(GlobalIcon),
  sections: {},
  routes: [
    {
      path: "saxophone",
      name: "device-saxophone",
      component: RouteWrapper,
      redirect: { name: "device-saxophone-main" },
      children: [
        {
          path: "main",
          name: "device-saxophone-main",
          component: SaxophoneView,
        },
      ],
    },
  ],
};
