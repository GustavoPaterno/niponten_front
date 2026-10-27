import {
    ComboResourceApi,
    IngredientResourceApi,
    InternalResourceApi,
    InternalRoleResourceApi,
    ProductResourceApi,
    SizeResourceApi,
    UserResourceApi,
} from "nippon-ten";

import { configuration } from "@/src/lib/nippon";

export const api = {
    combo: new ComboResourceApi(configuration),
    ingredient: new IngredientResourceApi(configuration),
    internal: new InternalResourceApi(configuration),
    internalRole: new InternalRoleResourceApi(configuration),
    product: new ProductResourceApi(configuration),
    size: new SizeResourceApi(configuration),
    user: new UserResourceApi(configuration),
};
