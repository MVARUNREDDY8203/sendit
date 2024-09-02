import { Flex, Image, Text } from "@chakra-ui/react";
import InputForm from "./components/InputForm/InputForm";

function App() {
    return (
        <>
            <Flex
                justifyContent={"center"}
                alignItems={"center"}
                h={"100vh"}
                direction={"column"}
            >
                {/* sendit logo image */}
                <Image
                    width={"720px"}
                    height={"400px"}
                    src='/sendit.png'
                ></Image>
                <InputForm></InputForm>
            </Flex>
        </>
    );
}

export default App;
