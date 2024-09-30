import { jsx, jsxs } from "react/jsx-runtime";
import { Page } from "@strapi/strapi/admin";
import { Routes, Route } from "react-router-dom";
import { Main } from "@strapi/design-system";
import { useIntl } from "react-intl";
import { g as getTranslation } from "./index-ypxt_yVr.mjs";
const HomePage = () => {
  const { formatMessage } = useIntl();
  return /* @__PURE__ */ jsx(Main, { children: /* @__PURE__ */ jsxs("h1", { children: [
    "Welcome to ",
    formatMessage({ id: getTranslation("plugin.name") })
  ] }) });
};
const App = () => {
  return /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(HomePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(Page.Error, {}) })
  ] });
};
export {
  App
};
//# sourceMappingURL=App-DiuEZM_J.mjs.map
