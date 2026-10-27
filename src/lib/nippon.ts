import { Configuration, UserResourceApi } from "nippon-ten";

export const configuration = new Configuration({
    basePath: "/backend",
    baseOptions: { withCredentials: true },
});

export const userApi = new UserResourceApi(configuration);
