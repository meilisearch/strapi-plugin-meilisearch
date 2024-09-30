declare const _default: {
    register(app: any): void;
    registerTrads(app: any): Promise<({
        data: string;
        locale: string;
    } | {
        data: {};
        locale: string;
    })[]>;
};
export default _default;
