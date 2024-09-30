/// <reference types="react" />
export declare function useCredential(): {
    credentials: {
        host: string;
        apiKey: string;
        ApiKeyIsFromConfigFile: boolean;
        HostIsFromConfigFile: boolean;
    };
    updateCredentials: () => Promise<void>;
    setHost: import("react").Dispatch<import("react").SetStateAction<string>>;
    setApiKey: import("react").Dispatch<import("react").SetStateAction<string>>;
    host: string;
    apiKey: string;
};
export default useCredential;
