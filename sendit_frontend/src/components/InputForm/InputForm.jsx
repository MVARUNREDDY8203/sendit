import {
    Button,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Text,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import axios from "axios";
import useShowToast from "../../hooks/useShowToast";

const InputForm = () => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [email, setEmail] = useState("");
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [isServerReady, setIsServerReady] = useState(false);
    const showToast = useShowToast();

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB in bytes

    useEffect(() => {
        let intervalId;
        const checkServerStatus = async () => {
            try {
                await axios.get(import.meta.env.VITE_WARMUP_ENDPOINT);
                setIsServerReady(true);
                clearInterval(intervalId); // Stop checking once the server is ready
            } catch (error) {
                console.error("Server not ready yet:", error);
                setIsServerReady(false);
            }
        };

        intervalId = setInterval(checkServerStatus, 3000); // Check every 3 seconds

        return () => clearInterval(intervalId); // Clean up on component unmount
    }, []);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                showToast(
                    "Error",
                    "File size exceeds 25 MB limit. Please choose a smaller file.",
                    "error"
                );
                return;
            }
            setFileName(file.name);
            setFile(file);
        }
    };

    const handleDeleteFile = () => {
        setFileName("");
        setFile(null);
    };

    const handleSendIt = async () => {
        if (!file || !email) {
            showToast(
                "Error",
                "Please select a file and enter an email address.",
                "error"
            );
            return;
        }

        if (!isServerReady) {
            showToast(
                "Waiting",
                "The server is still warming up. Please wait a moment and try again.",
                "warning"
            );
            return;
        }

        setUploading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("email", email);

            const response = await axios.post(
                import.meta.env.VITE_UPLOAD_ENDPOINT,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setMessage(response.data.message);
            showToast(
                "Success!!",
                "Downloadable file sent to " +
                    email +
                    " successfully!\nThe link will expire after 7 days.",
                "success"
            );
        } catch (error) {
            console.error("Error uploading file:", error);
            setMessage("Error uploading file");
            showToast("Error, failed to send file!", error.message, "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Flex>
                <Flex
                    direction={"column"}
                    textAlign='center'
                    p={5}
                    gap={3}
                    alignItems={"center"}
                >
                    <FormControl id='email' isRequired w={"400px"}>
                        <FormLabel>Email ID</FormLabel>
                        <Input
                            type='email'
                            placeholder='Enter your email'
                            size='md'
                            value={email}
                            onChange={handleEmailChange}
                            w={"400px"}
                        />
                    </FormControl>
                    <Input
                        type='file'
                        id='file-input'
                        display='none'
                        onChange={handleFileChange}
                    />
                    <Text fontWeight={"bold"}>
                        {fileName ? (
                            <>
                                <Flex gap={5}>
                                    <Text>{fileName}</Text>
                                    <Button
                                        cursor={"pointer"}
                                        onClick={handleDeleteFile}
                                    >
                                        Delete
                                    </Button>
                                </Flex>
                            </>
                        ) : (
                            <Button
                                as='label'
                                htmlFor='file-input'
                                size='md'
                                colorScheme='teal'
                                cursor='pointer'
                            >
                                {fileName ? "" : "Choose File"}
                            </Button>
                        )}
                    </Text>
                    {/* sendit btn */}
                    <Button
                        size='md'
                        colorScheme='teal'
                        cursor='pointer'
                        onClick={handleSendIt}
                        isDisabled={!(email && file && isServerReady)}
                        isLoading={uploading}
                        w={"100%"}
                    >
                        {isServerReady ? "SendIt" : "Waiting for server..."}
                    </Button>
                </Flex>
            </Flex>
            {/* server status */}
            <Flex
                position='fixed'
                bottom='4'
                right='4'
                alignItems='center'
                bg='white'
                p='2'
                borderRadius='full'
                boxShadow='md'
            >
                <div
                    style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: isServerReady ? "green" : "red",
                        marginRight: "8px",
                    }}
                />
                <Text fontSize='sm' fontWeight='medium' color={"black"}>
                    {isServerReady ? "Server Online" : "Server Offline"}
                </Text>
            </Flex>
        </>
    );
};

export default InputForm;
