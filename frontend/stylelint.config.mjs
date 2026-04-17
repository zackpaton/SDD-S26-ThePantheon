/** Stylelint: standard rules with Tailwind CSS v4 at-directives allowed. */
const config = {
  extends: ["stylelint-config-standard"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "layer",
          "theme",
          "config",
          "source",
          "utility",
          "plugin",
          "custom-variant",
          "reference",
        ],
      },
    ],
    "import-notation": null,
    // Allow -webkit-* in CSS when needed (e.g. text-size-adjust on `html`).
    "property-no-vendor-prefix": null,
  },
}

export default config
