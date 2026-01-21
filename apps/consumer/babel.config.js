module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxRuntime: "automatic",
          jsxImportSource: "nativewind",
        },
      ],
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
