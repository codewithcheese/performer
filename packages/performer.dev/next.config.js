const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

const nextraConfig = withNextra();

module.exports = {
  ...nextraConfig,
  webpack: (config, options) => {
    const webpackConfig = nextraConfig.webpack(config, options);

    webpackConfig.module.rules.unshift({
      test: /\.sandpack$/,
      type: "asset/source",
    });

    // console.log(
    //   "webpackConfig",
    //   JSON.stringify(
    //     webpackConfig.module.rules,
    //     (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
    //   ),
    // );

    return webpackConfig;
  },
};
