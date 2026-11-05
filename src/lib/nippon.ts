import { Configuration, UserResourceApi } from "@joao.sumi/nippon-ten";

export const configuration = new Configuration({
    basePath: "/backend",
    baseOptions: { withCredentials: true },
});

export const userApi = new UserResourceApi(configuration);
