export declare function useCollection(): {
    collections: never[];
    deleteCollection: ({ contentType }: {
        contentType: any;
    }) => Promise<void>;
    addCollection: ({ contentType }: {
        contentType: any;
    }) => Promise<void>;
    updateCollection: ({ contentType }: {
        contentType: any;
    }) => Promise<void>;
    reloadNeeded: boolean;
    refetchCollection: () => void;
    handleNotification: ({ type, message, link, blockTransition, title, }: {
        type?: string | undefined;
        message?: string | undefined;
        link: any;
        blockTransition?: boolean | undefined;
        title: any;
    }) => void;
};
export default useCollection;
