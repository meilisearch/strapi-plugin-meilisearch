export declare function useAlert(): {
    handleNotification: ({ type, message, link, blockTransition, title, }: {
        type?: string | undefined;
        message?: string | undefined;
        link: any;
        blockTransition?: boolean | undefined;
        title: any;
    }) => void;
    checkForbiddenError: ({ response }: {
        response: any;
    }) => void;
};
export default useAlert;
