declare module "*.json" {
    interface packageJson {
        name: string;
        version: string;
    }
    const resource: packageJson;
    export = resource;
}
