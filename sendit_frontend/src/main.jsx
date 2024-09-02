import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";
import customTheme from "./theme";

ReactDOM.createRoot(document.getElementById("root")).render(
    <ChakraProvider theme={customTheme}>
        <App />
    </ChakraProvider>
);
