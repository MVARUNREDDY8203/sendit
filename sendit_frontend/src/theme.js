// theme.js
import { extendTheme } from "@chakra-ui/react";

const customTheme = extendTheme({
    config: {
        initialColorMode: "dark", // Force dark mode
        useSystemColorMode: false, // Ignore system color mode
    },
});

export default customTheme;
