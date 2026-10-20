import { Configuration, UserResourceApi } from "nippon-ten";

// Client do backend (pacote "nippon-ten", gerado com typescript-axios; é o que está no package.json).
// A base "/backend" é atendida pelo proxy em src/app/backend/[...path]/route.ts.
const configuration = new Configuration({
    basePath: "/backend",
    baseOptions: { withCredentials: true },
});

export const userApi = new UserResourceApi(configuration);
